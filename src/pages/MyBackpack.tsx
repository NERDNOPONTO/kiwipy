import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Package, Briefcase, CheckCircle, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MyBackpack = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAffiliations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get user profile id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          setProfileId(profile.id);

          // Fetch approved affiliations with product details
          const { data, error } = await supabase
            .from('affiliates')
            .select(`
              *,
              products:product_id (
                id,
                name,
                description,
                image_url,
                price,
                commission_rate,
                marketplace_category,
                producer_id
              )
            `)
            .eq('user_id', profile.id)
            .eq('status', 'approved');

          if (error) throw error;
          
          // Enrich with producer info manually if needed, or rely on joins if configured
          // For now, assuming basic product info is enough. 
          // If we need producer name, we might need a deeper query or separate fetch.
          // Let's stick to what we have but format it nicely.
          
          setProducts(data || []);
        }
      } catch (error) {
        console.error("Error fetching affiliations:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar afiliações",
          description: "Não foi possível carregar seus produtos afiliados."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAffiliations();
  }, [toast]);

  const copyLink = (productId: string) => {
    if (!profileId) return;
    
    const link = `${window.location.origin}/checkout/${productId}?ref=${profileId}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link copiado!",
      description: "Link de afiliado copiado para a área de transferência.",
    });
  };

  const openLink = (productId: string) => {
    if (!profileId) return;
    const link = `${window.location.origin}/checkout/${productId}?ref=${profileId}`;
    window.open(link, '_blank');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.products?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.products?.marketplace_category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary" />
              Minha Mochila
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Gerencie seus produtos afiliados e acesse seus links de divulgação exclusivos.
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg border border-border/50 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar em meus produtos..." 
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[200px] w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-dashed border-border">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground">Nenhuma afiliação encontrada</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto mb-8">
              Você ainda não se afiliou a nenhum produto. Explore o Marketplace para encontrar produtos para promover.
            </p>
            <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90">
              <a href="/dashboard/marketplace">Ir para o Marketplace</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((affiliation) => (
              <Card key={affiliation.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group">
                <div className="aspect-video bg-secondary/30 relative overflow-hidden">
                  {affiliation.products?.image_url ? (
                    <img 
                      src={affiliation.products.image_url} 
                      alt={affiliation.products.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/50 to-secondary/10">
                      <Package className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-sm backdrop-blur-md">
                      {affiliation.commission_rate || affiliation.products.commission_rate}% Comissão
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/80 text-xs">
                       {affiliation.products.marketplace_category || 'Geral'}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg line-clamp-1" title={affiliation.products?.name}>
                    {affiliation.products?.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs mt-1">
                    {affiliation.products?.description || "Sem descrição disponível."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-1 space-y-3">
                  <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(affiliation.products?.price || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">Sua Comissão:</span>
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(((affiliation.products?.price || 0) * (affiliation.commission_rate || affiliation.products.commission_rate)) / 100)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-center">
                    <div className="bg-background rounded-md p-2 border border-border/50">
                      <div className="text-muted-foreground mb-1">Vendas</div>
                      <div className="font-bold text-lg">{affiliation.sales_count || 0}</div>
                    </div>
                    <div className="bg-background rounded-md p-2 border border-border/50">
                      <div className="text-muted-foreground mb-1">Ganhos</div>
                      <div className="font-bold text-emerald-600">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', notation: "compact" }).format(affiliation.total_commission_earned || 0)}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 gap-2">
                  <Button 
                    className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" 
                    variant="outline"
                    onClick={() => copyLink(affiliation.products.id)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button 
                    size="icon"
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => openLink(affiliation.products.id)}
                    title="Testar Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyBackpack;
