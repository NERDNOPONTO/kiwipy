import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AffiliatePerformanceChartProps {
  data?: any[];
}

export const AffiliatePerformanceChart = ({ data = [] }: AffiliatePerformanceChartProps) => {
  // Empty state if no data
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Performance de Afiliados</CardTitle>
          <CardDescription>
            Comparativo de vendas totais vs comissões pagas nos últimos meses
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de vendas de afiliados disponível ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Performance de Afiliados</CardTitle>
        <CardDescription>
          Comparativo de vendas totais vs comissões pagas nos últimos meses
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorComissoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Kz ${value}`} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="vendas" stroke="#888888" fillOpacity={1} fill="url(#colorVendas)" name="Vendas Totais" />
              <Area type="monotone" dataKey="comissoes" stroke="#82ca9d" fillOpacity={1} fill="url(#colorComissoes)" name="Comissões Pagas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
