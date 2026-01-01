import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  Menu,
  Store,
  Briefcase,
  Wallet
} from "lucide-react";

import { ProducerSubscriptionScreen } from "./ProducerSubscriptionScreen";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Store, label: "Marketplace", href: "/dashboard/marketplace" },
  { icon: Briefcase, label: "Minha Mochila", href: "/dashboard/backpack" },
  { icon: Package, label: "Produtos", href: "/dashboard/products" },
  { icon: ShoppingCart, label: "Vendas", href: "/dashboard/sales" },
  { icon: Wallet, label: "Financeiro", href: "/dashboard/financial" },
  { icon: Users, label: "Afiliados", href: "/dashboard/affiliates" }, // Renamed from Customers to match SaaS vision better
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Configurações", href: "/dashboard/settings" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);

        // Admin bypass
        if (profile.role === 'admin' || session.user.email === 'leonardo.soares1420@gmail.com') {
          setHasActiveSubscription(true);
        } else {
          // Check for active subscription
          const { data: subscription } = await supabase
            .from('saas_subscriptions')
            .select('*')
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .gt('current_period_end', new Date().toISOString())
            .maybeSingle();

          setHasActiveSubscription(!!subscription);
        }
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (hasActiveSubscription === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasActiveSubscription === false) {
    return <ProducerSubscriptionScreen onSubscriptionComplete={() => setHasActiveSubscription(true)} />;
  }

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
            {sidebarItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={index}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent text-accent-foreground shadow-accent' 
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
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
        <header className="bg-card border-b border-border/50 sticky top-0 z-40 px-6 py-4 flex items-center gap-4">
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
        </header>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
