import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles:user_id (full_name, phone),
          bank_accounts:bank_account_id (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error("Error loading withdrawals:", error);
      toast({ variant: "destructive", title: "Erro ao carregar saques" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `Saque ${newStatus === 'approved' ? 'Aprovado' : 'Rejeitado'}`,
        description: "Status atualizado com sucesso."
      });
      
      loadWithdrawals();
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      toast({ variant: "destructive", title: "Erro ao atualizar status" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Solicitações de Saque</h2>
          <p className="text-muted-foreground">Aprove ou rejeite solicitações de saque dos produtores.</p>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{w.profiles?.full_name}</span>
                        <span className="text-xs text-muted-foreground">{w.profiles?.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(w.amount)}</TableCell>
                  <TableCell>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Eye className="w-3 h-3 mr-2" /> Ver Dados</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Dados Bancários</DialogTitle>
                                <DialogDescription>
                                    Informações para transferência
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <p><strong>Banco:</strong> {w.bank_accounts?.bank_name}</p>
                                <p><strong>Titular:</strong> {w.bank_accounts?.account_holder_name}</p>
                                <p><strong>IBAN:</strong> {w.bank_accounts?.iban}</p>
                                <p><strong>Conta:</strong> {w.bank_accounts?.account_number}</p>
                            </div>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {w.status === 'approved' ? 'Aprovado' :
                         w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {w.status === 'pending' && (
                        <div className="flex gap-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange(w.id, 'approved')}>
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleStatusChange(w.id, 'rejected')}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
