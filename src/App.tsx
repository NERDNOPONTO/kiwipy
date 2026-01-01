import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Affiliates from "./pages/Affiliates";
import Marketplace from "./pages/Marketplace";
import MyBackpack from "./pages/MyBackpack";
import Financial from "./pages/Financial";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductEditor from "./pages/ProductEditor";
import PaymentCallback from "./pages/PaymentCallback";
import MemberArea from "./pages/MemberArea";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducers from "./pages/admin/AdminProducers";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";

const queryClient = new QueryClient();

// Componente Wrapper para Analytics
const AnalyticsWrapper = () => {
  useAnalytics(); // Ativa o tracking automático de page views
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AnalyticsWrapper />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/checkout/:productId" element={<Checkout />} />
          <Route path="/culongaPay" element={<PaymentCallback />} />
          <Route path="/members" element={<MemberArea />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/producers" element={<AdminProducers />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/products" element={<Products />} />
            <Route path="/dashboard/products/new" element={<ProductEditor />} />
            <Route path="/dashboard/products/edit/:id" element={<ProductEditor />} />
            <Route path="/dashboard/sales" element={<Sales />} />
            <Route path="/dashboard/affiliates" element={<Affiliates />} />
            <Route path="/dashboard/marketplace" element={<Marketplace />} />
            <Route path="/dashboard/backpack" element={<MyBackpack />} />
            <Route path="/dashboard/financial" element={<Financial />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
