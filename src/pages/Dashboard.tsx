import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Settings,
  LogOut,
  Plus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  MoreHorizontal,
  Search,
  Bell
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: Package, label: "Produtos", href: "/dashboard/products", active: false },
  { icon: ShoppingCart, label: "Vendas", href: "/dashboard/sales", active: false },
  { icon: Users, label: "Clientes", href: "/dashboard/customers", active: false },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: false },
  { icon: Settings, label: "Configurações", href: "/dashboard/settings", active: false },
];

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [stats, setStats] = useState({
    revenue: 0,
    sales: 0,
    customers: 0,
    activeProducts: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUserEmail(session.user.email || "");

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

    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price);
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-card border-r border-border/50 transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border/50">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-accent flex-shrink-0">
                <Zap className="w-5 h-5 text-accent-foreground" />
              </div>
              {isSidebarOpen && (
                <span className="font-display text-xl font-bold text-foreground">InfoPay</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  item.active 
                    ? 'bg-accent text-accent-foreground shadow-accent' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                {userProfile?.full_name?.charAt(0) || userEmail?.charAt(0) || "P"}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{userProfile?.full_name || "Usuário"}</div>
                  <div className="text-sm text-muted-foreground truncate">{userEmail}</div>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 justify-start text-muted-foreground" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border/50 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="pl-10 pr-4 py-2 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-accent w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </button>
              <Button variant="accent" asChild>
                <Link to="/dashboard/products/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Olá, Produtor! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Aqui está o resumo das suas vendas
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-accent" />
                </div>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  +0%
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{formatPrice(stats.revenue)}</div>
              <div className="text-sm text-muted-foreground mt-1">Receita Total</div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-success" />
                </div>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  +0%
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{stats.sales}</div>
              <div className="text-sm text-muted-foreground mt-1">Total de Vendas</div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  +0%
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{stats.customers}</div>
              <div className="text-sm text-muted-foreground mt-1">Clientes</div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-warning" />
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm font-medium">
                  <TrendingDown className="w-4 h-4" />
                  0%
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{stats.activeProducts}</div>
              <div className="text-sm text-muted-foreground mt-1">Produtos Ativos</div>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Vendas Recentes</h2>
                <p className="text-sm text-muted-foreground mt-1">As últimas transações processadas</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/sales">
                  Ver todas
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Produto</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Valor</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-medium text-sm">
                            {sale.customers?.full_name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{sale.customers?.full_name || "Cliente"}</div>
                            <div className="text-sm text-muted-foreground">{sale.customers?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{sale.products?.name}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{formatPrice(sale.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'approved' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {sale.status === 'approved' ? 'Aprovado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                     <tr className="border-b border-border/30 last:border-0">
                       <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                         Nenhuma venda encontrada
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
