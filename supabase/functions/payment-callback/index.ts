
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for admin tasks
    )

    // Parse payload (try JSON, fallback to Form Data if needed)
    let payload;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      const formData = await req.formData();
      payload = Object.fromEntries(formData);
    }

    console.log("Payment Callback Payload:", payload);

    const { referencia, reference, status, transactionId } = payload;
    const orderRef = referencia || reference;

    if (!orderRef) {
      throw new Error("Referência do pedido não fornecida");
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

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("Callback Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
