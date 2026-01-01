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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Search, Filter, Download, ArrowUpDown, Eye, RotateCcw, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionsTableProps {
  orders: any[];
  isLoading: boolean;
}

export const TransactionsTable = ({ orders, isLoading }: TransactionsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  // Filter and Sort
  let filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchLower) ||
      order.customers?.full_name?.toLowerCase().includes(searchLower) ||
      order.customers?.email?.toLowerCase().includes(searchLower) ||
      order.products?.name?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (sortConfig) {
    filteredOrders.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested properties
      if (sortConfig.key === 'customer') aValue = a.customers?.full_name || '';
      if (sortConfig.key === 'product') aValue = a.products?.name || '';
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (isLoading) {
     return (
       <div className="space-y-4">
         <div className="flex justify-between">
           <Skeleton className="h-10 w-[250px]" />
           <Skeleton className="h-10 w-[100px]" />
         </div>
         <div className="rounded-md border bg-card p-4 space-y-4">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="flex items-center space-x-4">
               <Skeleton className="h-12 w-full" />
             </div>
           ))}
         </div>
       </div>
     );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por ID, cliente, produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('approved')}>
                Aprovados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pendentes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>
                Recusados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
           <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Linhas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 linhas</SelectItem>
              <SelectItem value="25">25 linhas</SelectItem>
              <SelectItem value="50">50 linhas</SelectItem>
              <SelectItem value="100">100 linhas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('id')}>
                ID {sortConfig?.key === 'id' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                Data
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('customer')}>
                Cliente
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('product')}>
                Produto
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                Valor
              </TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                Status
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[80px]">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{order.customers?.full_name || "Desconhecido"}</span>
                      <span className="text-xs text-muted-foreground">{order.customers?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs">📦</div>
                       <span className="text-sm truncate max-w-[150px]" title={order.products?.name}>
                         {order.products?.name}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {order.payment_data?.paymentMethod || "Cartão"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${
                        order.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25' : 
                        order.status === 'pending' ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25' : 
                        'bg-red-500/15 text-red-600 hover:bg-red-500/25'
                      }`}
                      variant="secondary"
                    >
                      {order.status === 'approved' ? 'Aprovada' : order.status === 'pending' ? 'Pendente' : 'Recusada'}
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
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" /> Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" /> Nota Fiscal
                        </DropdownMenuItem>
                        {order.status === 'approved' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <RotateCcw className="w-4 h-4 mr-2" /> Reembolsar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages || 1}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
};
