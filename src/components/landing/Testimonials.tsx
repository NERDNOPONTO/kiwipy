import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Santos",
    role: "Criadora de Cursos",
    avatar: "M",
    content: "Consegui vender meu primeiro curso online em menos de uma semana. A plataforma é incrivelmente fácil de usar e o suporte é excepcional.",
    rating: 5
  },
  {
    name: "João Paulo",
    role: "Consultor Digital",
    avatar: "J",
    content: "Finalmente uma plataforma que aceita pagamentos em Kwanzas sem complicações. As vendas aumentaram 200% desde que migrei.",
    rating: 5
  },
  {
    name: "Ana Ferreira",
    role: "Autora de Ebooks",
    avatar: "A",
    content: "A área de membros é perfeita para entregar meus ebooks. Meus clientes adoram a experiência de compra simples e rápida.",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-dark" />
      
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent font-medium text-sm mb-6">
            Testemunhos
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            O que dizem os nossos{" "}
            <span className="text-accent">produtores</span>
          </h2>
          <p className="text-lg text-primary-foreground/70">
            Milhares de produtores confiam na InfoPay para vender os seus infoprodutos.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-6 shadow-xl relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-accent/20" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
