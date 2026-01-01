import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Plus, Building2, Trash2, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  iban: string;
  account_holder_name: string;
  is_default: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  customer: { full_name: string } | null;
  product: { name: string } | null;
}

const Financial = () => {
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState({
    grossTotal: 0,
    netTotal: 0,
    pendingWithdrawal: 0,
    totalWithdrawn: 0,
    withdrawable: 0,
  });
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBank, setNewBank] = useState({
    bank_name: "",
    account_number: "",
    iban: "",
    account_holder_name: "",
  });
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");

  const loadFinancialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Load Bank Accounts
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      setBankAccounts(accounts || []);

      // Load Sales for Balance Calculation
      const { data: orders } = await supabase
        .from('orders')
        .select('id, amount, net_amount, commission_platform, status, created_at, customer:customer_id(full_name), product:product_id(name)')
        .eq('producer_id', profile.id)
        .order('created_at', { ascending: false });

      // Load Withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount, status')
        .eq('user_id', profile.id);

      // Calculate totals based on approved/paid orders
      const approvedOrders = orders?.filter(o => ['approved', 'paid'].includes(o.status)) || [];
      const totalSales = approvedOrders.reduce((sum, order) => sum + order.amount, 0);
      
      // Calculate Net Income using DB values (Single Source of Truth)
      const netIncome = approvedOrders.reduce((sum, order) => sum + (order.net_amount || (order.amount * 0.9)), 0);

      // Calculate Withdrawals
      const pendingWithdrawal = withdrawals
        ?.filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0) || 0;

      const totalWithdrawn = withdrawals
        ?.filter(w => ['approved', 'paid'].includes(w.status))
        .reduce((sum, w) => sum + w.amount, 0) || 0;

      // Available to withdraw = Net Income - (Pending + Withdrawn)
      const availableToWithdraw = netIncome - pendingWithdrawal - totalWithdrawn;

      setMetrics({
        grossTotal: totalSales,
        netTotal: netIncome,
        pendingWithdrawal,
        totalWithdrawn,
        withdrawable: Math.max(0, availableToWithdraw),
      });

      // We could store orders in state if we want to list them
      // setTransactions(orders);
      setTransactions(orders || []);

    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleRequestWithdrawal = async () => {
    try {
      if (!withdrawAmount || !selectedBankId) {
        toast.error("Preencha todos os campos");
        return;
      }

      const amount = Number(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Valor inválido");
        return;
      }

      if (amount > metrics.withdrawable) {
        toast.error("Saldo insuficiente");
        return;
      }

      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: profile.id,
          amount: amount,
          bank_account_id: selectedBankId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Solicitação de saque enviada!");
      setIsRequestingWithdrawal(false);
      setWithdrawAmount("");
      setSelectedBankId("");
      loadFinancialData(); // Refresh metrics/list if we show pending withdrawals somewhere

    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast.error("Erro ao solicitar saque");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: profile.id,
          ...newBank,
          is_default: bankAccounts.length === 0
        });

      if (error) throw error;

      toast.success('Conta bancária adicionada com sucesso!');
      setIsAddingBank(false);
      setNewBank({
        bank_name: "",
        account_number: "",
        iban: "",
        account_holder_name: "",
      });
      loadFinancialData();
    } catch (error) {
      console.error('Error adding bank:', error);
      toast.error('Erro ao adicionar conta bancária');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Conta bancária removida');
      loadFinancialData();
    } catch (error) {
      toast.error('Erro ao remover conta');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus ganhos e dados bancários</p>
          </div>
          <Dialog open={isRequestingWithdrawal} onOpenChange={setIsRequestingWithdrawal}>
            <DialogTrigger asChild>
              <Button variant="default">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Solicitar Saque
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Saque</DialogTitle>
                <DialogDescription>
                  Seu saldo disponível é de <span className="font-bold text-emerald-600">{formatCurrency(metrics.withdrawable)}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Valor do Saque</Label>
                  <Input 
                    type="number"
                    placeholder="0.00" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                  >
                    <option value="" disabled>Selecione uma conta</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_number}
                      </option>
                    ))}
                  </select>
                  {bankAccounts.length === 0 && (
                    <p className="text-xs text-red-500">Adicione uma conta bancária primeiro.</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRequestingWithdrawal(false)}>Cancelar</Button>
                <Button onClick={handleRequestWithdrawal} disabled={loading || bankAccounts.length === 0}>
                  Confirmar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Saldo Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">{formatCurrency(metrics.withdrawable)}</div>
              <p className="text-xs text-muted-foreground mt-1">Valor líquido disponível para saque</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Pendente de Saque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{formatCurrency(metrics.pendingWithdrawal)}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Saldo Sacado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{formatCurrency(metrics.totalWithdrawn)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total já transferido</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Vendas Totais (Bruto)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(metrics.grossTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">Valor total transacionado</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
           <h2 className="text-xl font-semibold">Histórico de Transações</h2>
           <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma transação encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(t.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{t.product?.name || 'Produto Removido'}</TableCell>
                        <TableCell>{t.customer?.full_name || 'Cliente Desconhecido'}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(t.amount)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            t.status === 'approved' || t.status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : t.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {t.status === 'approved' || t.status === 'paid' ? 'Aprovado' : 
                             t.status === 'pending' ? 'Pendente' : 
                             t.status === 'rejected' ? 'Rejeitado' : t.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
           </Card>
        </div>

        {/* Bank Accounts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Contas Bancárias</h2>
            <Dialog open={isAddingBank} onOpenChange={setIsAddingBank}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Conta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Dados Bancários</DialogTitle>
                  <DialogDescription>
                    Insira os dados da conta para recebimento de valores.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Banco</Label>
                    <Input 
                      placeholder="Ex: Banco BAI" 
                      value={newBank.bank_name}
                      onChange={(e) => setNewBank({...newBank, bank_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Titular da Conta</Label>
                    <Input 
                      placeholder="Nome completo do titular" 
                      value={newBank.account_holder_name}
                      onChange={(e) => setNewBank({...newBank, account_holder_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número da Conta</Label>
                    <Input 
                      placeholder="Número da conta" 
                      value={newBank.account_number}
                      onChange={(e) => setNewBank({...newBank, account_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input 
                      placeholder="AO06..." 
                      value={newBank.iban}
                      onChange={(e) => setNewBank({...newBank, iban: e.target.value})}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddBank} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Conta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banco</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>IBAN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma conta bancária cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bankAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {account.bank_name}
                        </TableCell>
                        <TableCell>{account.account_holder_name}</TableCell>
                        <TableCell className="font-mono text-sm">{account.iban}</TableCell>
                        <TableCell>
                          {account.is_default && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              Padrão
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDeleteBank(account.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Financial;
