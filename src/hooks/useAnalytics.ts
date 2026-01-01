import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const useAnalytics = () => {
  const location = useLocation();

  // Gerenciamento de Sessão Simples
  const getSessionId = () => {
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  };

  // Rastrear Page View automaticamente
  useEffect(() => {
    const trackPageView = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionId = getSessionId();

      // Tenta extrair product_id da URL se existir (ex: /checkout/:id)
      const pathParts = location.pathname.split('/');
      let productId = null;
      // Lógica simples para detectar ID na URL (assumindo UUID v4)
      const potentialId = pathParts.find(part => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)
      );
      if (potentialId) productId = potentialId;

      await supabase.from('page_views').insert({
        session_id: sessionId,
        user_id: session?.user?.id,
        url: window.location.href,
        path: location.pathname,
        product_id: productId, // Pode ser null
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });
    };

    trackPageView();
  }, [location]);

  // Função para rastrear eventos customizados (Checkout)
  const trackEvent = async (step: 'view_product' | 'begin_checkout' | 'purchase', productId: string, metadata = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const sessionId = getSessionId();

    await supabase.from('checkout_events').insert({
      session_id: sessionId,
      user_id: session?.user?.id,
      product_id: productId,
      step,
      metadata
    });
  };

  return { trackEvent };
};
