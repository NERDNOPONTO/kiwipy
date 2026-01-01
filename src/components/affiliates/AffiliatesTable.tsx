import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Filter, Download, ArrowUpDown, Eye, Ban, Edit, MessageCircle, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AffiliateDetailsSheet } from "./AffiliateDetailsSheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AffiliatesTableProps {
  affiliates: any[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export const AffiliatesTable = ({ affiliates, isLoading, onRefresh }: AffiliatesTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const itemsPerPage = 10;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  const handleViewDetails = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (affiliateId: string, newStatus: string) => {
    try {
        const { error } = await supabase
            .from('affiliates')
            .update({ status: newStatus })
            .eq('id', affiliateId);

        if (error) throw error;

        toast({
            title: "Status atualizado",
            description: `Afiliado ${newStatus === 'approved' ? 'ativado' : 'bloqueado'} com sucesso.`
        });

        if (onRefresh) onRefresh();
    } catch (error) {
        console.error("Error updating status:", error);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: "Não foi possível atualizar o status do afiliado."
        });
    }
  };

  // Mock data filtering
  const filteredAffiliates = affiliates.filter(affiliate => 
    affiliate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <AffiliateDetailsSheet 
        affiliate={selectedAffiliate} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar afiliado..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Afiliado</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Conversão</TableHead>
              <TableHead>Receita Gerada</TableHead>
              <TableHead>Comissões</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAffiliates.length > 0 ? (
              filteredAffiliates.map((affiliate, index) => {
                const isActive = affiliate.status === 'active' || affiliate.status === 'approved';
                return (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      #{index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={affiliate.avatar_url} />
                          <AvatarFallback>{affiliate.name?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{affiliate.name}</span>
                          <span className="text-xs text-muted-foreground">{affiliate.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        affiliate.tier === 'Diamond' ? 'border-cyan-500 text-cyan-600 bg-cyan-50' :
                        affiliate.tier === 'Gold' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                        affiliate.tier === 'Silver' ? 'border-slate-400 text-slate-600 bg-slate-50' :
                        'border-orange-700 text-orange-800 bg-orange-50'
                      }>
                        {affiliate.tier || 'Bronze'}
                      </Badge>
                    </TableCell>
                    <TableCell>{affiliate.sales_count || 0}</TableCell>
                    <TableCell>{affiliate.conversion_rate || '0.0'}%</TableCell>
                    <TableCell>{formatCurrency(affiliate.total_revenue || 0)}</TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {formatCurrency(affiliate.total_commissions || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${
                          isActive ? 'bg-emerald-500/15 text-emerald-600' : 
                          affiliate.status === 'pending' ? 'bg-amber-500/15 text-amber-600' : 
                          'bg-red-500/15 text-red-600'
                        }`}
                        variant="secondary"
                      >
                        {isActive ? 'Ativo' : 
                         affiliate.status === 'pending' ? 'Pendente' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(affiliate)}>
                            <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageCircle className="w-4 h-4 mr-2" /> Enviar Mensagem
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" /> Editar Nível
                          </DropdownMenuItem>
                          {isActive ? (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleUpdateStatus(affiliate.id, 'blocked')}
                            >
                              <Ban className="w-4 h-4 mr-2" /> Bloquear
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-emerald-600"
                              onClick={() => handleUpdateStatus(affiliate.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" /> Ativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Nenhum afiliado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
