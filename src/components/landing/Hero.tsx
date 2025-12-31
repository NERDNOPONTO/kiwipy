import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Play, TrendingUp, Users, CreditCard } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-accent/5 to-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Plataforma #1 de Infoprodutos em Angola
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Venda os seus{" "}
              <span className="text-gradient">Infoprodutos</span>{" "}
              com Facilidade
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
              Crie, gerencie e venda cursos, ebooks e serviços digitais com uma plataforma 
              completa e integração nativa com pagamentos em Kwanzas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Criar Conta Grátis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="group">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Ver Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center sm:text-left">
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground">5K+</div>
                <div className="text-sm text-muted-foreground">Produtores</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Vendas/mês</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground">100M</div>
                <div className="text-sm text-muted-foreground">Kz processados</div>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative animate-fade-in lg:animate-slide-in-right">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
                <div className="bg-gradient-dark p-4 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <span className="text-primary-foreground/60 text-sm font-medium">Dashboard InfoPay</span>
                </div>
                <div className="p-6 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <TrendingUp className="w-5 h-5 text-success mb-2" />
                      <div className="font-display text-xl font-bold">2.4M Kz</div>
                      <div className="text-xs text-muted-foreground">Receita Total</div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <Users className="w-5 h-5 text-accent mb-2" />
                      <div className="font-display text-xl font-bold">1,284</div>
                      <div className="text-xs text-muted-foreground">Clientes</div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <CreditCard className="w-5 h-5 text-primary mb-2" />
                      <div className="font-display text-xl font-bold">348</div>
                      <div className="text-xs text-muted-foreground">Vendas</div>
                    </div>
                  </div>
                  
                  {/* Chart Placeholder */}
                  <div className="bg-secondary/30 rounded-xl p-4 h-32">
                    <div className="flex items-end justify-between h-full gap-2">
                      {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-accent to-accent/50 rounded-t-md transition-all duration-500"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-lg border border-border/50 p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Hoje</div>
                    <div className="font-display font-bold text-success">+32.5%</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-lg border border-border/50 p-4 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Nova venda</div>
                    <div className="font-display font-bold">15,000 Kz</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
