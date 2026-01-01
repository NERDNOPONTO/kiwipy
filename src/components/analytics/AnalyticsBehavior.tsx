
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { topPages, conversionFunnel, speedMetrics } from "@/data/mockAnalyticsData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Gauge, Zap, AlertTriangle, CheckCircle } from "lucide-react";

export const AnalyticsBehavior = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>Jornada do usuário até a compra.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={conversionFunnel}
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {conversionFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Páginas Mais Visitadas</CardTitle>
            <CardDescription>Onde seus usuários passam mais tempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Página</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Rejeição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.map((page, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-xs truncate max-w-[150px]" title={page.path}>
                      {page.path}
                    </TableCell>
                    <TableCell>{page.views}</TableCell>
                    <TableCell>{page.time}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={parseInt(page.bounce)} className="h-2 w-12" />
                        <span className="text-xs">{page.bounce}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Speed & Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Velocidade e Performance</CardTitle>
          <CardDescription>Métricas Core Web Vitals e experiência do usuário.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {speedMetrics.map((metric, i) => (
              <div key={i} className="flex flex-col items-center p-4 border rounded-lg bg-secondary/10">
                {metric.status === 'good' ? (
                   <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                ) : metric.status === 'average' ? (
                   <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                ) : (
                   <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                )}
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-xs text-center text-muted-foreground mt-1">{metric.metric}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
