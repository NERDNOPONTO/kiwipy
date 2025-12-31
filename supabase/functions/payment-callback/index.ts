
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
    // EMIS às vezes manda 'token' como ID da transação no redirect
    const orderRef = referencia || reference;
    
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
           return Response.redirect(`https://culonga.com/culongaPay?token=${token}&status=unknown`, 303);
       }

       console.log("Sem referência e sem token, redirecionando para erro");
       return Response.redirect("https://culonga.com/culongaPay?error=missing_reference", 303);
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

    // 3. Atualizar estado
    const newStatus = (status === 'SUCCESS' || status === 'COMPLETED') ? 'approved' : 'rejected';
    
    // Só atualizar se o status mudar e não estiver já aprovado (para evitar duplicidade)
    if (order.status !== 'approved') {
      const updateData: any = {
        status: newStatus,
        payment_data: payload,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'approved') {
        updateData.access_granted_at = new Date().toISOString();
        updateData.payment_reference = transactionId;
      }

      const { error: updateError } = await supabaseClient
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (updateError) throw updateError;

      // 4. Liberar acesso (se aprovado)
      if (newStatus === 'approved') {
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
              // order_id: order.id // Se a tabela tiver essa coluna
            });
        }
      }
    }

    // 4. Resposta final dependendo do método
    if (req.method === 'GET') {
        // Se for o navegador do usuário, redireciona para o frontend
        return Response.redirect(`https://culonga.com/culongaPay?status=${status || 'processed'}&reference=${orderRef}`, 303);
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
        return Response.redirect(`https://culonga.com/culongaPay?status=error&message=${encodeURIComponent(error.message)}`, 303);
    } else {
        // Em caso de erro no webhook, retornar erro JSON
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
  }
})
