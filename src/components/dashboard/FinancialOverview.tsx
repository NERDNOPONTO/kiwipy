import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Percent
} from "lucide-react";

interface FinancialOverviewProps {
  revenue: number;
  lastDayRevenue: number;
  salesCount: number;
  avgTicket: number;
  pendingBalance: number;
  availableBalance: number;
}

export const FinancialOverview = ({ 
  revenue, 
  lastDayRevenue, 
  salesCount, 
  avgTicket,
  pendingBalance,
  availableBalance
}: FinancialOverviewProps) => {
  
  const revenueGrowth = lastDayRevenue > 0 
    ? ((revenue - lastDayRevenue) / lastDayRevenue) * 100 
    : 100;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(availableBalance)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            + {formatCurrency(pendingBalance)} em análise
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
          <div className="flex items-center text-xs mt-1">
            {revenueGrowth >= 0 ? (
              <span className="text-green-500 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {revenueGrowth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-red-500 flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
            )}
            <span className="text-muted-foreground ml-1">vs ontem</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(avgTicket)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Baseado em {salesCount} vendas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">94.2%</div>
          <div className="flex items-center text-xs mt-1 text-muted-foreground">
             <span className="text-green-500 flex items-center mr-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2.1%
              </span>
              vs semana passada
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
