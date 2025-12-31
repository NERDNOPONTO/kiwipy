import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ArrowLeft,
  Loader2,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const CreateProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState("curso");
  const [recurrence, setRecurrence] = useState("monthly"); // For subscriptions
  const [imageUrl, setImageUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
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
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!userProfile) throw new Error("Perfil não encontrado");
      if (!name || !price) throw new Error("Preencha os campos obrigatórios");

      const { error } = await supabase
        .from('products')
        .insert({
          producer_id: userProfile.id,
          name,
          description,
          price: parseInt(price),
          product_type: productType as any,
          // If subscription, use recurrence_period
          recurrence_period: productType === 'assinatura' ? recurrence : null,
          image_url: imageUrl,
          content_url: contentUrl,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Produto criado!",
        description: "Seu produto foi criado com sucesso.",
      });

      navigate("/dashboard/products");
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar produto",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" asChild>
            <Link to="/dashboard/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-display font-bold">Novo Produto</h1>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Curso Completo de Marketing Digital" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva seu produto em detalhes..." 
                    className="h-32"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (AOA)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Kz</span>
                      <Input 
                        id="price" 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-10"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Produto</Label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curso">Curso Online</SelectItem>
                        <SelectItem value="ebook">E-book</SelectItem>
                        <SelectItem value="mentoria">Mentoria</SelectItem>
                        <SelectItem value="assinatura">Assinatura (Recorrente)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {productType === 'assinatura' && (
                  <div className="space-y-2">
                    <Label htmlFor="recurrence">Período de Cobrança</Label>
                    <Select value={recurrence} onValueChange={setRecurrence}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="semiannual">Semestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                        <SelectItem value="lifetime">Vitalício</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="image">URL da Imagem de Capa</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="image" 
                      placeholder="https://..." 
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Recomendado: 1280x720px (16:9)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">URL do Conteúdo (Opcional)</Label>
                  <Input 
                    id="content" 
                    placeholder="Link para o arquivo ou área de membros" 
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-4">
                  <Button type="button" variant="ghost" asChild>
                    <Link to="/dashboard/products">Cancelar</Link>
                  </Button>
                  <Button type="submit" variant="accent" disabled={isLoading} className="min-w-[120px]">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Produto"
                    )}
                  </Button>
                </div>
              </form>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateProduct;
