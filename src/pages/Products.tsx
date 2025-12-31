import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Zap, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Search,
  Bell,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Copy
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: false },
  { icon: Package, label: "Produtos", href: "/dashboard/products", active: true },
  { icon: ShoppingCart, label: "Vendas", href: "/dashboard/sales", active: false },
  { icon: Users, label: "Clientes", href: "/dashboard/customers", active: false },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: false },
  { icon: Settings, label: "Configurações", href: "/dashboard/settings", active: false },
];

const mockProducts = [
  { 
    id: "prod_001", 
    name: "Curso de Marketing Digital Completo", 
    type: "Curso", 
    price: "25.000 Kz", 
    sales: 142,
    status: "Ativo",
    image: "📚"
  },
  { 
    id: "prod_002", 
    name: "Ebook: Vendas Online para Iniciantes", 
    type: "Ebook", 
    price: "5.000 Kz", 
    sales: 89,
    status: "Ativo",
    image: "📖"
  },
  { 
    id: "prod_003", 
    name: "Mentoria Individual 1:1", 
    type: "Serviço", 
    price: "150.000 Kz", 
    sales: 12,
    status: "Ativo",
    image: "🎯"
  },
  { 
    id: "prod_004", 
    name: "Template de Planilhas Financeiras", 
    type: "Download", 
    price: "3.500 Kz", 
    sales: 67,
    status: "Pausado",
    image: "📊"
  },
];

const Products = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyCheckoutLink = (productId: string) => {
    const link = `https://infopay.ao/checkout/${productId}`;
    navigator.clipboard.writeText(link);
    // TODO: Add toast notification
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
                P
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">Produtor Demo</div>
                  <div className="text-sm text-muted-foreground truncate">demo@infopay.ao</div>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <Button variant="ghost" className="w-full mt-4 justify-start text-muted-foreground" asChild>
                <Link to="/">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Link>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Pesquisar produtos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-accent w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </button>
              <Button variant="accent" asChild>
                <Link to="/dashboard/products/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Products Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Meus Produtos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os seus infoprodutos
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Product Image/Icon */}
                <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-5xl">
                  {product.image}
                </div>
                
                {/* Product Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        product.status === 'Ativo' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {product.status}
                      </span>
                      <h3 className="font-display font-bold text-foreground mt-2 line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">{product.type}</span>
                    <span className="font-display font-bold text-accent">{product.price}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">
                      {product.sales} vendas
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => copyCheckoutLink(product.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Copiar link de checkout"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <Link 
                        to={`/checkout/${product.id}`}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Ver checkout"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <button 
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Product Card */}
            <Link 
              to="/dashboard/products/new"
              className="bg-card rounded-2xl border-2 border-dashed border-border hover:border-accent/50 shadow-card overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] group"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-accent" />
              </div>
              <span className="font-display font-bold text-foreground">Adicionar Produto</span>
              <span className="text-sm text-muted-foreground mt-1">Criar novo infoproduto</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Products;
