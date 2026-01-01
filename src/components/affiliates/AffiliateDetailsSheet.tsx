import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Instagram, 
  Youtube, 
  Globe, 
  ExternalLink,
  Copy,
  CreditCard,
  Clock,
  CheckCircle2,
  Ban
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AffiliateDetailsSheetProps {
  affiliate: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateDetailsSheet = ({ affiliate, isOpen, onClose }: AffiliateDetailsSheetProps) => {
  if (!affiliate) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={affiliate.avatar_url} />
              <AvatarFallback className="text-lg">{affiliate.name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl">{affiliate.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Badge variant="outline">{affiliate.tier || 'Bronze'}</Badge>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" /> Desde {new Date(affiliate.created_at).toLocaleDateString('pt-AO')}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="performance">Metas</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase">Informações de Contato</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{affiliate.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>+244 923 000 000</span> {/* Mock */}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>Luanda, Angola</span> {/* Mock */}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase">Redes Sociais</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Instagram className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Youtube className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Globe className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase">Dados Bancários</h3>
              <div className="bg-secondary/30 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">BAI</span>
                  <Badge variant="secondary">Padrão</Badge>
                </div>
                <p className="text-sm text-muted-foreground">AO06 0040.0000.1234.5678.9012.3</p>
                <p className="text-sm text-muted-foreground mt-1">Leonardo Soares</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Cliques Totais</p>
                <p className="text-2xl font-bold mt-1">1,234</p>
              </div>
              <div className="bg-card border p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold mt-1">{affiliate.sales_count}</p>
              </div>
              <div className="bg-card border p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold mt-1 text-emerald-500">{affiliate.conversion_rate}%</p>
              </div>
              <div className="bg-card border p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(affiliate.total_revenue / (affiliate.sales_count || 1))}</p>
              </div>
            </div>

            <div className="bg-card border p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Comissões Acumuladas</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-emerald-600">{formatCurrency(affiliate.total_commissions)}</span>
                <span className="text-sm text-muted-foreground mb-1">Lifetime</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">Venda #{1000 + i}</p>
                      <p className="text-xs text-muted-foreground">Produto Premium • {new Date().toLocaleDateString('pt-AO')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(25000)}</p>
                      <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Aprovada</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="links" className="space-y-4 mt-4">
             <div className="p-4 border rounded-lg bg-card">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className="font-medium">Link Principal</h4>
                   <p className="text-xs text-muted-foreground">Página de Vendas Padrão</p>
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                   <Copy className="w-4 h-4" />
                 </Button>
               </div>
               <code className="block bg-secondary p-2 rounded text-xs break-all">
                 https://kiwipy.ao/p/produto-xyz?ref={affiliate.id}
               </code>
               <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                 <span>1,203 cliques</span>
                 <span>45 vendas</span>
               </div>
             </div>

             <div className="p-4 border rounded-lg bg-card">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className="font-medium">Campanha Instagram</h4>
                   <p className="text-xs text-muted-foreground">Checkout Personalizado</p>
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                   <Copy className="w-4 h-4" />
                 </Button>
               </div>
               <code className="block bg-secondary p-2 rounded text-xs break-all">
                 https://kiwipy.ao/c/checkout-v2?ref={affiliate.id}&src=ig
               </code>
               <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                 <span>850 cliques</span>
                 <span>32 vendas</span>
               </div>
             </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-8 flex-col sm:flex-col gap-2">
           <Button className="w-full" variant="default">
             <CreditCard className="w-4 h-4 mr-2" /> Pagar Comissões
           </Button>
           <div className="flex gap-2 w-full">
             <Button variant="outline" className="flex-1">
               <Ban className="w-4 h-4 mr-2" /> Bloquear
             </Button>
             <Button variant="outline" className="flex-1">
               <Mail className="w-4 h-4 mr-2" /> Mensagem
             </Button>
           </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
