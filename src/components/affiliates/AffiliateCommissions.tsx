import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const AffiliateCommissions = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch payouts using RLS
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          affiliates (
            *,
            profiles:user_id (full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  // Calculate summaries
  const pendingAmount = commissions
    .filter(c => c.status === 'pending' || c.status === 'processing')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const paidAmount = commissions
    .filter(c => c.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando liberação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disponível para Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Calculado do saldo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pago Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">{commissions.filter(c => c.status === 'paid').length} pagamentos realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximo Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Automático</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <div className="rounded-md border bg-card">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="font-semibold">Histórico de Pagamentos</h3>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Afiliado</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento registrado.
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.created_at).toLocaleDateString('pt-AO')}</TableCell>
                  <TableCell className="font-medium">{item.affiliates?.profiles?.full_name || 'Afiliado'}</TableCell>
                  <TableCell>{item.method}</TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      item.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      item.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                      item.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      'bg-red-50 text-red-600 border-red-200'
                    }>
                      {item.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {item.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {item.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                      {item.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                      {item.status === 'paid' ? 'Pago' : 
                       item.status === 'pending' ? 'Pendente' : 
                       item.status === 'processing' ? 'Processando' : 'Falhou'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Detalhes</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
