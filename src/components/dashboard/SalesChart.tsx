import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SalesChartProps {
  orders?: any[];
}

export const SalesChart = ({ orders = [] }: SalesChartProps) => {
  const [range, setRange] = useState('today');

  const chartData = useMemo(() => {
    const now = new Date();
    
    if (range === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const filtered = orders.filter((o: any) => new Date(o.created_at) >= startOfDay);
      
      const hoursMap = new Map();
      for (let i = 0; i <= 23; i++) { // 0 to 23
         const hour = String(i).padStart(2, '0') + ':00';
         hoursMap.set(hour, 0);
      }
      
      filtered.forEach((o: any) => {
         const d = new Date(o.created_at);
         const hour = String(d.getHours()).padStart(2, '0') + ':00';
         if (hoursMap.has(hour)) {
             hoursMap.set(hour, hoursMap.get(hour) + o.amount);
         }
      });
      
      return Array.from(hoursMap.entries()).map(([time, total]) => ({ time, total }));
    } else if (range === '7days') {
       // Last 7 days
       const start = new Date(now);
       start.setDate(now.getDate() - 6); // Today + 6 days back
       start.setHours(0,0,0,0);
       
       const filtered = orders.filter((o: any) => new Date(o.created_at) >= start);
       const daysMap = new Map();
       
       for (let i = 0; i < 7; i++) {
           const d = new Date(start);
           d.setDate(start.getDate() + i);
           const dayStr = d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' });
           daysMap.set(dayStr, 0);
       }
       
       filtered.forEach((o: any) => {
           const d = new Date(o.created_at);
           const dayStr = d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' });
           if (daysMap.has(dayStr)) {
               daysMap.set(dayStr, daysMap.get(dayStr) + Number(o.amount || 0));
           }
       });
       
       return Array.from(daysMap.entries()).map(([time, total]) => ({ time, total }));
    } else if (range === '30days') {
       // Last 30 days
       const start = new Date(now);
       start.setDate(now.getDate() - 29);
       start.setHours(0,0,0,0);
       
       const filtered = orders.filter((o: any) => new Date(o.created_at) >= start);
       const daysMap = new Map();
       
       for (let i = 0; i < 30; i++) {
           const d = new Date(start);
           d.setDate(start.getDate() + i);
           const dayStr = d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' });
           daysMap.set(dayStr, 0);
       }
       
       filtered.forEach((o: any) => {
           const d = new Date(o.created_at);
           const dayStr = d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' });
           if (daysMap.has(dayStr)) {
               daysMap.set(dayStr, daysMap.get(dayStr) + Number(o.amount || 0));
           }
       });
       
       return Array.from(daysMap.entries()).map(([time, total]) => ({ time, total }));
    }
    return [];
  }, [orders, range]);

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Vendas e Receita</CardTitle>
        <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="today">Hoje (24h)</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
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
                tickFormatter={(value) => `Kz ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} 
              />
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value)}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#f97316" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
