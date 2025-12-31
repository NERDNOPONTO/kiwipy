import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Search,
  MoreHorizontal,
  Download,
  Filter
} from "lucide-react";

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
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
                customers (
                  full_name,
                  email
                ),
                products (
                  name
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

    fetchSales();
  }, [navigate]);

  const filteredSales = sales.filter(sale =>
    sale.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Vendas</h1>
            <p className="text-muted-foreground mt-1">Acompanhe suas vendas e recebimentos</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Pesquisar por cliente, email ou produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary border-0"
            />
          </div>
          <Button variant="ghost" size="icon">
             <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Sales List */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {isLoading ? (
             <div className="p-12 text-center text-muted-foreground">Carregando vendas...</div>
          ) : (
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
                {filteredSales.map((sale) => (
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
                {filteredSales.length === 0 && (
                   <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhuma venda encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Sales;
