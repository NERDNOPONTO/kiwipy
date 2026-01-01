import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  BarChart3,
  Plus,
  MoreHorizontal
} from "lucide-react";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { ProductMetrics } from "@/components/dashboard/ProductMetrics";
import { PaymentAnalysis } from "@/components/dashboard/PaymentAnalysis";
import { AlertsPanel, AlertItem } from "@/components/dashboard/AlertsPanel";
import { CustomerMetrics } from "@/components/dashboard/CustomerMetrics";

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    revenue: 0,
    sales: 0,
    customers: 0,
    activeProducts: 0,
    pendingBalance: 0,
    availableBalance: 0
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState({ unique: 0, new: 0, repeatRate: 0, ltv: 0 });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
      
        if (profile) {
          setUserProfile(profile);

          // Fetch basic counts
          const { count: salesCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('producer_id', profile.id)
            .eq('status', 'approved');

          const { data: customersData } = await supabase
             .from('orders')
             .select('customer_id')
             .eq('producer_id', profile.id);
          const uniqueCustomersCount = new Set(customersData?.map(o => o.customer_id)).size;

          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('producer_id', profile.id)
            .eq('is_active', true);

          // Fetch all orders and withdrawals for financial calculation
          const { data: allOrders } = await supabase
            .from('orders')
            .select(`
              amount,
              net_amount,
              commission_platform,
              product_id,
              created_at,
              customer_id,
              status,
              payment_data,
              products (
                name
              )
            `)
            .eq('producer_id', profile.id);

          const { data: withdrawals } = await supabase
            .from('withdrawals')
            .select('amount, status')
            .eq('user_id', profile.id);
            
          if (allOrders) {
            // Case-insensitive status check
            const salesData = allOrders.filter(order => order.status && order.status.toLowerCase() === 'approved');
            
            // Financial Calculations
            const totalSales = salesData.reduce((sum, order) => sum + order.amount, 0);
            
            // Calculate Net Income (Saldo Líquido do Produtor)
            // Regra de Ouro: 
            // 1. Assinaturas (SaaS) -> 100% para Admin (0% para Produtor)
            // 2. Vendas de Produtos -> 90% para Produtor (10% Taxa Plataforma)
            const netIncome = salesData.reduce((sum, order) => {
                const productName = order.products?.name || '';
                const isSubscription = 
                    (order.payment_data && order.payment_data.subscription) || 
                    productName === 'Assinatura Diária';

                if (isSubscription) {
                    // Produtor não recebe nada por assinaturas do sistema
                    return sum + 0;
                } else {
                    // Venda de produto próprio: Recebe 90%
                    // Priorizamos o cálculo local para garantir a regra visualmente, 
                    // mas idealmente viria do banco (order.net_amount).
                    // Se o banco estiver retornando 100% (erro), forçamos 90% aqui.
                    const dbNetAmount = order.net_amount ? Number(order.net_amount) : null;
                    const grossAmount = Number(order.amount);
                    
                    // Se o valor do banco for igual ao bruto (100%), assumimos que o trigger falhou e aplicamos 90%
                    if (dbNetAmount && dbNetAmount < grossAmount) {
                         return sum + dbNetAmount;
                    }
                    return sum + (grossAmount * 0.9);
                }
            }, 0);

            // Calculate Withdrawals
            const pendingWithdrawal = withdrawals
                ?.filter(w => w.status === 'pending')
                .reduce((sum, w) => sum + w.amount, 0) || 0;

            const totalWithdrawn = withdrawals
                ?.filter(w => ['approved', 'paid'].includes(w.status))
                .reduce((sum, w) => sum + w.amount, 0) || 0;

            // Available to withdraw = Net Income - (Pending + Withdrawn)
            const availableToWithdraw = Math.max(0, netIncome - pendingWithdrawal - totalWithdrawn);

            setStats({
                revenue: totalSales,
                sales: salesCount || 0,
                customers: uniqueCustomersCount,
                activeProducts: productsCount || 0,
                pendingBalance: pendingWithdrawal,
                availableBalance: availableToWithdraw
            });

            // --- 1. Top Products ---
            const productStats = salesData.reduce((acc: any, sale: any) => {
              const pid = sale.product_id;
              if (!acc[pid]) {
                acc[pid] = {
                  id: pid,
                  name: sale.products?.name || 'Produto Desconhecido',
                  sales: 0,
                  revenue: 0,
                  growth: 0 
                };
              }
              acc[pid].sales += 1;
              acc[pid].revenue += sale.amount;
              return acc;
            }, {});
            
            const sortedProducts = Object.values(productStats)
              .sort((a: any, b: any) => b.revenue - a.revenue)
              .slice(0, 5);
              
            setTopProducts(sortedProducts);

            // --- 2. Sales Chart (Pass raw data to component) ---
            setSalesChartData(salesData);

            // --- 3. Payment Methods ---
            const paymentCounts = salesData.reduce((acc: any, sale: any) => {
                // Try to extract method from payment_data
                let method = 'Desconhecido';
                if (sale.payment_data) {
                    // Check common fields based on EMIS/Proxypay/etc
                    if (sale.payment_data.paymentMethod) method = sale.payment_data.paymentMethod;
                    else if (sale.payment_data.method) method = sale.payment_data.method;
                    // If method is still unknown but we have a successful transaction, assume Multicaixa for now as it's dominant
                    // or check reference format if needed.
                    else method = 'Multicaixa'; // Default assumption for this market if unspecified
                } else {
                    method = 'Multicaixa'; // Fallback
                }
                
                // Normalize names
                if (method.toLowerCase().includes('multicaixa') || method.toLowerCase().includes('mcx')) method = 'Multicaixa';
                if (method.toLowerCase().includes('card') || method.toLowerCase().includes('visa') || method.toLowerCase().includes('master')) method = 'Cartão';
                
                acc[method] = (acc[method] || 0) + 1;
                return acc;
            }, {});

            const totalSalesCount = salesData.length;
            const paymentMethodsData = Object.entries(paymentCounts).map(([name, count], index) => {
                const colors = ["#f97316", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6"];
                return {
                    name: name,
                    value: Math.round(((count as number) / totalSalesCount) * 100),
                    color: colors[index % colors.length]
                };
            });
            setPaymentMethods(paymentMethodsData);

            // --- 4. Customer Metrics ---
            const uniqueCustomers = new Set(salesData.map((s: any) => s.customer_id));
            const uniqueCount = uniqueCustomers.size;
            
            // New Customers: Count customers whose FIRST order was in the current month
            const now = new Date(); // Define 'now' before using it
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            // Group orders by customer
            const customerOrders: Record<string, Date[]> = {};
            salesData.forEach((s: any) => {
                if (!customerOrders[s.customer_id]) customerOrders[s.customer_id] = [];
                customerOrders[s.customer_id].push(new Date(s.created_at));
            });
            
            let newCustomersCount = 0;
            let repeatCustomersCount = 0;
            
            Object.values(customerOrders).forEach(dates => {
                // Sort dates
                dates.sort((a, b) => a.getTime() - b.getTime());
                const firstOrderDate = dates[0];
                
                if (firstOrderDate >= startOfMonth) {
                    newCustomersCount++;
                }
                
                if (dates.length > 1) {
                    repeatCustomersCount++;
                }
            });
            
            const repeatRate = uniqueCount > 0 ? Math.round((repeatCustomersCount / uniqueCount) * 100) : 0;
            
            // LTV
            const totalRevenue = salesData.reduce((acc: number, sale: any) => acc + sale.amount, 0);
            const ltv = uniqueCount > 0 ? totalRevenue / uniqueCount : 0;

            setCustomerStats({
                unique: uniqueCount,
                new: newCustomersCount,
                repeatRate,
                ltv
            });

            // --- 5. Alerts ---
            const newAlerts: AlertItem[] = [];
            
            // Meta (Exemplo: 500k Kz)
            const MONTHLY_GOAL = 500000;
            if (totalRevenue >= MONTHLY_GOAL) {
                newAlerts.push({
                    type: 'success',
                    title: 'Meta Atingida',
                    description: `Você atingiu a meta de ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(MONTHLY_GOAL)}!`
                });
            }

            // Estoque Baixo (Simulação baseada em produtos com poucas vendas recentes? Não, ideal é ter campo stock. Vamos remover o fake por enquanto ou deixar um placeholder inteligente)
            // Vamos verificar se há algum produto com muitas vendas hoje (Tendência de alta)
            if (sortedProducts.length > 0) {
                const topProduct = sortedProducts[0] as any;
                if (topProduct.sales > 10) {
                     newAlerts.push({
                        type: 'warning', // Warning positivo? Use success ou info. Mas 'warning' é amarelo.
                        title: 'Alta Demanda',
                        description: `O produto "${topProduct.name}" teve ${topProduct.sales} vendas.`
                    });
                }
            }

            // Chargeback (Se houver status 'chargeback' ou 'dispute')
            const chargebacks = allOrders.filter(o => ['chargeback', 'dispute', 'refunded'].includes(o.status));
            if (chargebacks.length > 0) {
                 newAlerts.push({
                    type: 'destructive',
                    title: 'Chargebacks/Reembolsos Detectados',
                    description: `Foram identificados ${chargebacks.length} pedidos com problemas (reembolso ou disputa). Verifique imediatamente.`
                });
            }
            
            setAlerts(newAlerts);
          }
        }
      }
    };

    loadDashboardData();
  }, [navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price);
  };

  const avgTicket = stats.sales > 0 ? stats.revenue / stats.sales : 0;

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Bem-vindo de volta, {userProfile?.full_name || 'Produtor'}!</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatórios
             </Button>
             <Button variant="accent" asChild>
                <Link to="/dashboard/products/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Produto
                </Link>
             </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Seção 1: Visão Geral Financeira */}
          <FinancialOverview 
            revenue={stats.revenue}
            lastDayRevenue={0} // TODO: Implementar comparação real
            salesCount={stats.sales}
            avgTicket={avgTicket}
            pendingBalance={stats.pendingBalance}
            availableBalance={stats.availableBalance}
          />

          {/* Seção 2: Gráficos e Alertas */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <div className="col-span-1 lg:col-span-4">
              <SalesChart orders={salesChartData} />
            </div>
            <div className="col-span-1 lg:col-span-3 space-y-6">
              <AlertsPanel alerts={alerts} />
              <PaymentAnalysis data={paymentMethods} />
            </div>
          </div>

          {/* Seção 3: Métricas de Produtos e Clientes */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            <div className="col-span-1 lg:col-span-3">
              <ProductMetrics products={topProducts} />
            </div>
            <div className="col-span-1 lg:col-span-3">
              <CustomerMetrics 
                uniqueCustomers={customerStats.unique}
                newCustomers={customerStats.new}
                repeatRate={customerStats.repeatRate}
                ltv={customerStats.ltv}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
