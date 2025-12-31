import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Search,
  Users,
  Link as LinkIcon,
  DollarSign,
  TrendingUp
} from "lucide-react";

const Affiliates = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Afiliados</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus parceiros e comissões</p>
          </div>
          <Button variant="accent">
            <Users className="w-4 h-4 mr-2" />
            Convidar Afiliado
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Total de Afiliados</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">0</h3>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Comissões Pagas</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">Kz 0,00</h3>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Cliques em Links</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">0</h3>
          </div>
        </div>

        {/* Affiliate List Placeholder */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden p-12 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Comece seu Programa de Afiliados</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Habilite outros usuários para venderem seus produtos e pague comissões automáticas.
                Configure as regras de comissão em seus produtos.
            </p>
            <Button variant="outline">
                Configurar Regras de Afiliação
            </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Affiliates;
