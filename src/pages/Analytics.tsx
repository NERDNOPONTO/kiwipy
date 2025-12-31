import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3 } from "lucide-react";

const Analytics = () => {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="w-12 h-12 text-accent-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Em breve você poderá visualizar relatórios detalhados de vendas, conversão e comportamento dos clientes.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
