import { 
  ShoppingCart, 
  BarChart3, 
  Palette, 
  Shield, 
  Zap, 
  Users,
  CreditCard,
  Globe
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Gestão de Produtos",
    description: "Crie e gerencie cursos, ebooks e serviços digitais com facilidade. Upload de conteúdo e configuração de preços em segundos.",
    color: "text-accent",
    bg: "bg-accent/10"
  },
  {
    icon: BarChart3,
    title: "Analytics em Tempo Real",
    description: "Acompanhe vendas, receitas e métricas importantes em tempo real. Tome decisões baseadas em dados precisos.",
    color: "text-success",
    bg: "bg-success/10"
  },
  {
    icon: Palette,
    title: "Checkout Personalizado",
    description: "Customize completamente a sua página de checkout. Cores, logo e campos personalizados para sua marca.",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    icon: CreditCard,
    title: "Pagamentos em Kwanzas",
    description: "Integração nativa com CulongaPay. Aceite pagamentos em AOA com segurança e facilidade.",
    color: "text-warning",
    bg: "bg-warning/10"
  },
  {
    icon: Users,
    title: "Área de Membros",
    description: "Entregue conteúdo exclusivo aos seus clientes. Sistema de login por Buyer ID automático.",
    color: "text-accent",
    bg: "bg-accent/10"
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Transações seguras com criptografia de ponta. Proteção completa para você e seus clientes.",
    color: "text-success",
    bg: "bg-success/10"
  },
  {
    icon: Zap,
    title: "Entrega Automática",
    description: "Após a confirmação do pagamento, o acesso é liberado automaticamente. Zero trabalho manual.",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    icon: Globe,
    title: "Links Compartilháveis",
    description: "Gere links únicos para cada produto. Compartilhe em redes sociais e aumente suas vendas.",
    color: "text-warning",
    bg: "bg-warning/10"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-secondary/30" />
      
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6">
            Funcionalidades
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Tudo o que precisa para{" "}
            <span className="text-gradient">vender mais</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Uma plataforma completa com todas as ferramentas necessárias para criar, 
            vender e entregar os seus infoprodutos com sucesso.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
