import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft,
  Loader2,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: false },
  { icon: Package, label: "Produtos", href: "/dashboard/products", active: true },
  { icon: ShoppingCart, label: "Vendas", href: "/dashboard/sales", active: false },
  { icon: Users, label: "Clientes", href: "/dashboard/customers", active: false },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: false },
  { icon: Settings, label: "Configurações", href: "/dashboard/settings", active: false },
];

const CreateProduct = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState("curso");
  const [imageUrl, setImageUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUserEmail(session.user.email || "");

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-card border-r border-border/50 transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border/50">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-accent flex-shrink-0">
                <Zap className="w-5 h-5 text-accent-foreground" />
              </div>
              {isSidebarOpen && (
                <span className="font-display text-xl font-bold text-foreground">InfoPay</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  item.active 
                    ? 'bg-accent text-accent-foreground shadow-accent' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                {userProfile?.full_name?.charAt(0) || userEmail?.charAt(0) || "P"}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{userProfile?.full_name || "Usuário"}</div>
                  <div className="text-sm text-muted-foreground truncate">{userEmail}</div>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 justify-start text-muted-foreground" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border/50 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
              </button>
              <h1 className="text-xl font-display font-bold">Novo Produto</h1>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/dashboard/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Produtos
            </Link>
          </Button>

          <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-lg font-semibold">Informações do Produto</h2>
              <p className="text-muted-foreground">Preencha os detalhes do seu infoproduto.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Curso Completo de React" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  placeholder="Descreva o que o aluno irá aprender..." 
                  className="min-h-[120px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (Kz)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
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
                      <SelectItem value="servico">Serviço</SelectItem>
                      <SelectItem value="download">Arquivo para Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">URL da Imagem de Capa</Label>
                <Input 
                  id="image" 
                  placeholder="https://..." 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Recomendado: 1280x720px</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">URL do Conteúdo</Label>
                <Input 
                  id="content" 
                  placeholder="Link para o drive, vídeo ou área de membros" 
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">O cliente receberá este link após o pagamento.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="accent" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Criar Produto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateProduct;
