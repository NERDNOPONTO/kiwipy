import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users,
  Download,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Mail
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AffiliatesMetrics } from "@/components/affiliates/AffiliatesMetrics";
import { AffiliatesTable } from "@/components/affiliates/AffiliatesTable";
import { AffiliatePerformanceChart } from "@/components/affiliates/AffiliatePerformanceChart";
import { AffiliateMaterials } from "@/components/affiliates/AffiliateMaterials";
import { AffiliateCommissions } from "@/components/affiliates/AffiliateCommissions";
import { AffiliateRequests } from "@/components/affiliates/AffiliateRequests";

const Affiliates = () => {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAffiliates = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get Producer Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          // Get Products IDs owned by producer
          const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('producer_id', profile.id);
          
          const productIds = products?.map(p => p.id) || [];

          if (productIds.length > 0) {
            // Get Affiliates linked to these products
            // Note: We need to ensure the relationship is correctly detected by Supabase client
            // If the foreign key name is standard, it works.
            const { data: affiliatesData, error } = await supabase
              .from('affiliates')
              .select(`
                *,
                profiles:user_id (full_name, avatar_url),
                products:product_id (name)
              `)
              .in('product_id', productIds);

            if (error) throw error;

            const formattedAffiliates = affiliatesData.map((aff: any) => ({
              id: aff.id,
              name: aff.profiles?.full_name || 'Usuário Desconhecido',
              email: 'email@oculto.com', // Profiles table might not have email, or we shouldn't expose it directly
              avatar_url: aff.profiles?.avatar_url,
              status: aff.status,
              tier: aff.sales_count > 100 ? 'Diamond' : aff.sales_count > 50 ? 'Gold' : 'Bronze', // Calculated tier
              sales_count: aff.sales_count || 0,
              conversion_rate: 0, // Need to calculate based on visits vs sales
              total_revenue: 0, // Need to calculate from orders
              total_commissions: aff.total_commission_earned || 0,
              created_at: aff.created_at,
              product_name: aff.products?.name
            }));

            setAffiliates(formattedAffiliates);

            // Fetch Orders for Chart (Affiliate Sales)
            const { data: orders } = await supabase
              .from('orders')
              .select('amount, created_at, affiliate_id')
              .not('affiliate_id', 'is', null)
              .in('product_id', productIds)
              .order('created_at', { ascending: true });

            if (orders && orders.length > 0) {
              // Group by month
              const monthlyData = orders.reduce((acc: any, order) => {
                const date = new Date(order.created_at);
                const month = date.toLocaleString('default', { month: 'short' });
                
                if (!acc[month]) {
                  acc[month] = { name: month, vendas: 0, comissoes: 0 };
                }
                
                acc[month].vendas += Number(order.amount);
                acc[month].comissoes += Number(order.amount) * 0.1; // Estimate 10%
                
                return acc;
              }, {});

              setChartData(Object.values(monthlyData));
            } else {
              setChartData([]);
            }
          } else {
            setAffiliates([]);
            setChartData([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      // Fallback to empty or keep loading false
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Gestão de Afiliados</h1>
            <p className="text-muted-foreground mt-1">Gerencie parceiros, comissões e impulsione suas vendas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchAffiliates} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="accent">
              <Plus className="w-4 h-4 mr-2" />
              Convidar Afiliado
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border p-1 h-auto">
            <TabsTrigger value="overview" className="px-4 py-2">Visão Geral</TabsTrigger>
            <TabsTrigger value="affiliates" className="px-4 py-2">Meus Afiliados</TabsTrigger>
            <TabsTrigger value="commissions" className="px-4 py-2">Comissões & Pagamentos</TabsTrigger>
            <TabsTrigger value="requests" className="px-4 py-2">Solicitações</TabsTrigger>
            <TabsTrigger value="materials" className="px-4 py-2">Materiais</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 focus-visible:ring-0">
            <AffiliatesMetrics affiliates={affiliates} isLoading={isLoading} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2">
                 <AffiliatePerformanceChart data={chartData} />
               </div>
               <div className="lg:col-span-1 space-y-6">
                 {/* Quick Actions Card */}
                 <div className="bg-card border rounded-xl p-6">
                   <h3 className="font-semibold mb-4">Ações Rápidas</h3>
                   <div className="space-y-2">
                     <Button variant="outline" className="w-full justify-start">
                       <Mail className="w-4 h-4 mr-2" /> Enviar Broadcast
                     </Button>
                     <Button variant="outline" className="w-full justify-start">
                       <Settings className="w-4 h-4 mr-2" /> Configurar Comissões
                     </Button>
                     <Button variant="outline" className="w-full justify-start">
                       <Download className="w-4 h-4 mr-2" /> Relatório Mensal
                     </Button>
                   </div>
                 </div>

                 {/* Top Affiliate Mini List */}
                 <div className="bg-card border rounded-xl p-6">
                   <h3 className="font-semibold mb-4">Top 3 Afiliados do Mês</h3>
                   <div className="space-y-4">
                     {affiliates.slice(0, 3).map((aff, i) => (
                       <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                             {i + 1}
                           </div>
                           <div>
                             <p className="text-sm font-medium">{aff.name}</p>
                             <p className="text-xs text-muted-foreground">{aff.sales_count} vendas</p>
                           </div>
                         </div>
                         <span className="text-xs font-bold text-emerald-600">
                           {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(aff.total_commissions)}
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="affiliates" className="focus-visible:ring-0">
            <AffiliatesTable affiliates={affiliates} isLoading={isLoading} onRefresh={fetchAffiliates} />
          </TabsContent>

          <TabsContent value="commissions" className="focus-visible:ring-0">
             <AffiliateCommissions />
          </TabsContent>

          <TabsContent value="requests" className="focus-visible:ring-0">
             <AffiliateRequests />
          </TabsContent>

          <TabsContent value="materials" className="focus-visible:ring-0">
             <AffiliateMaterials />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Affiliates;
