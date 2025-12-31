import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

const recentSales = [
  { id: 1, customer: "Maria Santos", email: "maria@email.com", product: "Curso de Marketing Digital", amount: "25.000 Kz", status: "Aprovado" },
  { id: 2, customer: "João Paulo", email: "joao@email.com", product: "Ebook: Vendas Online", amount: "5.000 Kz", status: "Aprovado" },
  { id: 3, customer: "Ana Ferreira", email: "ana@email.com", product: "Curso de Marketing Digital", amount: "25.000 Kz", status: "Pendente" },
  { id: 4, customer: "Carlos Silva", email: "carlos@email.com", product: "Mentoria 1:1", amount: "150.000 Kz", status: "Aprovado" },
];

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
                P
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">Produtor Demo</div>
                  <div className="text-sm text-muted-foreground truncate">demo@infopay.ao</div>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <Button variant="ghost" className="w-full mt-4 justify-start text-muted-foreground" asChild>
                <Link to="/">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Link>
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
                  +12.5%
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">2.450.000 Kz</div>
              <div className="text-sm text-muted-foreground mt-1">Receita Total</div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-success" />
                </div>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  +8.2%
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">348</div>
              <div className="text-sm text-muted-foreground mt-1">Total de Vendas</div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  +24.1%
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">1.284</div>
              <div className="text-sm text-muted-foreground mt-1">Clientes</div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-warning" />
                </div>
                <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                  <TrendingDown className="w-4 h-4" />
                  -2.3%
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">12</div>
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
                            {sale.customer.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{sale.customer}</div>
                            <div className="text-sm text-muted-foreground">{sale.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{sale.product}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{sale.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'Aprovado' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
