
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";
import { AnalyticsAcquisition } from "@/components/analytics/AnalyticsAcquisition";
import { AnalyticsBehavior } from "@/components/analytics/AnalyticsBehavior";
import { AnalyticsAudience } from "@/components/analytics/AnalyticsAudience";
import { AnalyticsSales } from "@/components/analytics/AnalyticsSales";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

const Analytics = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Dados atualizados",
        description: "As métricas foram sincronizadas com o servidor.",
      });
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-display">Analytics</h2>
            <p className="text-muted-foreground">
              Dashboard completo de performance do seu negócio digital.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => toast({ title: "Exportando relatório...", description: "O download iniciará em instantes." })}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-2 h-auto md:h-10 w-[400px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sales">Vendas por Produto</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <AnalyticsOverview />
          </TabsContent>
          
          <TabsContent value="sales" className="space-y-4">
            <AnalyticsSales />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
