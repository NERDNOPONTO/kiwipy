import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Link as LinkIcon,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [offersMap, setOffersMap] = useState<Record<string, any[]>>({});
  const [salesMap, setSalesMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Fetch Profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
        
          if (profile) {
            // Fetch Products for this producer
            const { data: productsData, error: productsError } = await supabase
              .from('products')
              .select('*')
              .eq('producer_id', profile.id)
              .order('created_at', { ascending: false });

            if (productsError) throw productsError;
            setProducts(productsData || []);

            if (productsData && productsData.length > 0) {
              const productIds = productsData.map(p => p.id);

              // Fetch Offers
              const { data: offersData } = await supabase
                .from('offers')
                .select('*')
                .in('product_id', productIds);
              
              const offersByProduct: Record<string, any[]> = {};
              offersData?.forEach(offer => {
                if (!offersByProduct[offer.product_id]) offersByProduct[offer.product_id] = [];
                offersByProduct[offer.product_id].push(offer);
              });
              setOffersMap(offersByProduct);

              // Fetch Sales Counts (Approved Orders)
              // Note: For large datasets, this should be optimized or paginated.
              const { data: ordersData } = await supabase
                .from('orders')
                .select('product_id, status')
                .in('product_id', productIds);

              const salesByProduct: Record<string, number> = {};
              ordersData?.forEach(order => {
                if (order.status && order.status.toLowerCase() === 'approved') {
                  salesByProduct[order.product_id] = (salesByProduct[order.product_id] || 0) + 1;
                }
              });
              setSalesMap(salesByProduct);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyLink = (link: string, label: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productToDelete));
      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o produto.",
      });
    } finally {
      setProductToDelete(null);
    }
  };

  const attemptDelete = (product: any) => {
    const salesCount = salesMap[product.id] || 0;
    if (salesCount > 0) {
      toast({
        variant: "destructive",
        title: "Ação bloqueada",
        description: "Este produto já possui vendas realizadas e não pode ser excluído para manter o histórico dos clientes.",
      });
      return;
    }
    setProductToDelete(product.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus produtos e ofertas</p>
          </div>
          <Button variant="accent" asChild>
            <Link to="/dashboard/products/new">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Pesquisar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary border-0"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {isLoading ? (
             <div className="p-12 text-center text-muted-foreground">Carregando produtos...</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Preço</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendas</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-2xl">📦</div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{product.name}</div>
                          <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {product.description || "Sem descrição"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_active 
                          ? 'bg-success/10 text-success' 
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {salesMap[product.id] || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Copiar Links">
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Links de Checkout</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => copyLink(`${window.location.origin}/checkout/${product.id}`, "Link Principal")}>
                              <Copy className="w-4 h-4 mr-2" /> Link Principal (Padrão)
                            </DropdownMenuItem>
                            
                            {offersMap[product.id]?.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Ofertas</DropdownMenuLabel>
                                {offersMap[product.id].map((offer: any) => (
                                  <DropdownMenuItem key={offer.id} onClick={() => copyLink(`${window.location.origin}/checkout/${offer.id}`, `Link da oferta ${offer.title}`)}>
                                    <Copy className="w-4 h-4 mr-2" /> {offer.title} - {formatPrice(offer.price)}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/dashboard/products/edit/${product.id}`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => attemptDelete(product)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                   <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>

        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto e todas as suas configurações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir Produto
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  );
};

export default Products;
