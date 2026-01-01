
import { 
  Users, 
  Eye, 
  MousePointerClick, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingCart, 
  CreditCard,
  Activity,
  Globe,
  Smartphone,
  Search,
  Share2
} from "lucide-react";

// Mock Data for Analytics Dashboard

export const overviewStats = [
  {
    title: "Visitantes Únicos",
    value: "45.2k",
    change: "+12.5%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Pageviews Totais",
    value: "128.4k",
    change: "+8.2%",
    trend: "up",
    icon: Eye,
  },
  {
    title: "Taxa de Rejeição",
    value: "42.3%",
    change: "-2.1%",
    trend: "down", // Good for bounce rate
    icon: ArrowDownRight,
  },
  {
    title: "Tempo Médio",
    value: "3m 45s",
    change: "+15s",
    trend: "up",
    icon: Clock,
  },
  {
    title: "Taxa de Conversão",
    value: "3.8%",
    change: "+0.5%",
    trend: "up",
    icon: MousePointerClick,
  },
  {
    title: "Novos vs Retornantes",
    value: "65% / 35%",
    change: "Estável",
    trend: "neutral",
    icon: Users,
  }
];

export const trafficData = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
  visitors: Math.floor(Math.random() * 2000) + 1000,
  pageviews: Math.floor(Math.random() * 5000) + 2000,
  sessions: Math.floor(Math.random() * 2500) + 1200,
}));

export const trafficSources = [
  { name: "Orgânico (SEO)", value: 45, color: "#10b981", sessions: "15.2k", conversion: "4.2%" },
  { name: "Pago (Ads)", value: 25, color: "#3b82f6", sessions: "8.4k", conversion: "3.1%" },
  { name: "Direto", value: 15, color: "#f59e0b", sessions: "5.1k", conversion: "2.8%" },
  { name: "Social", value: 10, color: "#8b5cf6", sessions: "3.4k", conversion: "1.5%" },
  { name: "Referência", value: 5, color: "#ec4899", sessions: "1.7k", conversion: "5.4%" },
];

export const topPages = [
  { path: "/curso-marketing-digital", views: "12.5k", time: "4m 20s", bounce: "35%" },
  { path: "/checkout/curso-marketing", views: "4.2k", time: "2m 10s", bounce: "15%" },
  { path: "/", views: "25.1k", time: "1m 30s", bounce: "45%" },
  { path: "/blog/como-vender-mais", views: "8.3k", time: "5m 12s", bounce: "60%" },
  { path: "/ebook-gratuito", views: "6.7k", time: "3m 05s", bounce: "28%" },
];

export const conversionFunnel = [
  { name: "Homepage/Landing", value: 10000, fill: "#3b82f6" },
  { name: "Página de Produto", value: 6500, fill: "#60a5fa" },
  { name: "Carrinho/Checkout", value: 2800, fill: "#93c5fd" },
  { name: "Pagamento Iniciado", value: 1500, fill: "#bfdbfe" },
  { name: "Compra Concluída", value: 420, fill: "#10b981" }, // Conversion
];

export const demographics = {
  countries: [
    { country: "Angola", percentage: 85, users: "38.4k" },
    { country: "Portugal", percentage: 8, users: "3.6k" },
    { country: "Brasil", percentage: 5, users: "2.2k" },
    { country: "Moçambique", percentage: 2, users: "0.9k" },
  ],
  cities: [
    { city: "Luanda", percentage: 65 },
    { city: "Benguela", percentage: 12 },
    { city: "Huambo", percentage: 8 },
    { city: "Lubango", percentage: 5 },
  ],
  devices: [
    { name: "Mobile", value: 68, color: "#3b82f6" },
    { name: "Desktop", value: 28, color: "#10b981" },
    { name: "Tablet", value: 4, color: "#f59e0b" },
  ]
};

export const realtimeEvents = [
  { time: "Agora", event: "Compra confirmada: Curso Python", location: "Luanda, AO", value: "25.000 Kz" },
  { time: "Há 2 min", event: "Checkout iniciado", location: "Benguela, AO", value: "-" },
  { time: "Há 5 min", event: "Novo cadastro", location: "Lisboa, PT", value: "-" },
  { time: "Há 8 min", event: "Download Ebook", location: "Luanda, AO", value: "Grátis" },
  { time: "Há 12 min", event: "Visualização de Produto", location: "Huambo, AO", value: "-" },
];

export const campaigns = [
  { name: "Lançamento Verão", channel: "Facebook Ads", clicks: "5.2k", ctr: "1.8%", cost: "150.000 Kz", revenue: "850.000 Kz", roas: "5.6x" },
  { name: "Google Search Brand", channel: "Google Ads", clicks: "2.1k", ctr: "4.5%", cost: "80.000 Kz", revenue: "420.000 Kz", roas: "5.2x" },
  { name: "Email Newsletter", channel: "Email", clicks: "1.5k", ctr: "12%", cost: "5.000 Kz", revenue: "250.000 Kz", roas: "50x" },
  { name: "Influencer Marketing", channel: "Instagram", clicks: "3.8k", ctr: "2.5%", cost: "200.000 Kz", revenue: "600.000 Kz", roas: "3.0x" },
];

export const productPerformance = [
  { name: "Curso Marketing Digital", views: "12.5k", cart: "15%", checkout: "8%", conversion: "3.2%", revenue: "12.5M Kz" },
  { name: "Mentoria VIP", views: "2.1k", cart: "5%", checkout: "2%", conversion: "0.8%", revenue: "8.4M Kz" },
  { name: "Ebook Copywriting", views: "5.6k", cart: "25%", checkout: "15%", conversion: "8.5%", revenue: "1.2M Kz" },
];

export const speedMetrics = [
  { metric: "LCP (Largest Contentful Paint)", value: "1.2s", status: "good" },
  { metric: "FID (First Input Delay)", value: "15ms", status: "good" },
  { metric: "CLS (Cumulative Layout Shift)", value: "0.05", status: "good" },
  { metric: "Tempo Carregamento", value: "2.4s", status: "average" },
];
