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

      const producerShare = totalSales * 0.90;
      const companyShare = totalSales * 0.10;

      // 2. Calculate SaaS Revenue (Simplified: Sum of prices of active subscriptions)
      // Ideally this should come from a payments table, but we'll use active MRR for now
      const { data: subscriptions, error: subError } = await supabase
        .from('saas_subscriptions')
        .select(`
          status,
          plan:saas_plans(price)
        `)
        .eq('status', 'active');
      
      let saasMRR = 0;
      if (subscriptions) {
        // @ts-ignore
        saasMRR = subscriptions.reduce((sum, sub) => sum + (sub.plan?.price || 0), 0);
      }

      // 3. Count Producers
      const { count: producerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'producer');

      setMetrics({
        totalProducerBalance: producerShare,
        totalCompanyBalance: companyShare,
        totalSaaSRevenue: saasMRR,
        activeProducers: producerCount || 0,
        activeSubscriptions: subscriptions?.length || 0
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
