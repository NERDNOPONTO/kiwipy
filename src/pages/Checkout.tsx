import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  Shield, 
  Lock, 
  User, 
  Mail, 
  Phone,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Star,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Checkout = () => {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const affiliateRef = searchParams.get('ref');
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Customization States
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isStockout, setIsStockout] = useState(false);
  const [displayedStock, setDisplayedStock] = useState<number | null>(null);

  // Animated Number Hook logic inline
  const [animatedStock, setAnimatedStock] = useState<number | null>(null);

  useEffect(() => {
    if (displayedStock === null) return;
    if (animatedStock === null) {
      setAnimatedStock(displayedStock);
      return;
    }

    if (animatedStock === displayedStock) return;

    const diff = Math.abs(displayedStock - animatedStock);
    const duration = 1000; // 1 second animation
    const intervalTime = Math.max(50, duration / diff); // adjust speed

    const timer = setInterval(() => {
      setAnimatedStock(prev => {
        if (prev === null) return displayedStock;
        if (prev === displayedStock) {
          clearInterval(timer);
          return prev;
        }
        return prev > displayedStock ? prev - 1 : prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [displayedStock, animatedStock]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Aceita mensagens da EMIS ou do domínio Culonga
      if (event.origin !== "https://cerpagamentonline.emis.co.ao" && event.origin !== "https://culonga.com") return;
      
      const { status } = event.data;
      if (status === "SUCCESS" || status === "COMPLETED") {
        handlePaymentComplete();
      } else if (status === "REJECTED" || status === "ERROR") {
        toast({
          variant: "destructive",
          title: "Pagamento não concluído",
          description: "A transação foi rejeitada ou cancelada.",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [toast]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        let finalProduct = null;

        // 1. Try to find as Product
        const { data: productData } = await supabase
          .from('products')
          .select(`
            *,
            profiles:producer_id (
              full_name
            )
          `)
          .eq('id', productId)
          .maybeSingle();

        if (productData) {
          finalProduct = productData;
        } else {
          // 2. Try to find as Offer
          const { data: offerData } = await supabase
            .from('offers')
            .select(`
              *,
              products:product_id (
                *,
                profiles:producer_id (
                  full_name
                )
              )
            `)
            .eq('id', productId)
            .maybeSingle();

          if (offerData && offerData.products) {
            finalProduct = {
              ...offerData.products,
              price: offerData.price,
              checkout_settings: offerData.checkout_settings,
              offer_id: offerData.id
            };
          }
        }

        if (!finalProduct) throw new Error("Produto não encontrado");
        setProduct(finalProduct);
        
        // Setup Timer
        if (finalProduct.checkout_settings?.timer_enabled) {
          setTimeLeft(finalProduct.checkout_settings.timer_duration || 900);
        }

        // Check Stock
        if (finalProduct.stock_enabled && finalProduct.stock_limit !== null) {
          setDisplayedStock(finalProduct.stock_limit);
          if (finalProduct.stock_limit <= 0) {
            setIsStockout(true);
          }
        }

        if (productId) trackEvent('view_product', productId);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar produto",
          description: "Não foi possível encontrar o produto solicitado.",
        });
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId, toast]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Scarcity Logic (Fake Stock Drop)
  useEffect(() => {
    if (product?.checkout_settings?.scarcity_events && displayedStock !== null && !isStockout) {
      const timeouts: NodeJS.Timeout[] = [];
      
      product.checkout_settings.scarcity_events.forEach((event: any) => {
        const timeout = setTimeout(() => {
          setDisplayedStock(prev => {
            if (prev === null || prev <= 1) return prev; // Don't go below 1 or null
            const newStock = Math.max(1, prev - event.amount);
            return newStock;
          });
        }, event.delay * 1000);
        timeouts.push(timeout);
      });

      return () => timeouts.forEach(clearTimeout);
    }
  }, [product?.id]); // Only run when product ID changes (loaded)

  // Social Proof Notifications (Fake)
  useEffect(() => {
    if (product?.social_proof_settings?.notifications_enabled) {
      const interval = setInterval(() => {
        const names = ["João", "Maria", "Pedro", "Ana", "Carlos"];
        const cities = ["Luanda", "Benguela", "Huíla", "Lobito"];
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        
        toast({
          title: "Nova compra verificada!",
          description: `${randomName} de ${randomCity} acabou de comprar.`,
          duration: 3000,
        });
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [product, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStockout) {
      toast({
        variant: "destructive",
        title: "Produto Esgotado",
        description: "Infelizmente as vagas para este produto acabaram."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create checkout session via Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          productId: product.id,
          offerId: product.offer_id, // Pass offerId if it exists (from custom offer)
          affiliateRef: affiliateRef // Pass affiliateRef to track commission
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error); // Handle business logic error from function
      if (!data.paymentUrl) throw new Error("Falha ao gerar URL de pagamento");

      setPaymentUrl(data.paymentUrl);
      setCurrentOrder({ id: data.orderId, reference: data.reference });
      setIsLoading(false);
      setStep('payment');
      if (productId) trackEvent('begin_checkout', productId, { step: 'payment' });

    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Erro no checkout",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
      });
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = async () => {
    setIsLoading(true);
    // O callback do backend processará a atualização do status
    // Aqui apenas redirecionamos para o sucesso
    setStep('success');
    setIsLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price);
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  const primaryColor = product.checkout_settings?.primary_color || '#f97316';

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
            <div className="text-6xl mb-4 h-24 w-24 mx-auto flex items-center justify-center bg-accent/10 rounded-full overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span>📦</span>
                )}
            </div>
            <h2 className="font-display font-bold text-foreground mb-2">{product.name}</h2>
            <p className="text-sm text-muted-foreground">O seu acesso já está disponível!</p>
          </div>
          <Button 
            size="lg" 
            className="w-full text-white" 
            style={{ backgroundColor: primaryColor }}
            asChild
          >
            <a href={product.content_url} target="_blank" rel="noopener noreferrer">
              Acessar Conteúdo
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Timer Bar */}
      {product.checkout_settings?.timer_enabled && timeLeft > 0 && (
        <div className="bg-destructive text-destructive-foreground py-2 text-center text-sm font-medium sticky top-0 z-50">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Esta oferta expira em: {formatTime(timeLeft)}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Zap className="w-4 h-4" />
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

      {/* Custom Banner */}
      {product.checkout_settings?.banner_url && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img 
            src={product.checkout_settings.banner_url} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

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
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden sticky top-8">
                {/* Product Image */}
                {!product.checkout_settings?.banner_url && (
                  <div className="h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">📦</span>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <span className="text-sm text-muted-foreground">{product.profiles?.full_name}</span>
                  <h2 className="font-display text-xl font-bold text-foreground mt-1 mb-3">
                    {product.name}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {product.description}
                  </p>

                  {/* Stock Alert */}
                  {product.stock_enabled && (
                    <div className="mb-6 p-3 bg-secondary/50 rounded-lg flex items-center gap-3 border border-border/50">
                       <AlertCircle className={`w-5 h-5 ${isStockout ? 'text-destructive' : 'text-orange-500 animate-pulse'}`} />
                       <span className="text-sm font-medium">
                         {isStockout 
                           ? "Vagas Esgotadas!" 
                           : `Restam apenas ${displayedStock} vagas!`}
                       </span>
                    </div>
                  )}

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {Array.isArray(product.features) && product.features.map((feature: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                        </div>
                        <span className="text-muted-foreground">{String(feature)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total a pagar</span>
                      <span className="font-display text-2xl font-bold text-foreground">
                        {formatPrice(product.price)}
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
                        <Label htmlFor="phone" className="text-foreground">WhatsApp / Telefone</Label>
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
                            minLength={9}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Obrigatório para receber notificações da compra
                        </p>
                      </div>

                      <Button 
                        type="submit" 
                        size="xl" 
                        className="w-full mt-6 text-white"
                        style={{ backgroundColor: primaryColor }}
                        disabled={isLoading || isStockout}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isStockout ? (
                          "Esgotado"
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

                    {/* Payment iframe */}
                    {paymentUrl ? (
                      <div className="w-full aspect-[562/816] max-h-[700px] mb-6 rounded-xl overflow-hidden border border-border">
                        <iframe 
                          src={paymentUrl}
                          width="100%" 
                          height="100%" 
                          frameBorder="0"
                          title="Pagamento"
                        />
                      </div>
                    ) : (
                      <div className="bg-secondary/50 rounded-xl p-8 text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Lock className="w-8 h-8 text-primary" />
                        </div>
                         <p>Carregando pagamento...</p>
                      </div>
                    )}

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

          {/* Testimonials - Moved to bottom */}
          {product.social_proof_settings?.testimonials_enabled && product.social_proof_settings.testimonials?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border/50 animate-in slide-in-from-bottom-4 duration-700">
              <h3 className="font-display text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                O que dizem sobre nós
              </h3>
              
              <Carousel className="w-full max-w-5xl mx-auto" opts={{ align: "start", loop: true }}>
                <CarouselContent className="-ml-4">
                  {product.social_proof_settings.testimonials.map((t: any, i: number) => (
                    <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm h-full flex flex-col justify-between hover:shadow-md transition-shadow">
                         <div className="mb-4">
                           <div className="flex text-yellow-400 mb-3">
                             {[...Array(t.rating || 5)].map((_, i) => (
                               <Star key={i} className="w-4 h-4 fill-current" />
                             ))}
                           </div>
                           <p className="text-foreground italic leading-relaxed text-sm">"{t.content}"</p>
                         </div>
                         
                         <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/30">
                            <Avatar className="w-10 h-10 border border-border">
                              <AvatarImage src={t.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary">{t.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                               <p className="font-semibold text-sm">{t.name}</p>
                               <p className="text-xs text-muted-foreground">Cliente Verificado</p>
                            </div>
                         </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center gap-4 mt-8">
                  <CarouselPrevious className="static translate-y-0 hover:bg-primary hover:text-white transition-colors" />
                  <CarouselNext className="static translate-y-0 hover:bg-primary hover:text-white transition-colors" />
                </div>
              </Carousel>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Checkout;
