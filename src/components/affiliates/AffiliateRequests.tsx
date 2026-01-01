import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Eye, ExternalLink, Instagram, Youtube, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AffiliateRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile) {
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('producer_id', profile.id);
        
        const productIds = products?.map(p => p.id) || [];

        if (productIds.length > 0) {
          const { data, error } = await supabase
            .from('affiliates')
            .select(`
              *,
              profiles:user_id (full_name, avatar_url),
              products:product_id (name)
            `)
            .in('product_id', productIds)
            .eq('status', 'pending');
          
          if (error) throw error;
          setRequests(data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: status === 'approved' ? "Afiliado aprovado!" : "Solicitação recusada",
        description: status === 'approved' ? "O afiliado já pode começar a vender." : "O usuário foi notificado."
      });

      fetchRequests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível processar a solicitação."
      });
    }
  };

  if (isLoading) return <div>Carregando solicitações...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Solicitações Pendentes</h2>
          <p className="text-muted-foreground">Analise e aprove novos afiliados para seu programa</p>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidato</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação pendente.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={req.profiles?.avatar_url} />
                        <AvatarFallback>{req.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{req.profiles?.full_name}</span>
                        <span className="text-xs text-muted-foreground">email@oculto.com</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{req.products?.name}</span>
                  </TableCell>
                  <TableCell>{new Date(req.created_at).toLocaleDateString('pt-AO')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleAction(req.id, 'approved')}
                      >
                        <Check className="w-4 h-4 mr-1" /> Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleAction(req.id, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-1" /> Recusar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
