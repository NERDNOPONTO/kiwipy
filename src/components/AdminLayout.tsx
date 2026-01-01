import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  DollarSign, 
  LogOut,
  Menu,
  ShieldCheck,
  Package
} from "lucide-react";
import { Loader2 } from "lucide-react";

const adminSidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Produtores", href: "/admin/producers" },
  { icon: CreditCard, label: "Assinaturas", href: "/admin/subscriptions" },
  { icon: Package, label: "Planos SaaS", href: "/admin/plans" },
  { icon: DollarSign, label: "Saques", href: "/admin/withdrawals" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        console.log("Admin Check - Profile:", profile); // Debug log

        // Check if role is admin OR specific email as fallback
        if (profile && (profile.role === 'admin' || session.user.email === 'leonardo.soares1420@gmail.com')) {
          setIsAdmin(true);
          setUserProfile(profile);
        } else {
            console.log("Access denied: User is not admin", profile);
            navigate("/dashboard"); 
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-800">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                    <span className="font-display text-lg font-bold">Admin</span>
                    <span className="text-xs text-slate-400">Gerenciamento</span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {adminSidebarItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={index}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold flex-shrink-0">
                {userProfile?.full_name?.charAt(0) || "A"}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{userProfile?.full_name || "Admin"}</div>
                  <div className="text-sm text-slate-500 truncate">Administrador</div>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 justify-start text-slate-400 hover:text-white hover:bg-slate-800" 
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
        <header className="bg-background border-b border-border/50 sticky top-0 z-40 px-6 py-4 flex items-center justify-between gap-4">
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
              <h1 className="font-semibold text-lg">Painel Administrativo</h1>
        </header>
        <div className="p-6">
            {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
