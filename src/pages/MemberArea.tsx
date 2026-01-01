import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Package, ExternalLink, Download, FileText, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PurchasedProduct {
  id: string;
  order_id: string;
  product: {
    id: string;
    name: string;
    description: string;
    image_url: string;
    content_url: string;
    product_type: 'curso' | 'ebook' | 'servico' | 'download';
  };
  created_at: string;
}

const MemberArea = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PurchasedProduct[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth?role=member");
        return;
      }

      setUserEmail(user.email || "");

      // Check if it's the first access (no last_sign_in_at prior to this session? Hard to track without custom metadata)
      // Or checking a flag. For now, we rely on user initiative or specific flow.
      // But user asked for "Update Password option" upon login.
      
      loadPurchasedProducts(user.id);
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/auth?role=member");
    }
  };

  const loadPurchasedProducts = async (userId: string) => {
    try {
        // We need to find customers associated with this user email
        // Since auth user id might be different from customer id if they bought before signing up
        // We link via email.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return;

        // 1. Find Customer ID by email
        const { data: customers } = await supabase
            .from('customers')
            .select('id')
            .eq('email_normalized', user.email.toLowerCase());

        if (!customers || customers.length === 0) {
            setLoading(false);
            return;
        }

        const customerIds = customers.map(c => c.id);

        // 2. Find Product Access
        const { data: access } = await supabase
            .from('product_access')
            .select(`
                id,
                order_id,
                created_at,
                product:product_id (
                    id,
                    name,
                    description,
                    image_url,
                    content_url,
                    product_type
                )
            `)
            .in('customer_id', customerIds);

        // @ts-ignore
        setProducts(access || []);
    } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Erro ao carregar seus produtos.");
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth?role=member");
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        toast.success("Senha atualizada com sucesso!");
        setIsPasswordResetOpen(false);
        setNewPassword("");
    } catch (error: any) {
        toast.error("Erro ao atualizar senha: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              M
            </div>
            <span className="font-semibold text-lg">Área do Membro</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
                {userEmail}
            </span>
            
            <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar Senha
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Atualizar Senha</DialogTitle>
                        <DialogDescription>
                            Defina uma nova senha para sua conta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <Button onClick={handleUpdatePassword} className="w-full">
                            Salvar Nova Senha
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Produtos</h1>
        
        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border shadow-sm">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Você ainda não possui produtos. Realize uma compra para vê-los aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
              <Card key={item.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                {item.product.image_url && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-secondary/10">
                        <img 
                            src={item.product.image_url} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2 capitalize">
                            {item.product.product_type}
                        </span>
                        <CardTitle className="line-clamp-2">{item.product.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {item.product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-xs text-muted-foreground">
                        Adquirido em {new Date(item.created_at).toLocaleDateString()}
                    </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full" asChild>
                    <a href={item.product.content_url} target="_blank" rel="noopener noreferrer">
                      {item.product.product_type === 'download' || item.product.product_type === 'ebook' ? (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            Baixar Arquivo
                        </>
                      ) : (
                        <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Acessar Conteúdo
                        </>
                      )}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberArea;
