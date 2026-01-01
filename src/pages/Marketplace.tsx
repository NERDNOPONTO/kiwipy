
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Store, Filter, CheckCircle, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  commission_rate: number;
  marketplace_category: string;
  affiliate_approval_type: 'auto' | 'manual';
  producer: {
    full_name: string;
  };
  affiliation_status?: 'none' | 'pending' | 'approved' | 'rejected';
}

const Marketplace = () => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplaceProducts();
  }, []);

  const fetchMarketplaceProducts = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      let currentProfileId = null;
      if (currentUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', currentUserId)
          .single();
        
        if (profile) {
          currentProfileId = profile.id;
          setProfileId(profile.id);
        }
      }

      // 1. Fetch products
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          commission_rate,
          marketplace_category,
          affiliate_approval_type,
          producer_id
        `)
        .eq('is_marketplace', true)
        .eq('is_active', true);

      // Filter out own products if user is logged in
      if (currentProfileId) {
        query = query.neq('producer_id', currentProfileId);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;

      // Manually fetch producer names
      const producerIds = [...new Set(productsData?.map((p: any) => p.producer_id) || [])];
      let producersMap: Record<string, string> = {};
      
      if (producerIds.length > 0) {
        const { data: producers } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', producerIds);
          
        producers?.forEach((p: any) => {
          producersMap[p.id] = p.full_name;
        });
      }

      let formattedProducts: MarketplaceProduct[] = [];

      if (productsData) {
        // 2. Fetch existing affiliations for the current user
        let userAffiliations: any[] = [];
        if (currentProfileId) {
          const { data: affiliations } = await supabase
            .from('affiliates')
            .select('product_id, status')
            .eq('user_id', currentProfileId);
          
          if (affiliations) {
            userAffiliations = affiliations;
          }
        }

        // 3. Merge data
        formattedProducts = productsData.map((p: any) => {
          const affiliation = userAffiliations.find(a => a.product_id === p.id);
          return {
            ...p,
            producer: { full_name: producersMap[p.producer_id] || 'Produtor' },
            affiliation_status: affiliation ? affiliation.status : 'none'
          };
        });
      }

      setProducts(formattedProducts);
    } catch (error: any) {
      console.error('Error fetching marketplace:', error);
      toast({
        title: "Erro ao carregar marketplace",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAffiliation = async (product: MarketplaceProduct) => {
    if (!profileId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para se afiliar.",
        variant: "destructive",
      });
      return;
    }

    setRequestingId(product.id);

    try {
      // Create affiliate record
      const status = product.affiliate_approval_type === 'auto' ? 'approved' : 'pending';
      
      const { error } = await supabase
        .from('affiliates')
        .insert({
          user_id: profileId,
          product_id: product.id,
          status: status,
          commission_rate: product.commission_rate
        });

      if (error) {
        // Handle unique constraint violation (code 23505)
        if (error.code === '23505') {
          toast({
            title: "Solicitação já existe",
            description: "Você já solicitou afiliação para este produto.",
            variant: "warning"
          });
          fetchMarketplaceProducts(); // Refresh to update UI state
          return;
        }
        throw error;
      }

      toast({
        title: status === 'approved' ? "Afiliação Aprovada!" : "Solicitação Enviada",
        description: status === 'approved' 
          ? "Você já pode começar a vender este produto."
          : "O produtor analisará sua solicitação em breve.",
        variant: status === 'approved' ? "default" : "secondary"
      });

      // Refresh list to update status
      fetchMarketplaceProducts();

    } catch (error: any) {
      console.error('Error requesting affiliation:', error);
      toast({
        title: "Erro ao solicitar afiliação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRequestingId(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.marketplace_category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
              <Store className="w-8 h-8 text-primary" />
              Marketplace de Afiliados
            </h1>
            <p className="text-muted-foreground mt-1">
              Encontre produtos incríveis para promover e ganhar comissões.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg border border-border/50 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar produtos..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="business">Negócios e Carreira</SelectItem>
              <SelectItem value="marketing">Marketing Digital</SelectItem>
              <SelectItem value="health">Saúde e Bem-estar</SelectItem>
              <SelectItem value="education">Educação</SelectItem>
              <SelectItem value="finance">Finanças</SelectItem>
              <SelectItem value="tech">Tecnologia</SelectItem>
              <SelectItem value="lifestyle">Estilo de Vida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[350px] bg-secondary/20 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Tente ajustar seus filtros ou volte mais tarde para ver novos produtos disponíveis para afiliação.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
                <div className="aspect-video bg-secondary/30 relative overflow-hidden group">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/50 to-secondary/10">
                      <Store className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/80">
                      {product.commission_rate}% Comissão
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {product.marketplace_category || 'Geral'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-1" title={product.name}>
                    {product.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs mt-1">
                    {product.description || "Sem descrição disponível."}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-2 flex-1">
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {product.producer.full_name.charAt(0)}
                    </div>
                    <span className="truncate">{product.producer.full_name}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preço Máximo:</span>
                      <span className="font-medium">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sua Comissão:</span>
                      <span className="font-bold text-emerald-500">
                        {formatCurrency((product.price * product.commission_rate) / 100)}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  {product.affiliation_status === 'approved' ? (
                    <Button className="w-full" variant="outline" disabled>
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                      Já é Afiliado
                    </Button>
                  ) : product.affiliation_status === 'pending' ? (
                    <Button className="w-full" variant="secondary" disabled>
                      <Clock className="w-4 h-4 mr-2" />
                      Aguardando Aprovação
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      onClick={() => handleRequestAffiliation(product)}
                      disabled={requestingId === product.id}
                    >
                      {requestingId === product.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processando...
                        </div>
                      ) : (
                        "Solicitar Afiliação"
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;
