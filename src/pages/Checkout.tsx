import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Zap, 
  Shield, 
  Lock, 
  User, 
  Mail, 
  Phone,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";

// Mock product data - in real app this would come from API
const mockProduct = {
  id: "prod_001",
  name: "Curso de Marketing Digital Completo",
  description: "Aprenda do zero ao avançado tudo sobre marketing digital, incluindo SEO, redes sociais, email marketing e muito mais.",
  price: 25000,
  priceFormatted: "25.000 Kz",
  producer: "Academia Digital",
  image: "📚",
  features: [
    "50+ horas de conteúdo em vídeo",
    "Certificado de conclusão",
    "Acesso vitalício",
    "Suporte direto com o instrutor",
    "Comunidade exclusiva"
  ]
};

const Checkout = () => {
  const { productId } = useParams();
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Create order and get payment URL
    // This would integrate with CulongaPay
    
    setTimeout(() => {
      setIsLoading(false);
      setStep('payment');
    }, 1500);
  };

  const handlePaymentComplete = () => {
    // This would be triggered by webhook/callback
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Pagamento Confirmado! 🎉
          </h1>
          <p className="text-muted-foreground mb-8">
            Obrigado pela sua compra! Enviamos os detalhes de acesso para o seu email.
          </p>
          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card mb-8">
            <div className="text-6xl mb-4">{mockProduct.image}</div>
            <h2 className="font-display font-bold text-foreground mb-2">{mockProduct.name}</h2>
            <p className="text-sm text-muted-foreground">O seu acesso já está disponível!</p>
          </div>
          <Button variant="accent" size="lg" className="w-full">
            Acessar Conteúdo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-card border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">InfoPay</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Compra segura</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Product Info - Left Side */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden sticky top-8">
                {/* Product Image */}
                <div className="h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-6xl">
                  {mockProduct.image}
                </div>
                
                <div className="p-6">
                  <span className="text-sm text-muted-foreground">{mockProduct.producer}</span>
                  <h2 className="font-display text-xl font-bold text-foreground mt-1 mb-3">
                    {mockProduct.name}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {mockProduct.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {mockProduct.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total a pagar</span>
                      <span className="font-display text-2xl font-bold text-foreground">
                        {mockProduct.priceFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Form - Right Side */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 md:p-8">
                {step === 'form' ? (
                  <>
                    <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                      Finalizar Compra
                    </h1>
                    <p className="text-muted-foreground mb-8">
                      Preencha os seus dados para continuar
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Seu nome completo"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="pl-11 h-12"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="pl-11 h-12"
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          O acesso ao produto será enviado para este email
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+244 9XX XXX XXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="pl-11 h-12"
                            required
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        variant="hero" 
                        size="xl" 
                        className="w-full mt-6"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                        ) : (
                          <>
                            Continuar para Pagamento
                            <Lock className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                        <Shield className="w-4 h-4" />
                        <span>Os seus dados estão protegidos</span>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                      Pagamento
                    </h1>
                    <p className="text-muted-foreground mb-8">
                      Complete o pagamento via Multicaixa Express
                    </p>

                    {/* Payment iframe placeholder */}
                    <div className="bg-secondary/50 rounded-xl p-8 text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-muted-foreground mb-4">
                        Janela de pagamento CulongaPay
                      </p>
                      <p className="text-sm text-muted-foreground">
                        (Em produção, o iframe de pagamento aparecerá aqui)
                      </p>
                    </div>

                    {/* Demo button to simulate payment */}
                    <Button 
                      variant="success" 
                      size="lg" 
                      className="w-full"
                      onClick={handlePaymentComplete}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Simular Pagamento Confirmado
                    </Button>

                    <button 
                      onClick={() => setStep('form')}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
                    >
                      ← Voltar ao formulário
                    </button>
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Pagamento Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>SSL Encriptado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
