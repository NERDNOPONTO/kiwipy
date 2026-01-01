import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, Clock } from "lucide-react";

interface CustomerMetricsProps {
    uniqueCustomers?: number;
    newCustomers?: number;
    repeatRate?: number;
    ltv?: number;
}

export const CustomerMetrics = ({ 
    uniqueCustomers = 0, 
    newCustomers = 0, 
    repeatRate = 0, 
    ltv = 0 
}: CustomerMetricsProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Métricas de Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2 p-4 bg-secondary/30 rounded-lg">
             <div className="flex items-center space-x-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Clientes Únicos</span>
             </div>
             <span className="text-2xl font-bold">{uniqueCustomers}</span>
             {/* <span className="text-xs text-green-500">+12% vs mês anterior</span> */}
          </div>

          <div className="flex flex-col space-y-2 p-4 bg-secondary/30 rounded-lg">
             <div className="flex items-center space-x-2 text-muted-foreground">
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Novos Clientes (Mês)</span>
             </div>
             <span className="text-2xl font-bold">{newCustomers}</span>
             {/* <span className="text-xs text-green-500">+5% vs mês anterior</span> */}
          </div>

          <div className="flex flex-col space-y-2 p-4 bg-secondary/30 rounded-lg">
             <div className="flex items-center space-x-2 text-muted-foreground">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Taxa de Recompra</span>
             </div>
             <span className="text-2xl font-bold">{repeatRate}%</span>
             <span className="text-xs text-muted-foreground">Média do setor: 25%</span>
          </div>

          <div className="flex flex-col space-y-2 p-4 bg-secondary/30 rounded-lg">
             <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">LTV Médio</span>
             </div>
             <span className="text-2xl font-bold">{formatCurrency(ltv)}</span>
             {/* <span className="text-xs text-green-500">+8% vs mês anterior</span> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
