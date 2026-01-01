
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, CreditCard, Activity, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StatData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
}

export const AnalyticsOverview = () => {
  const [stats, setStats] = useState<StatData[]>([
    { title: "Receita Mensal", value: "KZ 0,00", change: "0%", trend: "neutral", icon: DollarSign },
    { title: "Vendas Mensais", value: "0", change: "0%", trend: "neutral", icon: ShoppingCart },
    { title: "Ticket Médio", value: "KZ 0,00", change: "0%", trend: "neutral", icon: CreditCard },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get producer profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!profile) return;

      // Get products for this producer
      const { data: myProducts } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('producer_id', profile.id);
      
      if (!myProducts || myProducts.length === 0) {
        setLoading(false);
        return;
      }

      const productIds = myProducts.map(p => p.id);

      // Get orders for these products
      const { data: allOrders } = await supabase
        .from('orders')
        .select(`
          *,
          products (name)
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (!allOrders) {
        setLoading(false);
        return;
      }

      const paidOrders = allOrders.filter(o => o.status === 'paid' || o.status === 'approved');

      // Current Month Stats
      const currentMonthOrders = paidOrders.filter(o => {
          const d = new Date(o.created_at);
          return d >= currentMonthStart && d <= currentMonthEnd;
      });

      const lastMonthOrders = paidOrders.filter(o => {
          const d = new Date(o.created_at);
          return d >= lastMonthStart && d <= lastMonthEnd;
      });

      // Calculate Revenue
      const currentRevenue = currentMonthOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
      const lastRevenue = lastMonthOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
      
      // Calculate Sales Count
      const currentSales = currentMonthOrders.length;
      const lastSales = lastMonthOrders.length;

      // Calculate Average Ticket
      const currentAvg = currentSales > 0 ? currentRevenue / currentSales : 0;
      const lastAvg = lastSales > 0 ? lastRevenue / lastSales : 0;

      // Calculate Trends
      const calcTrend = (curr: number, last: number) => {
          if (last === 0) return curr > 0 ? 100 : 0;
          return ((curr - last) / last) * 100;
      };

      const revenueTrend = calcTrend(currentRevenue, lastRevenue);
      const salesTrend = calcTrend(currentSales, lastSales);
      const avgTrend = calcTrend(currentAvg, lastAvg);

      setStats([
        { 
            title: "Receita Mensal", 
            value: formatCurrency(currentRevenue), 
            change: `${revenueTrend > 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`, 
            trend: revenueTrend >= 0 ? 'up' : 'down', 
            icon: DollarSign 
        },
        { 
            title: "Vendas Mensais", 
            value: currentSales.toString(), 
            change: `${salesTrend > 0 ? '+' : ''}${salesTrend.toFixed(1)}%`, 
            trend: salesTrend >= 0 ? 'up' : 'down', 
            icon: ShoppingCart 
        },
        { 
            title: "Ticket Médio", 
            value: formatCurrency(currentAvg), 
            change: `${avgTrend > 0 ? '+' : ''}${avgTrend.toFixed(1)}%`, 
            trend: avgTrend >= 0 ? 'up' : 'down', 
            icon: CreditCard 
        },
      ]);

      // Chart Data (Last 30 days)
      // If we don't have enough data, show 0
      const last30Days = eachDayOfInterval({ start: subDays(now, 30), end: now });
      const chart = last30Days.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayOrders = paidOrders.filter(o => {
              const d = new Date(o.created_at);
              return d >= dayStart && d <= dayEnd;
          });
          return {
              date: format(day, 'dd/MM', { locale: ptBR }),
              revenue: dayOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0),
              sales: dayOrders.length
          };
      });
      setChartData(chart);

      // Recent Sales (Any status, not just paid)
      setRecentSales(allOrders.slice(0, 5));

    } catch (error) {
        console.error("Error fetching analytics:", error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando dados...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs flex items-center mt-1 ${
                stat.trend === 'up' ? 'text-emerald-500' : 
                stat.trend === 'down' ? 'text-rose-500' : 'text-muted-foreground'
              }`}>
                {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.change} em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Sales Chart */}
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
            <CardDescription>
              Receita diária nos últimos 30 dias.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value / 1000}k`} 
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatCurrency(value), 'Receita']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Receita"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Widget */}
        <Card className="md:col-span-2 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Vendas Recentes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Últimas transações realizadas.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4">
              {recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda recente.</p>
              ) : (
                <div className="space-y-4">
                  {recentSales.map((sale, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0 last:pb-0">
                      <div className={`p-2 rounded-full ${sale.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium leading-none">{sale.products?.name || 'Produto'}</p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{format(new Date(sale.created_at), "dd/MM HH:mm")}</span>
                          <span className="font-semibold text-foreground">{formatCurrency(sale.amount)}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          sale.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 
                          sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.status === 'paid' ? 'Aprovado' : sale.status === 'pending' ? 'Pendente' : sale.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
