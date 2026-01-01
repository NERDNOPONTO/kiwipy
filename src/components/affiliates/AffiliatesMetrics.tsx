import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserMinus, DollarSign, TrendingUp, CreditCard, Percent, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AffiliatesMetricsProps {
  affiliates?: any[];
  isLoading: boolean;
}

export const AffiliatesMetrics = ({ affiliates = [], isLoading }: AffiliatesMetricsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-[100px]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-4 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Mock calculations - replace with real data logic
  const activeAffiliates = affiliates.filter(a => a.status === 'approved').length;
  const totalSales = affiliates.reduce((acc, curr) => acc + (curr.total_sales || 0), 0);
  const totalRevenue = affiliates.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);
  const totalCommissions = affiliates.reduce((acc, curr) => acc + (curr.total_commissions || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Afiliados Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAffiliates}</div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            Afiliados aprovados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas de Afiliados</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSales}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Geraram {formatCurrency(totalRevenue)} em receita
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Comissões Totais</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Valor acumulado de comissões
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média por Afiliado</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
             {activeAffiliates > 0 ? formatCurrency(totalRevenue / activeAffiliates) : formatCurrency(0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Receita média gerada
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
