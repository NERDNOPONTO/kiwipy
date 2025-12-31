import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Zap, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  MoreHorizontal,
  Search,
  Bell,
  Plus
} from "lucide-react";

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    revenue: 0,
    sales: 0,
    customers: 0,
    activeProducts: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
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

          // Fetch stats
          const { data: orders } = await supabase
            .from('orders')
            .select('amount, status, customer_id')
            .eq('producer_id', profile.id)
            .eq('status', 'approved');
          
          const revenue = orders?.reduce((acc, order) => acc + order.amount, 0) || 0;
          const salesCount = orders?.length || 0;
          const uniqueCustomers = new Set(orders?.map(o => o.customer_id)).size;

          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('producer_id', profile.id)
            .eq('is_active', true);

          setStats({
            revenue,
            sales: salesCount,
            customers: uniqueCustomers,
            activeProducts: productsCount || 0
          });

          // Fetch recent sales
          const { data: recent } = await supabase
            .from('orders')
            .select(`
              id,
              amount,
              status,
              created_at,
              customers (
                full_name,
                email
              ),
              products (
                name
              )
            `)
            .eq('producer_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (recent) {
            setRecentSales(recent);
          }
        }
      }
    };

    loadDashboardData();
  }, [navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-success" />
              </div>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12%
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Receita Total</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{formatPrice(stats.revenue)}</h3>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8%
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Vendas Realizadas</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{stats.sales}</h3>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +24%
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Clientes Únicos</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{stats.customers}</h3>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                Ativos
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Produtos Ativos</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{stats.activeProducts}</h3>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Vendas Recentes</h2>
            <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/sales">Ver todas</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                          {sale.customers?.full_name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{sale.customers?.full_name || "Cliente"}</div>
                          <div className="text-xs text-muted-foreground">{sale.customers?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {sale.products?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {formatPrice(sale.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sale.status === 'approved' 
                          ? 'bg-success/10 text-success' 
                          : sale.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {sale.status === 'approved' ? 'Aprovado' : sale.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString('pt-AO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
