import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Producer {
  id: string;
  full_name: string;
  business_name: string;
  phone: string;
  created_at: string;
  total_sales: number;
}

const AdminProducers = () => {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducers();
  }, []);

  const loadProducers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'producer');
      
      if (error) throw error;

      // For each producer, fetch total sales
      // This is N+1, but fine for admin panel with pagination (todo later)
      const producersWithStats = await Promise.all(profiles.map(async (p) => {
        const { data: orders } = await supabase
          .from('orders')
          .select('amount')
          .eq('producer_id', p.id)
          .eq('status', 'approved');
        
        const total = orders?.reduce((sum, o) => sum + o.amount, 0) || 0;
        
        return {
          ...p,
          total_sales: total
        };
      }));

      setProducers(producersWithStats);
    } catch (error) {
      console.error("Error loading producers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtores</h2>
          <p className="text-muted-foreground">Gerencie os produtores cadastrados na plataforma.</p>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Negócio</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead>Vendas Totais</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : producers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum produtor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                producers.map((producer) => (
                  <TableRow key={producer.id}>
                    <TableCell className="font-medium">{producer.full_name || "Sem nome"}</TableCell>
                    <TableCell>{producer.business_name || "-"}</TableCell>
                    <TableCell>{producer.phone || "-"}</TableCell>
                    <TableCell>{new Date(producer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      {formatCurrency(producer.total_sales)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Ativo</Badge>
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

export default AdminProducers;
