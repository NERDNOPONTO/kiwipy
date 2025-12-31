import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-accent">
              <Zap className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              InfoPay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Preços
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Testemunhos
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button variant="accent" asChild>
              <Link to="/auth?mode=signup">Começar Grátis</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <div className="flex flex-col gap-4">
              <a 
                href="#features" 
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Funcionalidades
              </a>
              <a 
                href="#pricing" 
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Preços
              </a>
              <a 
                href="#testimonials" 
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Testemunhos
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Button variant="outline" asChild>
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button variant="accent" asChild>
                  <Link to="/auth?mode=signup">Começar Grátis</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
