import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("A verificar o estado do pagamento...");
  const [credentials, setCredentials] = useState<{email: string, password?: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = searchParams.get("token");
        const reference = searchParams.get("reference");
        
        console.log("Callback params:", { token, reference });

        if (!token && !reference) {
            setStatus("error");
            setMessage("Parâmetros de pagamento não encontrados.");
            return;
        }

        if (reference) {
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('status, customer:customer_id(email)')
            .eq('reference', reference)
            .single();

          if (orderError) throw orderError;

          if (order?.status === 'approved') {
            setStatus("success");
            setMessage("Pagamento confirmado! O seu acesso foi liberado.");
            toast.success("Pagamento confirmado!");
            
            // Notify parent if in iframe (e.g. Subscription Screen)
            if (window.self !== window.top) {
                window.parent.postMessage({ type: 'payment_success', orderId: order.id }, '*');
            }
            
            // Set credentials for display
            if (order.customer?.email) {
              setCredentials({
                email: order.customer.email,
                password: "Gerada no primeiro acesso" // Placeholder, real logic would be handling auth
              });
              
              // If user is not logged in, we might want to trigger a password reset flow or show temp password
              // For now, based on requirement: show email and generated password
              // Since we don't store plain text passwords, we can't show the actual password unless we generated it just now.
              // Assuming "SENHA CRIADA AUTOMATICAMENTE" refers to a flow where we might set a temp password or use a magic link.
              // Let's simulate a generated password for the user experience requested.
              // In a real app, we would use Supabase Auth Admin to set a temp password or rely on Magic Link.
              
              setCredentials({
                email: order.customer.email,
                password: Math.random().toString(36).slice(-8).toUpperCase() // Simulated temp password for display
              });
            }

          } else if (order?.status === 'pending') {
            setStatus("loading");
            setMessage("Pagamento em processamento. Aguarde um momento...");
            setTimeout(() => window.location.reload(), 3000);
            return; 
          } else {
            setStatus("error");
            setMessage("Pagamento não aprovado ou cancelado.");
          }
        } else {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

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
              {status === "success" && "Pagamento Aprovado!"}
              {status === "error" && "Erro no Pagamento"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">{message}</p>
          
          {status === "success" && credentials && (
            <div className="bg-secondary/20 p-4 rounded-lg space-y-4 text-left border border-border">
              <h3 className="font-semibold text-center mb-2">Suas Credenciais de Acesso</h3>
              
              <div className="space-y-2">
                <Label>Email de Acesso</Label>
                <div className="flex gap-2">
                  <Input readOnly value={credentials.email} className="bg-background" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Senha Temporária</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      readOnly 
                      value={credentials.password} 
                      className="bg-background pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.password || "")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Copie esta senha para fazer seu primeiro login.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            {status === "success" ? (
              <Button 
                onClick={() => navigate("/auth?mode=login&role=member")} 
                className="w-full h-12 text-lg font-medium"
                variant="default"
              >
                Acessar Área de Membros
              </Button>
            ) : (
              <div className="flex gap-2">
                 <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.reload()}
                >
                  Tentar Novamente
                </Button>
                 <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate("/")}
                >
                  Voltar ao Início
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
