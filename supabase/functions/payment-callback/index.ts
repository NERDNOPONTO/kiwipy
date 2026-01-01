
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // LOG CRÍTICO DE ENTRADA
  console.log(`[Payment Callback] Recebido request: ${req.method} ${req.url}`);
  try {
    const headers = Object.fromEntries(req.headers.entries());
    console.log(`[Payment Callback] Headers:`, JSON.stringify(headers));
  } catch (e) {
    console.log(`[Payment Callback] Erro ao logar headers:`, e);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Configuração da URL do Frontend para redirecionamento
    // Deve ser configurada nos Segredos do Supabase: FRONTEND_URL = https://seu-projeto.vercel.app
    const frontendUrl = Deno.env.get('FRONTEND_URL') || "https://culonga.com";

    if (!supabaseUrl || !supabaseKey) {
        console.error("[Payment Callback] ERRO CRÍTICO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas.");
    }

    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? '', // Use service role for admin tasks
    )

    // Parse payload (try JSON, fallback to Form Data, fallback to Query Params)
    let payload: any = {};
    const contentType = req.headers.get('content-type') || '';
    
    if (req.method === 'GET') {
        const url = new URL(req.url);
        payload = Object.fromEntries(url.searchParams.entries());
    } else if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      try {
          const formData = await req.formData();
          payload = Object.fromEntries(formData);
      } catch (e) {
          console.log("Error parsing form data, trying text/json manual parse");
          const text = await req.text();
          try { payload = JSON.parse(text); } catch (e2) {}
      }
    }

    console.log("Payment Callback Payload:", payload);

    const { referencia, reference, status, transactionId, token } = payload;
    
    // Tratamento de referência aninhada (payload EMIS v2)
    // Exemplo: "reference": { "id": "ORD-290772734" }
    let orderRef = referencia || reference;
    if (typeof orderRef === 'object' && orderRef !== null && orderRef.id) {
        orderRef = orderRef.id;
    }

    // EMIS às vezes manda 'token' como ID da transação no redirect
    
    // Se não tiver referência, mas tiver token, talvez seja o callback do browser apenas com token
    // Nesse caso, não conseguimos identificar o pedido facilmente sem consultar a EMIS.
    // Mas se o callback for configurado corretamente na criação, a referência deve vir.

    if (!orderRef) {
       // Se for apenas um redirect sem dados úteis, pode ser o teste manual ou erro.
       // Vamos verificar se temos transactionId/token e tentar buscar na tabela de orders pelo payment_reference se existir
       console.log("Sem referência direta. Payload:", payload);

       if (token) {
           console.log("Tentando recuperar pedido via token/transactionId...");
           // TODO: Se salvarmos o token inicial no pedido, poderíamos buscar por ele.
           // Como não salvamos o token de transação inicial no 'create-checkout-session' (apenas retornamos),
           // fica difícil vincular sem a referência.
           
           // Fallback: Redirecionar para o frontend com o token para que o frontend tente resolver ou mostrar sucesso.
           // O frontend já tem lógica para lidar com ?token=...
           return Response.redirect(`${frontendUrl}/culongaPay?token=${token}&status=unknown`, 303);
       }

       console.log("Sem referência e sem token, redirecionando para erro");
       return Response.redirect(`${frontendUrl}/culongaPay?error=missing_reference`, 303);
    }

    // 1. Validar autenticidade (TODO: Implementar validação de assinatura/token se disponível)
    // const signature = req.headers.get('x-signature');
    // if (!verifySignature(payload, signature)) throw new Error("Assinatura inválida");

    // 2. Localizar pedido
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('reference', orderRef)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderRef);
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // NORMALIZAÇÃO DE STATUS
    // Status pode vir em minúsculo, maiúsculo, ou códigos numéricos.
    let newStatus: 'approved' | 'rejected' | null = null;
    const normalizedStatus = status ? String(status).toUpperCase() : '';

    console.log(`[Payment Callback] Status recebido: "${status}" (Normalizado: "${normalizedStatus}")`);

    if (['SUCCESS', 'COMPLETED', 'APPROVED', 'PAID', 'OK', '00', 'AUTHORIZED', 'ACCEPTED'].includes(normalizedStatus)) {
        newStatus = 'approved';
    } else if (['REJECTED', 'FAILED', 'ERROR', 'CANCELLED', 'RJCT', 'DECLINED'].includes(normalizedStatus)) {
        newStatus = 'rejected';
    } else {
        console.log(`[Payment Callback] Status inconclusivo ou desconhecido: "${status}". O pedido será mantido no estado atual para evitar falsos negativos.`);
    }
    
    // Só atualizar se tivermos um novo status definido e ele for diferente do atual (ou se for approved e ainda não estiver approved)
    if (newStatus && order.status !== 'approved') {
      const currentPaymentData = (order.payment_data as any) || {};
      const updateData: any = {
        status: newStatus,
        payment_data: { ...currentPaymentData, ...payload }, // Merge para preservar metadados (ex: subscription)
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'approved') {
        updateData.access_granted_at = new Date().toISOString();
        updateData.payment_reference = transactionId;

        // --- LÓGICA DE ATIVAÇÃO DE ASSINATURA ---
        if (currentPaymentData.subscription) {
          const { planId, days, userId } = currentPaymentData.subscription;
          console.log(`[Payment Callback] Ativando assinatura para usuário ${userId}, plano ${planId}, ${days} dias.`);

          if (userId && planId && days) {
             const endDate = new Date();
             endDate.setDate(endDate.getDate() + Number(days));
             
             // Inserir ou atualizar assinatura
             // Nota: Se o usuário já tiver uma assinatura, talvez devêssemos estender?
             // Por simplificação, vamos criar uma nova 'active' que sobrepõe.
             // Ou melhor, insert.
             
             const { error: subError } = await supabaseClient
               .from('saas_subscriptions')
               .insert({
                 user_id: userId,
                 plan_id: planId,
                 status: 'active',
                 current_period_start: new Date().toISOString(),
                 current_period_end: endDate.toISOString()
               });

             if (subError) {
               console.error("[Payment Callback] Erro ao ativar assinatura:", subError);
             } else {
               console.log("[Payment Callback] Assinatura ativada com sucesso!");
             }
          }
        }
        // ----------------------------------------
      }

      const { error: updateError } = await supabaseClient
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (updateError) throw updateError;

      // 4. Liberar acesso (se aprovado)
      if (newStatus === 'approved') {
        // PROCESSAMENTO DE COMISSÃO DE AFILIADO
        if (order.affiliate_id) {
          try {
            console.log(`Processando comissão para afiliado: ${order.affiliate_id}`);
            
            // Buscar dados da afiliação e do produto para saber a taxa
            const { data: affiliateData } = await supabaseClient
              .from('affiliates')
              .select(`
                id, 
                user_id,
                custom_commission_rate, 
                products:product_id (commission_rate)
              `)
              .eq('id', order.affiliate_id)
              .single();

            if (affiliateData) {
              // Determinar taxa: customizada > produto > 0
              // Nota: Typescript pode reclamar de products ser array ou objeto, mas no single() é objeto.
              // Ajuste conforme o retorno real do supabase-js
              const productRate = (affiliateData.products as any)?.commission_rate || 0;
              const rate = affiliateData.custom_commission_rate ?? productRate;
              
              if (rate > 0) {
                const commissionAmount = (order.amount * rate) / 100;
                
                // 1. Registrar Payout (Comissão)
                const { error: payoutError } = await supabaseClient
                  .from('payouts')
                  .insert({
                    affiliate_id: order.affiliate_id,
                    amount: commissionAmount,
                    status: 'pending', // Disponível para saque (ou fluxo de aprovação automática)
                    method: 'system_split'
                  });
                
                if (payoutError) console.error("Erro ao criar payout:", payoutError);
                else {
                  console.log(`Comissão de ${commissionAmount} registrada para afiliado ${order.affiliate_id}`);
                  
                  // 2. Atualizar estatísticas do afiliado (Incremento manual para evitar RPC complexo agora)
                  const { data: currentStats } = await supabaseClient
                    .from('affiliates')
                    .select('sales_count, total_commission_earned')
                    .eq('id', order.affiliate_id)
                    .single();
                  
                  if (currentStats) {
                    await supabaseClient
                      .from('affiliates')
                      .update({
                        sales_count: (currentStats.sales_count || 0) + 1,
                        total_commission_earned: (currentStats.total_commission_earned || 0) + commissionAmount,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', order.affiliate_id);
                  }

                  // 3. Atualizar pedido com o valor da comissão
                  await supabaseClient
                    .from('orders')
                    .update({ commission_amount: commissionAmount })
                    .eq('id', order.id);
                }
              }
            }
          } catch (commError) {
            console.error("Erro ao processar comissão:", commError);
            // Não falhar o callback inteiro por erro de comissão, apenas logar
          }
        }

        // Verificar se já existe acesso
        const { data: existingAccess } = await supabaseClient
          .from('product_access')
          .select('id')
          .eq('order_id', order.id) // Assuming order_id or composite key exists
          .maybeSingle();

        // Nota: A tabela product_access no esquema original não tem order_id explícito no snippet, 
        // mas vamos assumir que queremos dar acesso ao produto para o customer.
        // Vamos verificar se o customer já tem acesso a este produto.
        
        const { data: existingProductAccess } = await supabaseClient
          .from('product_access')
          .select('id')
          .eq('customer_id', order.customer_id)
          .eq('product_id', order.product_id)
          .maybeSingle();

        if (!existingProductAccess) {
           await supabaseClient
            .from('product_access')
            .insert({
              customer_id: order.customer_id,
              product_id: order.product_id,
              order_id: order.id
            });
        }
      }
    }

    // 4. Resposta final dependendo do método
    if (req.method === 'GET') {
        // Se for o navegador do usuário, redireciona para o frontend
        return Response.redirect(`${frontendUrl}/culongaPay?status=${status || 'processed'}&reference=${orderRef}`, 303);
    } else {
        // Se for notificação servidor-servidor (POST), retorna JSON 200
        return new Response(JSON.stringify({ message: "Callback processed successfully", order_id: order.id }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

  } catch (error) {
    console.error("Callback Error:", error);
    
    if (req.method === 'GET') {
        // Em caso de erro no navegador, redirecionar para mostrar erro no frontend
        return Response.redirect(`${frontendUrl}/culongaPay?status=error&message=${encodeURIComponent(error.message)}`, 303);
    } else {
        // Em caso de erro no webhook, retornar erro JSON
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
  }
})
