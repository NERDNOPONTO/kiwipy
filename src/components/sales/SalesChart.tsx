import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalesChartProps {
  orders: any[];
  isLoading: boolean;
}

export const SalesChart = ({ orders, isLoading }: SalesChartProps) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [metric, setMetric] = useState<'amount' | 'count'>('amount');

  const chartData = useMemo(() => {
    if (!orders.length) return [];

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, days - 1);

    const data = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - 1 - i);
      const dayOrders = orders.filter(o => {
        const orderDate = startOfDay(parseISO(o.created_at));
        return isSameDay(date, orderDate) && o.status === 'approved';
      });

      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: format(date, "d 'de' MMMM", { locale: ptBR }),
        amount: dayOrders.reduce((acc, curr) => acc + (curr.amount || 0), 0),
        count: dayOrders.length,
      });
    }
    return data;
  }, [orders, timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Carregando gráfico...</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center bg-secondary/10 animate-pulse">
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Desempenho de Vendas</CardTitle>
            <CardDescription>Acompanhe o crescimento das suas vendas ao longo do tempo</CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-secondary p-1 rounded-lg flex text-sm">
              <button 
                onClick={() => setMetric('amount')}
                className={`px-3 py-1 rounded-md transition-all ${metric === 'amount' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Valor (Kz)
              </button>
              <button 
                onClick={() => setMetric('count')}
                className={`px-3 py-1 rounded-md transition-all ${metric === 'count' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Quantidade
              </button>
            </div>
            <div className="bg-secondary p-1 rounded-lg flex text-sm">
              <button 
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 rounded-md transition-all ${timeRange === '7d' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                7D
              </button>
              <button 
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 rounded-md transition-all ${timeRange === '30d' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                30D
              </button>
              <button 
                onClick={() => setTimeRange('90d')}
                className={`px-3 py-1 rounded-md transition-all ${timeRange === '90d' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                90D
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => metric === 'amount' ? `${value / 1000}k` : value}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
                        <p className="text-sm font-medium mb-1">{payload[0].payload.fullDate}</p>
                        <p className="text-sm font-bold text-primary">
                          {metric === 'amount' 
                            ? formatCurrency(payload[0].value as number)
                            : `${payload[0].value} vendas`
                          }
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey={metric} 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
