import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Users, CreditCard, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalProducerBalance: 0, // 90%
    totalCompanyBalance: 0,  // 10%
    totalSaaSRevenue: 0,     // Subscriptions
    activeProducers: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // 1. Calculate Sales Splits (90% vs 10%)
      const { data: orders } = await supabase
        .from('orders')
        .select('amount, status')
        .eq('status', 'approved');

      let totalSales = 0;
      if (orders) {
        totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
      }

      // 2. Calculate SaaS Revenue (Real payments from Orders)
      // Sum orders that are subscriptions (identified by payment_data->subscription OR product name 'Assinatura Diária')
      const { data: saasOrders } = await supabase
        .from('orders')
        .select('amount, payment_data, products!inner(name)')
        .eq('status', 'approved');
      
      let totalSaaS = 0;
      if (saasOrders) {
        totalSaaS = saasOrders.reduce((sum, o) => {
          const isSub = (o.payment_data && (o.payment_data as any).subscription) || 
                        (o.products && (o.products as any).name === 'Assinatura Diária');
          return isSub ? sum + o.amount : sum;
        }, 0);
      }
      
      // Recalculate sales splits excluding SaaS orders
      const totalRevenue = totalSales; // This includes SaaS if they are in orders table
      const realProductSales = totalRevenue - totalSaaS;
      
      const producerShare = realProductSales * 0.90;
      const companyShare = (realProductSales * 0.10); // 10% of products ONLY (SaaS is separate)

      // 3. Count Producers & Active Subscriptions
      const { count: producerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'producer');

      const { count: subscriptionCount } = await supabase
        .from('saas_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setMetrics({
        totalProducerBalance: producerShare,
        totalCompanyBalance: companyShare, // 10% sobre vendas (revertido para evitar confusão no saque)
        totalSaaSRevenue: totalSaaS,
        activeProducers: producerCount || 0,
        activeSubscriptions: subscriptionCount || 0
      });

    } catch (error) {
      console.error("Error loading admin metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Geral</h2>
          <p className="text-muted-foreground">Visão geral financeira e operacional da plataforma.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo a Entregar (Produtores)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalProducerBalance)}</div>
              <p className="text-xs text-muted-foreground">
                90% do volume total de vendas aprovadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita da Empresa (Taxas)</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.totalCompanyBalance)}</div>
              <p className="text-xs text-muted-foreground">
                10% de comissão sobre vendas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita de Assinaturas (SaaS)</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalSaaSRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                MRR (Receita Recorrente Mensal)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
           <Card>
             <CardHeader>
                <CardTitle>Métricas Operacionais</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Produtores Cadastrados</span>
                    </div>
                    <span className="font-bold">{metrics.activeProducers}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>Assinaturas SaaS Ativas</span>
                    </div>
                    <span className="font-bold">{metrics.activeSubscriptions}</span>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
