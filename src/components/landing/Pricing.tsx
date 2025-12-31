import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    description: "Perfeito para começar",
    price: "0",
    period: "Grátis para sempre",
    features: [
      "Até 3 produtos",
      "100 vendas/mês",
      "Checkout básico",
      "Relatórios simples",
      "Suporte por email"
    ],
    cta: "Começar Grátis",
    variant: "outline" as const,
    popular: false
  },
  {
    name: "Pro",
    description: "Para produtores sérios",
    price: "9.900",
    period: "Kz/mês",
    features: [
      "Produtos ilimitados",
      "Vendas ilimitadas",
      "Checkout personalizado",
      "Analytics avançado",
      "Área de membros",
      "Webhooks",
      "Suporte prioritário"
    ],
    cta: "Começar Pro",
    variant: "hero" as const,
    popular: true
  },
  {
    name: "Enterprise",
    description: "Para grandes operações",
    price: "Personalizado",
    period: "Contato",
    features: [
      "Tudo do Pro",
      "API personalizada",
      "White-label",
      "SLA garantido",
      "Gerente de conta",
      "Integrações custom"
    ],
    cta: "Falar com Vendas",
    variant: "default" as const,
    popular: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6">
            Preços
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Planos que crescem{" "}
            <span className="text-gradient">com você</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Escolha o plano ideal para o seu negócio. Comece grátis e faça upgrade quando precisar.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-card rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
                plan.popular 
                  ? "border-accent shadow-glow scale-105 z-10" 
                  : "border-border/50 shadow-card hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-accent text-accent-foreground text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant={plan.variant} className="w-full" size="lg" asChild>
                <Link to="/auth?mode=signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
