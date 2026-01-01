
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { demographics } from "@/data/mockAnalyticsData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Globe, Smartphone, Monitor, Tablet } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const AnalyticsAudience = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geografia</CardTitle>
            <CardDescription>De onde vêm seus visitantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              <div className="flex items-center justify-center p-4 bg-secondary/20 rounded-lg">
                <Globe className="w-16 h-16 text-primary/40" />
                <span className="ml-4 text-sm text-muted-foreground">Mapa interativo indisponível na pré-visualização.</span>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Principais Países</h4>
                {demographics.countries.map((country, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {country.country}
                      </span>
                      <span className="text-muted-foreground">{country.users} ({country.percentage}%)</span>
                    </div>
                    <Progress value={country.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
            <CardDescription>Plataformas utilizadas para acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographics.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {demographics.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Smartphone className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
               <div className="p-2 border rounded bg-secondary/10">
                 <Smartphone className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                 <span className="text-xs font-bold block">68%</span>
                 <span className="text-[10px] text-muted-foreground">Mobile</span>
               </div>
               <div className="p-2 border rounded bg-secondary/10">
                 <Monitor className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                 <span className="text-xs font-bold block">28%</span>
                 <span className="text-[10px] text-muted-foreground">Desktop</span>
               </div>
               <div className="p-2 border rounded bg-secondary/10">
                 <Tablet className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                 <span className="text-xs font-bold block">4%</span>
                 <span className="text-[10px] text-muted-foreground">Tablet</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
