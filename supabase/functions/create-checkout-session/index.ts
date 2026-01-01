
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
    // Usar a service role key para operações administrativas (bypassar RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { name, email, phone, productId, offerId, affiliateRef, planId, days, userId } = await req.json()

    // 1. Validar dados de entrada
    if ((!productId && !planId) || !email) {
      throw new Error("Dados incompletos: productId (ou planId) e email são obrigatórios");
    }

    if (MERCHANT_TOKEN === "YOUR_MERCHANT_TOKEN" || !MERCHANT_TOKEN) {
      throw new Error("Erro de Configuração: CULONGA_TOKEN não configurado no Supabase.");
    }

    // 2. Buscar detalhes do produto e preço
    let product = null;
    let price = 0;

    if (planId) {
      // Lógica para Assinaturas (SaaS Plans)
      if (!days || days < 1) throw new Error("Número de dias inválido");

      // Buscar o plano
      const { data: plan, error: planError } = await supabaseAdmin
        .from('saas_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) throw new Error("Plano não encontrado");

      // Calcular preço total
      price = plan.price * days;

      // Buscar Produto do Sistema "Assinatura Diária" para vincular o pedido
      const { data: systemProduct, error: sysProdError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('name', 'Assinatura Diária')
        .limit(1)
        .maybeSingle();

      if (!systemProduct) {
         console.log("Produto de sistema não encontrado. Criando automaticamente...");
         
         // Buscar um "dono" para o produto
         // Prioridade: Variável de Ambiente > Admin "Seguro" > Qualquer Admin
         const systemProducerId = Deno.env.get('SYSTEM_PRODUCER_ID');
         let ownerId = systemProducerId;
         
         if (!ownerId) {
             console.warn("ALERTA: SYSTEM_PRODUCER_ID não configurado. Tentando recuperar um Admin para evitar perda de fundos...");
             
             // Fallback Seguro: Tentar encontrar um usuário com perfil de 'admin' ou o primeiro usuário do sistema
             // Idealmente, você teria uma flag 'is_admin' na tabela profiles, mas vamos usar uma lógica de salvaguarda
             const { data: adminUser } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .limit(1)
                .order('created_at', { ascending: true }) // O primeiro usuário criado geralmente é o admin/dono
                .maybeSingle();
                
             if (adminUser) {
                 ownerId = adminUser.id;
                 console.log(`Fallback ativado: Usando usuário ${ownerId} (mais antigo) como Admin temporário para esta transação.`);
             } else {
                 // Último recurso: Se não tiver NENHUM usuário no banco (impossível em produção, mas...)
                 console.error("ERRO CRÍTICO: Nenhum usuário encontrado para receber os fundos.");
                 throw new Error("Sistema não inicializado: Impossível processar pagamento sem um destinatário válido (Admin).");
             }
         }
         
         // AVISO: Se caímos no fallback, o dinheiro vai para este 'ownerId'.
         // Como é uma Assinatura, o trigger do banco vai zerar o net_amount desse produtor de qualquer jeito
         // e mandar 100% para a plataforma (commission_platform).
         // Então, o dinheiro está seguro contabilmente, apenas o vínculo do produto ficará com esse usuário.

         const { data: newProduct, error: createError } = await supabaseAdmin
            .from('products')
            .insert({
                producer_id: ownerId,
                name: 'Assinatura Diária',
                description: 'Acesso à plataforma por dias contratados',
                price: 100, // Preço base placeholder
                product_type: 'servico',
                is_active: true,
                stock_enabled: false,
                image_url: 'https://placehold.co/600x400/png?text=Assinatura+Diaria'
            })
            .select()
            .single();
                 
         if (createError || !newProduct) {
             console.error("Erro ao criar produto de sistema:", createError);
             throw new Error("Falha ao criar produto de sistema automaticamente: " + createError?.message);
         }
         
         product = newProduct;
      } else {
         product = systemProduct;
      }
      
      console.log(`Checkout de Plano: ${plan.name} x ${days} dias = ${price} Kz`);

    } else if (offerId) {
      // Se houver offerId, buscamos a oferta específica
      const { data: offer, error: offerError } = await supabaseAdmin
        .from('offers')
        .select('*, products(*)')
        .eq('id', offerId)
        .single();
      
      if (offerError || !offer) throw new Error("Oferta não encontrada");
      
      // A oferta traz o produto junto
      product = offer.products;
      price = offer.price;

      // Verificação de segurança (opcional, mas bom)
      if (product.id !== productId) throw new Error("Inconsistência: Oferta não pertence ao produto.");

    } else {
      // Se não, busca o produto direto (preço padrão)
      const { data: prod, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError || !prod) throw new Error("Produto não encontrado");
      product = prod;
      price = prod.price;
    }

    if (!product) throw new Error("Produto não encontrado");

    // 3. Obter ou Criar Cliente
    const { data: customerId, error: customerError } = await supabaseAdmin
      .rpc('get_or_create_customer', {
        p_email: email,
        p_full_name: name,
        p_phone: phone
      })

    if (customerError) throw customerError
    
    // 3.5 Resolver Afiliado (se houver ref)
    let affiliateId = null;
    if (affiliateRef) {
      try {
        console.log(`Buscando afiliação para Ref: ${affiliateRef} e Produto: ${product.id}`);
        
        // Busca a afiliação ativa para este produto e usuário
        // Aceita 'approved' ou 'active' para flexibilidade
        const { data: affiliateData, error: affError } = await supabaseAdmin
          .from('affiliates')
          .select('id, status')
          .eq('product_id', product.id)
          .eq('user_id', affiliateRef)
          .in('status', ['approved', 'active'])
          .maybeSingle();
        
        if (affError) {
           console.log("Erro na busca de afiliação:", affError);
        }

        if (affiliateData) {
          affiliateId = affiliateData.id;
          console.log(`Afiliado identificado: ${affiliateRef} -> ${affiliateId} (Status: ${affiliateData.status})`);
        } else {
          console.log(`Nenhuma afiliação aprovada/ativa encontrada para ${affiliateRef}`);
        }
      } catch (e) {
        console.log("Erro ao resolver afiliado (ignorado):", e);
      }
    }

    // 4. Gerar Referência e Criar Pedido
    // A referência deve ser única e curta se possível, mas robusta
    const reference = `ORD-${Math.floor(Math.random() * 1000000000)}`;
    
    // URL de callback que processa o pagamento e redireciona o usuário
    const callbackUrl = "https://bmbmkvrypycdttnbeeiq.supabase.co/functions/v1/payment-callback";

    // 4. LÓGICA DE ATRIBUIÇÃO DE "PRODUCER_ID" DO PEDIDO
    // Aqui está a chave da separação:
    // - Se for Assinatura (SaaS): O produtor é o ADMIN (ownerId)
    // - Se for Venda Normal: O produtor é o dono do produto
    
    let orderProducerId = product.producer_id;
    const isSaasPayment = !!planId || product.name === 'Assinatura Diária';

    if (isSaasPayment) {
        // Garantia extra: Se for assinatura, o dinheiro VAI para o dono do sistema
        // independente de quem seja o usuário logado ou quem criou o produto
        
        // Tentar obter o ID do Admin novamente se necessário
        const systemProducerId = Deno.env.get('SYSTEM_PRODUCER_ID');
        if (systemProducerId) {
             orderProducerId = systemProducerId;
        } else {
             // Se não tiver ENV, mantemos o do produto (que deve ser o admin se a lógica de criação funcionou)
             // ou usamos o fallback do ownerId calculado acima (se foi criado agora)
             if (typeof ownerId !== 'undefined') {
                 orderProducerId = ownerId;
             }
        }
        
        console.log(`[Checkout] Modo SaaS: Atribuindo venda ao Admin/Sistema (${orderProducerId})`);
    }

    const { data: order, error: orderError } = await supabaseAdmin // USAR ADMIN AQUI
      .from('orders')
      .insert({
        reference,
        product_id: product.id,
        customer_id: customerId,
        producer_id: orderProducerId, // USANDO ID CORRIGIDO
        amount: price,
        status: 'pending',
        affiliate_id: isSaasPayment ? null : affiliateId, // Assinatura não tem afiliado
        payment_data: planId ? { subscription: { planId, days, userId }, is_saas_payment: true } : null
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 5. Criar Payload para EMIS
    const emisPayload = {
      reference: reference, 
      amount: Number(price).toFixed(2), 
      token: MERCHANT_TOKEN, // Frame Token (UUID)
      terminal: Deno.env.get('EMIS_TERMINAL_ID') || "486467", // Terminal ID via ENV
      
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
