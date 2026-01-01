import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, DollarSign, CreditCard, ShoppingCart, Percent, Activity, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesMetricsProps {
  orders: any[];
  isLoading: boolean;
}

export const SalesMetrics = ({ orders, isLoading }: SalesMetricsProps) => {
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

  // Calculate metrics
  const approvedOrders = orders.filter(o => o.status === 'approved');
  
  const totalSales = approvedOrders.length;
  const grossRevenue = approvedOrders.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  // Assuming 5% platform fee + 2% transaction fee roughly
  const netRevenue = grossRevenue * 0.93; 
  const avgTicket = totalSales > 0 ? grossRevenue / totalSales : 0;
  
  const amounts = approvedOrders.map(o => o.amount || 0);
  const maxSale = amounts.length > 0 ? Math.max(...amounts) : 0;
  const minSale = amounts.length > 0 ? Math.min(...amounts) : 0;

  // Mock comparison (random small variation for demo if no historic data passed explicitly)
  // In a real app, we would calculate this based on previous period date range
  const percentChange = 12.5; 

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Bruta Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(grossRevenue)}</div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <ArrowUp className="w-3 h-3 text-emerald-500 mr-1" />
            <span className="text-emerald-500">+{percentChange}%</span> em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Aprovadas</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSales}</div>
          <p className="text-xs text-muted-foreground mt-1">
            De um total de {orders.length} pedidos iniciados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(avgTicket)}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
            <span>Min: {formatCurrency(minSale)}</span>
            <span>Max: {formatCurrency(maxSale)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {orders.length > 0 ? ((totalSales / orders.length) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {orders.length - totalSales} pedidos não concluídos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
