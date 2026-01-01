import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
}

interface ProductMetricsProps {
  products?: Product[];
}

export const ProductMetrics = ({ products = [] }: ProductMetricsProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

  // Se não houver produtos, mostrar mensagem amigável ou estado vazio
  if (!products || products.length === 0) {
     return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Top Produtos</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                    Nenhum produto vendido ainda.
                </div>
            </CardContent>
        </Card>
     );
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Top Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {product.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{product.sales} vendas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(product.revenue)}</p>
                    <div className={`flex items-center justify-end text-xs ${product.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {product.growth >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {Math.abs(product.growth)}%
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
