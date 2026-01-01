
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface ProductStat {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  avgPrice: number;
}

export const AnalyticsSales = () => {
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductStats();
  }, []);

  const fetchProductStats = async () => {
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

      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .eq('producer_id', profile.id);

      if (!products) {
        setLoading(false);
        return;
      }

      // Fetch all paid orders for these products
      const { data: orders } = await supabase
        .from('orders')
        .select('product_id, amount')
        .in('product_id', products.map(p => p.id))
        .or('status.eq.paid,status.eq.approved');

      const stats = products.map(product => {
        const productOrders = orders?.filter(o => o.product_id === product.id) || [];
        const sales = productOrders.length;
        const revenue = productOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
        const avgPrice = sales > 0 ? revenue / sales : 0;

        return {
          id: product.id,
          name: product.name,
          sales,
          revenue,
          avgPrice
        };
      });

      // Sort by revenue descending
      stats.sort((a, b) => b.revenue - a.revenue);

      setProductStats(stats);
    } catch (error) {
      console.error("Error fetching sales stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando vendas...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sales Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Produto</CardTitle>
          <CardDescription>Receita gerada por cada produto.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" name="Receita Total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Product Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes por Produto</CardTitle>
          <CardDescription>Métricas detalhadas de cada infoproduto.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Ticket Médio</TableHead>
                <TableHead className="text-right">Receita Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productStats.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum produto com vendas.</TableCell>
                </TableRow>
              ) : (
                productStats.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sales}</TableCell>
                    <TableCell>{formatCurrency(product.avgPrice)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(product.revenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
