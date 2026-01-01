import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_subscriptions')
        .select(`
          *,
          profiles:user_id (full_name, phone),
          plan:plan_id (name, price, interval)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assinaturas SaaS</h2>
          <p className="text-muted-foreground">Monitore os usuários assinantes da plataforma.</p>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim do Período</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8">
                     <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                   </TableCell>
                 </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma assinatura encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{sub.profiles?.full_name}</span>
                        <span className="text-xs text-muted-foreground">{sub.profiles?.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span>{sub.plan?.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {sub.plan?.interval === 'monthly' ? 'Mensal' : 'Anual'}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'active' ? 'default' : 'destructive'}>
                        {sub.status === 'active' ? 'Ativo' : 
                         sub.status === 'past_due' ? 'Atrasado' : 'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(sub.current_period_start).toLocaleDateString()}</TableCell>
                    <TableCell>
                        {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Vitalício'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
