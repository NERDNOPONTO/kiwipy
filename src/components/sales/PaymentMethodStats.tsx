import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PaymentMethodStatsProps {
  orders: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const PaymentMethodStats = ({ orders }: PaymentMethodStatsProps) => {
  const data = orders.reduce((acc: any[], order) => {
    const method = order.payment_data?.paymentMethod || 'Outros';
    const existing = acc.find(item => item.name === method);
    if (existing) {
      existing.value += 1;
      existing.amount += order.amount || 0;
    } else {
      acc.push({ name: method, value: 1, amount: order.amount || 0 });
    }
    return acc;
  }, []);

  // Sort by value
  data.sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="col-span-4 md:col-span-2">
      <CardHeader>
        <CardTitle>Métodos de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value} vendas (${((value/total)*100).toFixed(1)}%)`, 
                  name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
