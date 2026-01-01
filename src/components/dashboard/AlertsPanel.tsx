import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface AlertItem {
    type: 'destructive' | 'warning' | 'success';
    title: string;
    description: string;
}

interface AlertsPanelProps {
    alerts?: AlertItem[];
}

export const AlertsPanel = ({ alerts = [] }: AlertsPanelProps) => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
                Nenhum alerta importante no momento.
            </div>
        ) : (
            alerts.map((alert, index) => (
                <Alert 
                    key={index} 
                    variant={alert.type === 'destructive' ? 'destructive' : 'default'}
                    className={
                        alert.type === 'warning' ? "border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10" :
                        alert.type === 'success' ? "border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10" :
                        ""
                    }
                >
                  {alert.type === 'destructive' && <AlertCircle className="h-4 w-4" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                  {alert.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                  
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>
                    {alert.description}
                  </AlertDescription>
                </Alert>
            ))
        )}
      </CardContent>
    </Card>
  );
};
