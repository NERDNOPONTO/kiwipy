
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configurações da EMIS / Culonga
const EMIS_API_URL = "https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken";
const EMIS_FRAME_URL = "https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/frame";
const MERCHANT_TOKEN = Deno.env.get("CULONGA_TOKEN") || "YOUR_MERCHANT_TOKEN"; // Token de comerciante

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
    
    // URL de callback registrada na EMIS (Must match exactly what is registered)
    const callbackUrl = "https://culonga.com/culongaPay";

    const { data: order, error: orderError } = await supabaseClient
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

    // 5. Criar Payload para EMIS (snake_case conforme descoberto nos testes)
    const emisPayload = {
      token: MERCHANT_TOKEN,
      reference: reference, // snake_case
      amount: product.price.toString(), // deve ser string
      callback_url: callbackUrl, // snake_case
      client_name: name,
      client_email: email,
      client_msisdn: phone,
      // Tentativa de habilitar métodos de pagamento comuns
      mobile: "PAYMENT" // Baseado nos testes que retornaram erro de negócio (100/104) em vez de erro de schema
    };

    console.log("Enviando payload para EMIS:", JSON.stringify(emisPayload));

    const emisResponse = await fetch(EMIS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emisPayload)
    });

    if (!emisResponse.ok) {
      const errorText = await emisResponse.text();
      console.error("Erro EMIS:", errorText);
      throw new Error(`Falha no Gateway de Pagamento: ${errorText}`);
    }

    const transactionIdRaw = await emisResponse.text();
    // O retorno pode ser um JSON ou string direta dependendo da versão, mas geralmente é o ID
    // Vamos limpar aspas extras se houver
    let transactionId = transactionIdRaw.replace(/['"]+/g, '').trim();
    
    // Tentar parsear se for JSON
    try {
        const json = JSON.parse(transactionIdRaw);
        if (json.transactionId) transactionId = json.transactionId;
        if (json.id) transactionId = json.id;
    } catch (e) {
        // não é json, segue como string
    }

    if (!transactionId) {
        throw new Error("ID da transação inválido recebido do gateway");
    }

    // 6. Construir URL do Iframe
    // Usar a URL fornecida pelo usuário como "real"
    const paymentUrl = `https://culonga.com/culongaPay?token=${transactionId}`;

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
