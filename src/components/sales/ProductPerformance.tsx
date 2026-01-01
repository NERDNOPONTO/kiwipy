import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProductPerformanceProps {
  orders: any[];
}

export const ProductPerformance = ({ orders }: ProductPerformanceProps) => {
  // Aggregate data by product
  const productStats = orders.reduce((acc: any, order) => {
    if (!order.products) return acc;
    const pid = order.products.id || order.product_id; // assuming product_id is available or in products relation
    const pname = order.products.name;
    
    if (!acc[pid]) {
      acc[pid] = {
        id: pid,
        name: pname,
        sales: 0,
        revenue: 0,
        approved: 0,
      };
    }
    
    acc[pid].sales += 1;
    if (order.status === 'approved') {
      acc[pid].revenue += order.amount || 0;
      acc[pid].approved += 1;
    }
    
    return acc;
  }, {});

  const products = Object.values(productStats).sort((a: any, b: any) => b.revenue - a.revenue);
  const totalRevenue = products.reduce((sum: number, p: any) => sum + p.revenue, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Produto</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead>% Total</TableHead>
              <TableHead>Ticket Médio</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.approved} / {product.sales}</TableCell>
                <TableCell>{formatCurrency(product.revenue)}</TableCell>
                <TableCell className="w-[150px]">
                  <div className="flex items-center gap-2">
                    <Progress value={(product.revenue / totalRevenue) * 100} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      {((product.revenue / totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(product.approved > 0 ? product.revenue / product.approved : 0)}
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                     Ativo
                   </Badge>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum dado de produto disponível.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
