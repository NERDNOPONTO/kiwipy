import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw } from "lucide-react";
import { SalesMetrics } from "@/components/sales/SalesMetrics";
import { SalesChart } from "@/components/sales/SalesChart";
import { TransactionsTable } from "@/components/sales/TransactionsTable";
import { ProductPerformance } from "@/components/sales/ProductPerformance";
import { PaymentMethodStats } from "@/components/sales/PaymentMethodStats";

const Sales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSales = async () => {
    setIsLoading(true);
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
          // Fetch All Orders for this producer
          const { data: orders, error } = await supabase
            .from('orders')
            .select(`
              id,
              amount,
              status,
              created_at,
              payment_data,
              product_id,
              customers (
                full_name,
                email
              ),
              products (
                id,
                name,
                image_url
              )
            `)
            .eq('producer_id', profile.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setSales(orders || []);
        }
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    // Real-time subscription for new orders
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleExport = () => {
    const headers = ["ID", "Data", "Cliente", "Email", "Produto", "Valor", "Status", "Método"];
    const csvContent = [
      headers.join(","),
      ...sales.map(sale => [
        sale.id,
        new Date(sale.created_at).toLocaleDateString('pt-AO'),
        `"${sale.customers?.full_name || ''}"`,
        sale.customers?.email,
        `"${sale.products?.name || ''}"`,
        sale.amount,
        sale.status,
        sale.payment_data?.paymentMethod || ''
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `vendas_infopay_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard de Vendas</h1>
            <p className="text-muted-foreground mt-1">Visão completa do seu negócio e processamento de pagamentos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchSales} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="default" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Relatório Completo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border p-1 h-auto">
            <TabsTrigger value="overview" className="px-4 py-2">Visão Geral</TabsTrigger>
            <TabsTrigger value="transactions" className="px-4 py-2">Transações</TabsTrigger>
            <TabsTrigger value="products" className="px-4 py-2">Produtos</TabsTrigger>
            <TabsTrigger value="analytics" className="px-4 py-2">Analytics & Funil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 focus-visible:ring-0">
             <SalesMetrics orders={sales} isLoading={isLoading} />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2">
                 <SalesChart orders={sales} isLoading={isLoading} />
               </div>
               <div className="lg:col-span-1">
                 <PaymentMethodStats orders={sales} />
               </div>
             </div>
          </TabsContent>
          
          <TabsContent value="transactions" className="focus-visible:ring-0">
             <TransactionsTable orders={sales} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="products" className="focus-visible:ring-0">
             <ProductPerformance orders={sales} />
          </TabsContent>

          <TabsContent value="analytics" className="focus-visible:ring-0">
             <div className="grid gap-6 md:grid-cols-2">
               <div className="p-8 border rounded-xl bg-card flex flex-col items-center justify-center text-center min-h-[300px]">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 text-3xl">🗺️</div>
                  <h3 className="font-medium text-lg mb-2">Análise Geográfica</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Visualize de onde vêm seus clientes. O mapa interativo e lista de cidades estarão disponíveis em breve.
                  </p>
               </div>
               <div className="p-8 border rounded-xl bg-card flex flex-col items-center justify-center text-center min-h-[300px]">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 text-3xl">📊</div>
                  <h3 className="font-medium text-lg mb-2">Funil de Vendas</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Acompanhe a conversão de visitantes para clientes. Integração com dados de tráfego em desenvolvimento.
                  </p>
               </div>
               <div className="p-8 border rounded-xl bg-card flex flex-col items-center justify-center text-center min-h-[300px] md:col-span-2">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 text-3xl">🤖</div>
                  <h3 className="font-medium text-lg mb-2">Insights Automáticos com IA</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Nosso sistema de inteligência artificial analisará seus dados para encontrar oportunidades de crescimento.
                  </p>
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Sales;
