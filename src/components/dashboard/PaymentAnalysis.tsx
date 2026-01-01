import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PaymentMethodData {
  name: string;
  value: number;
  color: string;
}

interface PaymentAnalysisProps {
  data?: PaymentMethodData[];
}

export const PaymentAnalysis = ({ data }: PaymentAnalysisProps) => {
  const defaultData = [
      { name: "Sem dados", value: 100, color: "#e2e8f0" }
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Métodos de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
