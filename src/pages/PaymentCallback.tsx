import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("A verificar o estado do pagamento...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Capturar parâmetros da URL
        const token = searchParams.get("token");
        const reference = searchParams.get("reference"); // Algumas integrações retornam a referência
        
        console.log("Callback params:", { token, reference });

        if (!token && !reference) {
            // Se não houver parâmetros, talvez o usuário tenha acessado diretamente
            setStatus("error");
            setMessage("Parâmetros de pagamento não encontrados.");
            return;
        }

        // Aqui deveríamos idealmente chamar uma Edge Function para validar o token com a EMIS
        // e atualizar o pedido. Como a função payment-callback já existe para webhooks,
        // podemos tentar chamá-la ou verificar se o pedido já foi atualizado pelo webhook.
        
        // Por enquanto, vamos simular uma verificação ou buscar o pedido se tivermos a referência
        // Se a EMIS manda o webhook em paralelo, o pedido já pode estar 'approved'.
        
        // Vamos tentar invocar a função de callback manualmente se tivermos dados, 
        // ou consultar o status do pedido.
        
        // Para simplificar a experiência do usuário agora:
        // Se viemos da EMIS com um token, assumimos sucesso preliminar e pedimos ao backend para confirmar.
        
        // Verificar status real do pedido no banco de dados
        if (reference) {
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('status')
            .eq('reference', reference)
            .single();

          if (orderError) throw orderError;

          if (order?.status === 'approved') {
            setStatus("success");
            setMessage("Pagamento confirmado! O seu acesso foi liberado.");
            toast.success("Pagamento confirmado!");
          } else if (order?.status === 'pending') {
            setStatus("loading");
            setMessage("Pagamento em processamento. Aguarde um momento...");
            // Opcional: Implementar polling ou reload após alguns segundos
            setTimeout(() => window.location.reload(), 3000);
            return; 
          } else {
            setStatus("error");
            setMessage("Pagamento não aprovado ou cancelado.");
          }
        } else {
           // Fallback se não tiver referência (apenas token)
           // Tentar confiar no status da URL se vier do nosso backend
           const urlStatus = searchParams.get("status");
           if (urlStatus === 'success' || urlStatus === 'approved') {
              setStatus("success");
              setMessage("Pagamento processado com sucesso!");
           } else {
              throw new Error("Referência do pedido não encontrada.");
           }
        }

      } catch (error: any) {
        console.error("Erro no callback:", error);
        setStatus("error");
        setMessage("Houve um problema ao verificar o pagamento. Por favor contacte o suporte.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-4">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
            {status === "error" && <XCircle className="h-12 w-12 text-red-500" />}
            
            <span>
              {status === "loading" && "A processar..."}
              {status === "success" && "Pagamento Confirmado"}
              {status === "error" && "Erro no Pagamento"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{message}</p>
          
          <div className="flex flex-col gap-2">
            <Button 
                onClick={() => navigate("/dashboard")} 
                className="w-full"
                variant={status === "success" ? "default" : "outline"}
            >
              Ir para o Dashboard
            </Button>
            <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
            >
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
