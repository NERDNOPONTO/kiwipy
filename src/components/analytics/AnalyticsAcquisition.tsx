
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trafficSources, campaigns } from "@/data/mockAnalyticsData";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const AnalyticsAcquisition = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Traffic Sources Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Origens de Tráfego</CardTitle>
            <CardDescription>Distribuição de sessões por canal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes por Canal</CardTitle>
            <CardDescription>Performance de conversão por origem.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {trafficSources.map((source, index) => (
                 <div key={index} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                     <div>
                       <p className="font-medium text-sm">{source.name}</p>
                       <p className="text-xs text-muted-foreground">{source.sessions} sessões</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-sm">{source.conversion}</p>
                     <p className="text-xs text-muted-foreground">Conv.</p>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas de Marketing</CardTitle>
          <CardDescription>ROI e performance das suas campanhas ativas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Cliques</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{campaign.channel}</Badge>
                  </TableCell>
                  <TableCell>{campaign.clicks}</TableCell>
                  <TableCell>{campaign.ctr}</TableCell>
                  <TableCell>{campaign.cost}</TableCell>
                  <TableCell className="text-emerald-600 font-medium">{campaign.revenue}</TableCell>
                  <TableCell>
                    <Badge variant={parseFloat(campaign.roas) > 4 ? "default" : "secondary"} className={parseFloat(campaign.roas) > 4 ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                      {campaign.roas}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
