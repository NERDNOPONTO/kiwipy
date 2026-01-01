import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Calendar } from "lucide-react";

interface ProducerSubscriptionScreenProps {
  onSubscriptionComplete: () => void;
}

export const ProducerSubscriptionScreen = ({ onSubscriptionComplete }: ProducerSubscriptionScreenProps) => {
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    loadDailyPlan();
  }, []);

  const loadDailyPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_plans')
        .select('*')
        .eq('interval', 'daily')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      setDailyPlan(data);
    } catch (error) {
      console.error("Error loading daily plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!dailyPlan) return;
    
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      if (!profile) throw new Error("Perfil não encontrado");

      // Chamada real para gerar o pagamento
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId: dailyPlan.id,
          days: days,
          email: session.user.email,
          name: profile.full_name || session.user.email,
          phone: profile.phone,
          userId: session.user.id
        }
      });

      if (checkoutError) throw checkoutError;
      
      if (checkoutData?.url) {
        setPaymentUrl(checkoutData.url);
      } else {
        throw new Error("URL de pagamento não retornada");
      }

    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar assinatura",
        description: "Tente novamente mais tarde."
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!dailyPlan) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Configuração Pendente</CardTitle>
                <CardDescription>O sistema de assinaturas está em manutenção. Entre em contato com o suporte.</CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }

  if (paymentUrl) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-gray-50/50">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Pagamento Seguro</CardTitle>
                <CardDescription>Complete o pagamento para ativar sua assinatura</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full aspect-[562/816] max-h-[700px] mb-6 rounded-xl overflow-hidden border border-border relative">
                    <iframe 
                        src={paymentUrl}
                        className="w-full h-full border-0"
                        title="Pagamento Seguro"
                    />
                </div>
                <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setPaymentUrl(null)}
                >
                    Cancelar
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  const total = dailyPlan.price * days;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Ative sua Conta</CardTitle>
          <CardDescription>
            Para acessar o painel, escolha por quanto tempo deseja utilizar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">Valor da diária</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(dailyPlan.price)}</p>
          </div>

          <div className="space-y-2">
            <Label>Quantos dias você quer usar?</Label>
            <div className="flex items-center gap-4">
                <Input 
                    type="number" 
                    min="1" 
                    value={days} 
                    onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 0))}
                    className="text-lg"
                />
                <span className="text-muted-foreground whitespace-nowrap">dias</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-medium">Total a pagar:</span>
            <span className="text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSubscribe} 
            disabled={processing}
          >
            {processing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                </>
            ) : (
                "Pagar e Acessar"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
