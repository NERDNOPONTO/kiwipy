import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ArrowLeft,
  Loader2,
  Upload,
  Save,
  Clock,
  LayoutTemplate,
  Users,
  Box,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Offer {
  id?: string; // Optional for new offers
  title: string;
  price: number;
  checkout_settings: any;
  social_proof_settings?: any; // Allow overriding social proof per offer
  is_default?: boolean;
}

const ProductEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(""); // Default Offer Price
  const [productType, setProductType] = useState("curso");
  const [recurrence, setRecurrence] = useState("monthly");
  const [imageUrl, setImageUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [hasSales, setHasSales] = useState(false);

  // Offers Management
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeOfferId, setActiveOfferId] = useState<string>("default"); // 'default' or offer index/id

  // Checkout Settings (Current Active Context)
  const [checkoutSettings, setCheckoutSettings] = useState({
    timer_enabled: false,
    timer_duration: 900, // 15 min
    banner_url: "",
    logo_url: "",
    primary_color: "#f97316",
    background_color: "#ffffff",
    ask_phone: true,
    ask_address: false,
    scarcity_events: [] as { delay: number; drop: number }[]
  });

  // Social Proof Settings (Current Active Context)
  const [socialProofSettings, setSocialProofSettings] = useState({
    testimonials_enabled: false,
    testimonials: [] as any[],
    notifications_enabled: false,
    fake_purchases_enabled: false
  });

  // When switching offers, we need to save current state to the previous offer and load new offer's state
  // But strictly syncing state is hard with React's async nature.
  // Strategy: Maintain a "Master State" of all settings, and `checkoutSettings` / `socialProofSettings` are just view/edit buffers.
  // Actually, let's keep `offers` updated whenever `checkoutSettings` changes? No, too many re-renders.
  // Better: When `activeOfferId` changes, flush current settings to the *previous* offer in the list, then load *new* offer settings.
  
  // To implement this safely, we can use a ref or just specific save functions. 
  // For simplicity, let's make `updateActiveOfferSettings` function that updates the `offers` array or the main product state.

  // Stock Settings (Global for Product for now)
  const [stockEnabled, setStockEnabled] = useState(false);
  const [stockLimit, setStockLimit] = useState<string>("");

  // Affiliate Settings
  const [isMarketplace, setIsMarketplace] = useState(false);
  const [marketplaceCategory, setMarketplaceCategory] = useState("");
  const [commissionRate, setCommissionRate] = useState("0");
  const [affiliateApprovalType, setAffiliateApprovalType] = useState("auto");
  const [affiliateRules, setAffiliateRules] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile) {
            setUserProfile(profile);
          }

          if (isEditing) {
            // Check Sales
            const { count } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('product_id', id)
              .eq('status', 'approved');
            
            setHasSales(!!count && count > 0);

            // Fetch Product
            const { data: product, error } = await supabase
              .from('products')
              .select('*')
              .eq('id', id)
              .single();

            if (error) throw error;

            if (product) {
              setName(product.name);
              setDescription(product.description || "");
              setPrice(product.price.toString());
              setProductType(product.product_type);
              if (product.recurrence_period) setRecurrence(product.recurrence_period);
              setImageUrl(product.image_url || "");
              setContentUrl(product.content_url || "");
              
              // Load Default Settings
              if (product.checkout_settings) {
                setCheckoutSettings({ ...checkoutSettings, ...product.checkout_settings });
              }
              
              if (product.social_proof_settings) {
                setSocialProofSettings({ ...socialProofSettings, ...product.social_proof_settings });
              }

              setStockEnabled(product.stock_enabled || false);
              setStockLimit(product.stock_limit ? product.stock_limit.toString() : "");

              // Load Affiliate Settings
              setIsMarketplace(product.is_marketplace || false);
              setMarketplaceCategory(product.marketplace_category || "");
              setCommissionRate(product.commission_rate ? product.commission_rate.toString() : "0");
              setAffiliateApprovalType(product.affiliate_approval_type || "auto");
              setAffiliateRules(product.affiliate_rules || "");

              // Fetch Additional Offers
              const { data: offersData } = await supabase
                .from('offers')
                .select('*')
                .eq('product_id', id);
              
              if (offersData) {
                setOffers(offersData);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as informações do produto."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditing]);

  // Store default product settings separately so we can swap back and forth
  const [defaultCheckoutSettings, setDefaultCheckoutSettings] = useState<any>(null);
  const [defaultSocialSettings, setDefaultSocialSettings] = useState<any>(null);

  // Initialize default settings when data loads
  useEffect(() => {
    if (!defaultCheckoutSettings && checkoutSettings && activeOfferId === 'default') {
      setDefaultCheckoutSettings(checkoutSettings);
    }
    if (!defaultSocialSettings && socialProofSettings && activeOfferId === 'default') {
      setDefaultSocialSettings(socialProofSettings);
    }
  }, [checkoutSettings, socialProofSettings, activeOfferId]);

  const handleSwitchOffer = (newOfferId: string) => {
    // 1. Save current settings to their source
    if (activeOfferId === 'default') {
      setDefaultCheckoutSettings(checkoutSettings);
      setDefaultSocialSettings(socialProofSettings);
    } else {
      setOffers(prev => prev.map(o => {
        if (o.id === activeOfferId || (o as any).tempId === activeOfferId) {
          return {
            ...o,
            checkout_settings: checkoutSettings,
            social_proof_settings: socialProofSettings
          };
        }
        return o;
      }));
    }

    // 2. Load new settings
    setActiveOfferId(newOfferId);
    if (newOfferId === 'default') {
      setCheckoutSettings(defaultCheckoutSettings || checkoutSettings);
      setSocialProofSettings(defaultSocialSettings || socialProofSettings);
    } else {
      const offer = offers.find(o => o.id === newOfferId || (o as any).tempId === newOfferId);
      if (offer) {
        setCheckoutSettings(offer.checkout_settings || {
           timer_enabled: false,
           timer_duration: 900,
           primary_color: "#f97316",
           scarcity_events: []
        });
        setSocialProofSettings(offer.social_proof_settings || {
           testimonials_enabled: false,
           testimonials: []
        });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!userProfile) throw new Error("Perfil não encontrado");
      if (!name || !price) throw new Error("Preencha os campos obrigatórios");

      if (isMarketplace) {
        const comm = parseInt(commissionRate);
        if (isNaN(comm) || comm < 0 || comm > 100) {
          throw new Error("A comissão deve ser entre 0% e 100%");
        }
        if (!marketplaceCategory) {
          throw new Error("Selecione uma categoria para o marketplace");
        }
      }

      // Ensure we have the latest settings for the currently active context
      let currentProductCheckout = defaultCheckoutSettings;
      let currentProductSocial = defaultSocialSettings;
      
      let finalOffers = [...offers];

      if (activeOfferId === 'default') {
        currentProductCheckout = checkoutSettings;
        currentProductSocial = socialProofSettings;
      } else {
        // Update the active offer in the list before saving
        finalOffers = finalOffers.map(o => {
          if (o.id === activeOfferId || (o as any).tempId === activeOfferId) {
            return {
              ...o,
              checkout_settings: checkoutSettings,
              social_proof_settings: socialProofSettings
            };
          }
          return o;
        });
      }

      const productData = {
        producer_id: userProfile.id,
        name,
        description,
        price: parseInt(price),
        product_type: productType as any,
        recurrence_period: productType === 'assinatura' ? recurrence : null,
        image_url: imageUrl,
        content_url: contentUrl,
        is_active: true,
        checkout_settings: currentProductCheckout,
        social_proof_settings: currentProductSocial,
        stock_enabled: stockEnabled,
        stock_limit: stockEnabled && stockLimit ? parseInt(stockLimit) : null,
        is_marketplace: isMarketplace,
        marketplace_category: marketplaceCategory,
        commission_rate: parseInt(commissionRate) || 0,
        affiliate_approval_type: affiliateApprovalType,
        affiliate_rules: affiliateRules
      };

      let productId = id;
      let error;
      
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        error = updateError;
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
        
        if (newProduct) productId = newProduct.id;
        error = insertError;
      }

      if (error) throw error;

      // Save Offers
      if (productId && finalOffers.length > 0) {
        for (const offer of finalOffers) {
          const offerData = {
            product_id: productId,
            title: offer.title,
            price: offer.price,
            checkout_settings: offer.checkout_settings,
            // Store social proof in checkout_settings or separate if schema allows? 
            // Schema has 'checkout_settings' on offers. Let's assume we merge or add column.
            // My schema migration added `checkout_settings` JSONB.
            // I'll merge social proof into checkout_settings for offers for now, or ignore it if column missing.
            // Actually, I should probably update the schema to include `social_proof_settings` on offers too, OR just put it inside `checkout_settings`.
            // Let's put it inside `checkout_settings` for offers to avoid schema changes if possible, but the code expects it separate.
            // Wait, I created the table with `checkout_settings`. I can put everything there.
          };

          // Merging social proof into checkout settings for the offer persistence
          const mergedSettings = {
            ...offer.checkout_settings,
            social_proof: offer.social_proof_settings
          };

          if (offer.id) {
             await supabase.from('offers').update({
               title: offer.title,
               price: offer.price,
               checkout_settings: mergedSettings
             }).eq('id', offer.id);
          } else {
             await supabase.from('offers').insert({
               product_id: productId,
               title: offer.title,
               price: offer.price,
               checkout_settings: mergedSettings
             });
          }
        }
      }

      toast({
        title: isEditing ? "Produto atualizado!" : "Produto criado!",
        description: `O produto e suas ofertas foram salvos com sucesso.`,
      });

      if (!isEditing) {
        navigate(`/dashboard/products/edit/${productId}`);
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addNewOffer = () => {
    const newOffer: Offer = {
      title: "Nova Oferta",
      price: 0,
      checkout_settings: { ...defaultCheckoutSettings },
      social_proof_settings: { ...defaultSocialSettings },
      // Use a temp ID for keying
      id: undefined
    };
    (newOffer as any).tempId = `new-${Date.now()}`;
    setOffers([...offers, newOffer]);
  };

  const removeOffer = async (index: number) => {
    const offer = offers[index];
    if (offer.id) {
      // Delete from DB
      const { error } = await supabase.from('offers').delete().eq('id', offer.id);
      if (error) {
        toast({ variant: "destructive", title: "Erro ao excluir oferta" });
        return;
      }
    }
    const newOffers = [...offers];
    newOffers.splice(index, 1);
    setOffers(newOffers);
    if (activeOfferId === offer.id || activeOfferId === (offer as any).tempId) {
      handleSwitchOffer('default');
    }
  };

  // Helper for copying link
  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };


  const addTestimonial = () => {
    setSocialProofSettings({
      ...socialProofSettings,
      testimonials: [
        ...socialProofSettings.testimonials,
        { name: "Cliente Satisfeito", content: "Ótimo produto!", rating: 5, avatar_url: "" }
      ]
    });
  };

  const updateTestimonial = (index: number, field: string, value: any) => {
    const newTestimonials = [...socialProofSettings.testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setSocialProofSettings({ ...socialProofSettings, testimonials: newTestimonials });
  };

  const removeTestimonial = (index: number) => {
    const newTestimonials = [...socialProofSettings.testimonials];
    newTestimonials.splice(index, 1);
    setSocialProofSettings({ ...socialProofSettings, testimonials: newTestimonials });
  };

  const addScarcityEvent = () => {
    setCheckoutSettings({
      ...checkoutSettings,
      scarcity_events: [
        ...(checkoutSettings.scarcity_events || []),
        { delay: 10, amount: 1 }
      ]
    });
  };

  const updateScarcityEvent = (index: number, field: string, value: number) => {
    const newEvents = [...(checkoutSettings.scarcity_events || [])];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setCheckoutSettings({ ...checkoutSettings, scarcity_events: newEvents });
  };

  const removeScarcityEvent = (index: number) => {
    const newEvents = [...(checkoutSettings.scarcity_events || [])];
    newEvents.splice(index, 1);
    setCheckoutSettings({ ...checkoutSettings, scarcity_events: newEvents });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/dashboard/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-2xl font-display font-bold">
              {isEditing ? "Editar Produto" : "Novo Produto"}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="offers">Ofertas e Preços</TabsTrigger>
            <TabsTrigger value="checkout">Checkout & Design</TabsTrigger>
            <TabsTrigger value="social">Prova Social</TabsTrigger>
            <TabsTrigger value="affiliates">Afiliação</TabsTrigger>
            <TabsTrigger value="advanced">Configurações Avançadas</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Produto</CardTitle>
                <CardDescription>Informações principais que aparecerão na página de vendas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    {hasSales && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>O nome não pode ser alterado pois já existem vendas aprovadas.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Curso de Marketing Digital"
                    disabled={hasSales}
                    className={hasSales ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-32"
                    placeholder="Descreva seu produto..."
                  />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Produto</Label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curso">Curso Online</SelectItem>
                        <SelectItem value="ebook">E-book</SelectItem>
                        <SelectItem value="mentoria">Mentoria</SelectItem>
                        <SelectItem value="assinatura">Assinatura</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                {productType === 'assinatura' && (
                  <div className="space-y-2">
                    <Label htmlFor="recurrence">Período</Label>
                    <Select value={recurrence} onValueChange={setRecurrence}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="image">Imagem de Capa (URL)</Label>
                    {hasSales && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>A capa não pode ser alterada pois já existem vendas aprovadas.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <Input 
                    id="image" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    disabled={hasSales}
                    className={hasSales ? "bg-muted" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Link do Conteúdo (URL)</Label>
                  <Input 
                    id="content" 
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder="Link para download ou área de membros"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ofertas e Preços</CardTitle>
                <CardDescription>Crie diferentes opções de preço e links para seu produto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Default Offer */}
                <div className="p-4 border rounded-lg bg-card relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                     <Button variant="outline" size="sm" onClick={() => copyLink(`${window.location.origin}/checkout/${id}`)}>
                       <Copy className="w-3 h-3 mr-2" />
                       Link
                     </Button>
                     <Button variant="secondary" size="sm" onClick={() => { setActiveOfferId('default'); document.getElementById('tab-checkout')?.click(); }}>
                       Personalizar Checkout
                     </Button>
                  </div>
                  <h3 className="font-semibold text-lg mb-4">Oferta Principal (Padrão)</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label>Preço (AOA)</Label>
                      <Input 
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Offers List */}
                {offers.map((offer, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-card relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                       <Button variant="ghost" size="icon" onClick={() => removeOffer(index)} className="text-destructive hover:bg-destructive/10">
                         <Trash2 className="w-4 h-4" />
                       </Button>
                       <Button variant="outline" size="sm" onClick={() => copyLink(`${window.location.origin}/checkout/${offer.id || 'save-first'}`)}>
                         <Copy className="w-3 h-3 mr-2" />
                         Link
                       </Button>
                       <Button variant="secondary" size="sm" onClick={() => { setActiveOfferId(offer.id || (offer as any).tempId); document.getElementById('tab-checkout')?.click(); }}>
                         Personalizar Checkout
                       </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                      <div className="space-y-2">
                        <Label>Nome da Oferta (Interno)</Label>
                        <Input 
                          value={offer.title} 
                          onChange={(e) => {
                            const newOffers = [...offers];
                            newOffers[index].title = e.target.value;
                            setOffers(newOffers);
                          }} 
                          placeholder="Ex: Promoção Relâmpago"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço (AOA)</Label>
                        <Input 
                          type="number"
                          value={offer.price} 
                          onChange={(e) => {
                            const newOffers = [...offers];
                            newOffers[index].price = parseFloat(e.target.value);
                            setOffers(newOffers);
                          }} 
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addNewOffer} className="w-full py-8 border-dashed">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Nova Oferta
                </Button>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Checkout & Design Tab */}
          <TabsContent value="checkout" className="space-y-6">
            
            {/* Context Selector */}
            <div className="bg-muted/50 p-4 rounded-lg border flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <Label>Personalizando Checkout de:</Label>
                 <Select value={activeOfferId} onValueChange={handleSwitchOffer}>
                   <SelectTrigger className="w-[300px]">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="default">Oferta Principal (Padrão)</SelectItem>
                     {offers.map((o, i) => (
                       <SelectItem key={i} value={o.id || (o as any).tempId || `temp-${i}`}>
                         {o.title} - {o.price} AOA
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="text-xs text-muted-foreground">
                 {activeOfferId === 'default' ? "Configurações aplicadas ao link principal" : "Configurações exclusivas deste link"}
               </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Personalização do Checkout</CardTitle>
                <CardDescription>Ajuste a aparência e funcionalidades do checkout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Timer de Escassez</Label>
                          <p className="text-sm text-muted-foreground">Exibe um contador regressivo no checkout</p>
                        </div>
                        <Switch 
                          checked={checkoutSettings.timer_enabled}
                          onCheckedChange={(c) => setCheckoutSettings({...checkoutSettings, timer_enabled: c})}
                        />
                     </div>
                     
                     {checkoutSettings.timer_enabled && (
                       <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                         <Label>Duração (minutos)</Label>
                         <div className="flex items-center gap-4">
                            <Slider 
                              value={[checkoutSettings.timer_duration / 60]} 
                              max={60} 
                              step={1} 
                              onValueChange={(v) => setCheckoutSettings({...checkoutSettings, timer_duration: v[0] * 60})}
                              className="flex-1"
                            />
                            <span className="w-12 text-right font-mono">{checkoutSettings.timer_duration / 60}m</span>
                         </div>
                       </div>
                     )}
                  </div>

                  <div className="space-y-2">
                    <Label>Cor Principal</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        value={checkoutSettings.primary_color}
                        onChange={(e) => setCheckoutSettings({...checkoutSettings, primary_color: e.target.value})}
                        className="w-12 h-10 p-1"
                      />
                      <Input 
                        value={checkoutSettings.primary_color}
                        onChange={(e) => setCheckoutSettings({...checkoutSettings, primary_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Banner do Checkout (URL)</Label>
                  <Input 
                    value={checkoutSettings.banner_url}
                    onChange={(e) => setCheckoutSettings({...checkoutSettings, banner_url: e.target.value})}
                    placeholder="https://... (Imagem de topo)"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-sm">Animação de Escassez (Vagas)</h3>
                  <p className="text-xs text-muted-foreground">
                    Configure reduções automáticas de vagas para criar urgência visual.
                  </p>
                  
                  <div className="space-y-3">
                    {checkoutSettings.scarcity_events?.map((event, index) => (
                      <div key={index} className="flex items-end gap-3 p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Tempo (segundos)</Label>
                          <Input
                            type="number"
                            value={event.delay}
                            onChange={(e) => updateScarcityEvent(index, 'delay', parseInt(e.target.value))}
                            placeholder="Ex: 5"
                            className="h-8"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Qtd. a reduzir</Label>
                          <Input
                            type="number"
                            value={event.amount}
                            onChange={(e) => updateScarcityEvent(index, 'amount', parseInt(e.target.value))}
                            placeholder="Ex: 2"
                            className="h-8"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeScarcityEvent(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addScarcityEvent}
                      className="w-full"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Adicionar Evento de Redução
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Proof Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações e Prova Social</CardTitle>
                <CardDescription>Aumente a conversão mostrando depoimentos e notificações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">Habilitar Depoimentos</Label>
                      <p className="text-sm text-muted-foreground">Mostra avaliações de clientes no checkout</p>
                    </div>
                    <Switch 
                      checked={socialProofSettings.testimonials_enabled}
                      onCheckedChange={(c) => setSocialProofSettings({...socialProofSettings, testimonials_enabled: c})}
                    />
                 </div>

                 {socialProofSettings.testimonials_enabled && (
                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                       <h3 className="text-sm font-medium">Depoimentos Cadastrados</h3>
                       <Button size="sm" variant="outline" onClick={addTestimonial}>
                         <Plus className="w-4 h-4 mr-2" /> Adicionar
                       </Button>
                     </div>
                     
                     {socialProofSettings.testimonials.map((testimonial, index) => (
                       <div key={index} className="border p-4 rounded-lg space-y-3 bg-secondary/20">
                         <div className="flex justify-between">
                            <Label>Depoimento #{index + 1}</Label>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeTestimonial(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                         <Input 
                           placeholder="Nome do Cliente" 
                           value={testimonial.name}
                           onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                         />
                         <Textarea 
                           placeholder="O que ele disse..." 
                           value={testimonial.content}
                           onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                         />
                         <div className="flex items-center gap-2">
                            <Label className="text-xs">Estrelas:</Label>
                            <Input 
                              type="number" 
                              min="1" max="5" 
                              className="w-20"
                              value={testimonial.rating}
                              onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
                            />
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affiliates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Programa de Afiliados</CardTitle>
                <CardDescription>Configure como seu produto será ofertado no marketplace de afiliados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Habilitar Afiliação</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que outros usuários vendam seu produto.
                    </p>
                  </div>
                  <Switch
                    checked={isMarketplace}
                    onCheckedChange={setIsMarketplace}
                  />
                </div>

                {isMarketplace && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="commission">Comissão (%)</Label>
                        <div className="relative">
                          <Input
                            id="commission"
                            type="number"
                            min="0"
                            max="100"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                          />
                          <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Porcentagem sobre o valor da venda.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria no Marketplace</Label>
                        <Select value={marketplaceCategory} onValueChange={setMarketplaceCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business">Negócios e Carreira</SelectItem>
                            <SelectItem value="marketing">Marketing Digital</SelectItem>
                            <SelectItem value="health">Saúde e Bem-estar</SelectItem>
                            <SelectItem value="education">Educação</SelectItem>
                            <SelectItem value="finance">Finanças</SelectItem>
                            <SelectItem value="tech">Tecnologia</SelectItem>
                            <SelectItem value="lifestyle">Estilo de Vida</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Aprovação</Label>
                      <div className="flex gap-4">
                        <div className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${affiliateApprovalType === 'auto' ? 'bg-primary/5 border-primary' : 'hover:bg-secondary'}`} onClick={() => setAffiliateApprovalType('auto')}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${affiliateApprovalType === 'auto' ? 'border-primary' : 'border-muted-foreground'}`}>
                              {affiliateApprovalType === 'auto' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="font-medium">Automática</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Qualquer usuário pode se afiliar instantaneamente.</p>
                        </div>
                        <div className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${affiliateApprovalType === 'manual' ? 'bg-primary/5 border-primary' : 'hover:bg-secondary'}`} onClick={() => setAffiliateApprovalType('manual')}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${affiliateApprovalType === 'manual' ? 'border-primary' : 'border-muted-foreground'}`}>
                              {affiliateApprovalType === 'manual' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="font-medium">Manual</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Você precisa aprovar cada solicitação.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rules">Regras para Afiliados</Label>
                      <Textarea
                        id="rules"
                        placeholder="Descreva as regras para divulgar seu produto (ex: não fazer spam, não usar marca registrada em anúncios...)"
                        className="h-32"
                        value={affiliateRules}
                        onChange={(e) => setAffiliateRules(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced/Stock Tab */}
          <TabsContent value="advanced" className="space-y-6">
             <Card>
              <CardHeader>
                <CardTitle>Estoque e Limites</CardTitle>
                <CardDescription>Gerencie a disponibilidade do seu produto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">Limitar Vagas/Estoque</Label>
                      <p className="text-sm text-muted-foreground">Defina um limite máximo de vendas para este produto</p>
                    </div>
                    <Switch 
                      checked={stockEnabled}
                      onCheckedChange={setStockEnabled}
                    />
                 </div>

                 {stockEnabled && (
                   <>
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label>Quantidade Disponível</Label>
                      <Input 
                        type="number" 
                        value={stockLimit}
                        onChange={(e) => setStockLimit(e.target.value)}
                        placeholder="Ex: 100"
                      />
                      <p className="text-xs text-muted-foreground">O checkout será bloqueado automaticamente quando chegar a zero.</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                       <div className="flex justify-between items-center">
                         <div className="space-y-0.5">
                           <Label>Redução Automática (Visual)</Label>
                           <p className="text-xs text-muted-foreground">Simule vendas reduzindo o contador automaticamente.</p>
                         </div>
                         <Button size="sm" variant="outline" onClick={addScarcityEvent}>
                           <Plus className="w-4 h-4 mr-2" /> Adicionar Regra
                         </Button>
                       </div>
                       
                       {checkoutSettings.scarcity_events?.map((event, index) => (
                         <div key={index} className="flex items-end gap-3 p-3 bg-secondary/20 rounded-lg border">
                            <div className="flex-1 space-y-1">
                               <Label className="text-xs">Em (segundos)</Label>
                               <Input 
                                 type="number" 
                                 min="1"
                                 value={event.delay}
                                 onChange={(e) => updateScarcityEvent(index, 'delay', parseInt(e.target.value))}
                               />
                            </div>
                            <div className="flex-1 space-y-1">
                               <Label className="text-xs">Reduzir (qtd)</Label>
                               <Input 
                                 type="number" 
                                 min="1"
                                 value={event.amount}
                                 onChange={(e) => updateScarcityEvent(index, 'amount', parseInt(e.target.value))}
                               />
                            </div>
                            <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => removeScarcityEvent(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                       ))}
                    </div>
                   </>
                 )}
              </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProductEditor;
