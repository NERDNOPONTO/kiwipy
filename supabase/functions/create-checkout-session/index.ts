
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configurações da EMIS / Culonga
// URL de PRODUÇÃO (Confirmado via testes)
const EMIS_API_URL = "https://pagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken";
const EMIS_FRAME_URL = "https://pagamentonline.emis.co.ao/online-payment-gateway/webframe/frame";
const MERCHANT_TOKEN = Deno.env.get("CULONGA_TOKEN"); // Token de comerciante

// URL para onde a EMIS deve notificar/redirecionar
// Deve ser esta Edge Function para processarmos o pagamento e gerarmos logs
const FUNCTION_URL = "https://bmbmkvrypycdttnbeeiq.supabase.co/functions/v1/payment-callback";

// URL final para onde o usuário será enviado após o processamento
// Usa variável de ambiente para suportar Vercel/Localhost, fallback para culonga.com
const FRONTEND_SUCCESS_URL = Deno.env.get('FRONTEND_URL') 
  ? `${Deno.env.get('FRONTEND_URL')}/culongaPay`
  : "https://culonga.com/culongaPay";

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { name, email, phone, productId } = await req.json()

    // 1. Validar dados de entrada
    if (!productId || !email) {
      throw new Error("Dados incompletos: productId e email são obrigatórios");
    }

    if (MERCHANT_TOKEN === "YOUR_MERCHANT_TOKEN" || !MERCHANT_TOKEN) {
      throw new Error("Erro de Configuração: CULONGA_TOKEN não configurado no Supabase.");
    }

    // 2. Buscar detalhes do produto
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) throw new Error("Produto não encontrado")

    // 3. Obter ou Criar Cliente
    const { data: customerId, error: customerError } = await supabaseClient
      .rpc('get_or_create_customer', {
        p_email: email,
        p_full_name: name,
        p_phone: phone
      })

    if (customerError) throw customerError

    // 4. Gerar Referência e Criar Pedido
    // A referência deve ser única e curta se possível, mas robusta
    const reference = `ORD-${Math.floor(Math.random() * 1000000000)}`;
    
    // URL de callback que processa o pagamento e redireciona o usuário
    const callbackUrl = "https://bmbmkvrypycdttnbeeiq.supabase.co/functions/v1/payment-callback";

    // Usar a service role key para operações administrativas (bypassar RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // ... (Manter resto do código)

    const { data: order, error: orderError } = await supabaseAdmin // USAR ADMIN AQUI
      .from('orders')
      .insert({
        reference,
        product_id: product.id,
        customer_id: customerId,
        producer_id: product.producer_id,
        amount: product.price,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 5. Criar Payload para EMIS
    const emisPayload = {
      reference: reference, 
      amount: Number(product.price).toFixed(2), 
      token: MERCHANT_TOKEN, // Frame Token (UUID)
      terminal: "486467", // Terminal ID (Fornecido pelo usuário)
      
      mobile: "PAYMENT",
      qr_code: "PAYMENT", 
      card: "AUTHORIZATION",
      
      // Enviando ambos formatos para garantir compatibilidade
      callback_url: callbackUrl, 
      callbackUrl: callbackUrl,
      
      client_name: name,
      client_email: email,
      client_msisdn: phone
    };

    console.log("Enviando payload para EMIS:", JSON.stringify(emisPayload));

    // TESTE DE CONECTIVIDADE CALLBACK: Tentar chamar o callback manualmente para verificar se está acessível
    try {
        console.log("Teste de pré-validação do callback URL...");
        fetch(callbackUrl, { method: 'OPTIONS' }).catch(e => console.log("Erro no pré-check do callback (ignorar):", e));
    } catch (e) {}

    const emisResponse = await fetch(EMIS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emisPayload)
    });

    if (!emisResponse.ok) {
      const errorText = await emisResponse.text();
      console.error("Erro EMIS (Raw):", errorText);
      
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Erro na EMIS: ${errorText}`);
      }

      // Tratar erros específicos da EMIS
      if (errorJson.code === "104" && errorJson.message === "invalid frame token") {
         throw new Error("Erro de Autenticação EMIS (104): O 'CULONGA_TOKEN' (Merchant Token) parece inválido. Verifique se o token no Supabase Secrets está correto e corresponde ao ambiente (Certificação vs Produção).");
      }
      
      throw new Error(`Falha no Gateway de Pagamento: ${JSON.stringify(errorJson)}`);
    }

    const responseText = await emisResponse.text();
    let transactionId = responseText.replace(/['"]+/g, '').trim();

    // Tentar extrair o token se a resposta for JSON
    try {
        const json = JSON.parse(responseText);
        if (json && typeof json === 'object') {
             if (json.token) transactionId = json.token;
             else if (json.frameToken) transactionId = json.frameToken;
             else if (json.transactionId) transactionId = json.transactionId;
             else if (json.id) transactionId = json.id;
        } else if (typeof json === 'string') {
             transactionId = json;
        }
    } catch (e) {
        // não é json, segue como string limpa
    }

    if (!transactionId) {
        throw new Error("ID da transação inválido recebido do gateway");
    }

    // 6. Construir URL do Iframe CORRETA (Baseada na documentação/exemplo do usuário)
    // A URL deve ser a do Webframe da EMIS, não a do nosso site
    const paymentUrl = `${EMIS_FRAME_URL}?token=${transactionId}`;

    return new Response(
      JSON.stringify({ 
        paymentUrl, 
        reference,
        orderId: order.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error creating session:", error)
    // Retornar 200 com erro para o cliente poder ler a mensagem facilmente
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
