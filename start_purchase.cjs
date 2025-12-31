const https = require('https');

// URL da sua Edge Function (Substitua pela URL real do seu projeto Supabase)
const FUNCTION_URL = "https://bmbmkvrypycdttnbeeiq.supabase.co/functions/v1/create-checkout-session";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYm1rdnJ5cHljZHR0bmJlZWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzk5NzksImV4cCI6MjA4Mjc1NTk3OX0.aOm_86p6_uXsvvOKuOSLfuxNnQhALmWhx_dSIyFDJJE"; // Anon Key do .env

// Payload para criar uma compra
const payload = {
  name: "Teste Callback",
  email: "teste@callback.com",
  phone: "999999999",
  productId: "9718423f-e25c-43f9-ae79-37330761e0e8" // ID de um produto existente (usei um aleatório, o script deve falhar se não existir, mas vamos tentar)
};

// Precisamos pegar um ID de produto válido primeiro, ou usar um fixo se soubermos.
// Vou usar um ID fictício e torcer para o backend validar ou se o usuário puder fornecer um.
// Melhor: Vou buscar o primeiro produto da lista via API do Supabase (simulada) ou pedir para o usuário testar no front.
// Mas o usuário pediu para eu "executar a compra".
// Vou tentar com o ID do produto que vi nos logs anteriores se houver, ou criar um produto dummy.
// No log anterior: productId não estava visível, mas o product.price era 10.00.

// Vou assumir que o usuário vai testar no front ou eu preciso de um productId válido.
// Vou usar a API REST do Supabase para buscar um produto.

const SUPABASE_URL = "https://bmbmkvrypycdttnbeeiq.supabase.co";

async function getProduct() {
    return new Promise((resolve, reject) => {
        const req = https.request(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
            headers: {
                'apikey': AUTH_TOKEN,
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const products = JSON.parse(data);
                    if (products && products.length > 0) resolve(products[0].id);
                    else reject("Nenhum produto encontrado");
                } catch (e) { reject(e); }
            });
        });
        req.end();
    });
}

async function startCheckout(productId) {
    const checkoutPayload = { ...payload, productId };
    console.log("Iniciando checkout para produto:", productId);

    const req = https.request(FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log("Status:", res.statusCode);
            console.log("Response:", data);
            try {
                const json = JSON.parse(data);
                if (json.paymentUrl) {
                    console.log("\n>>> URL DE PAGAMENTO GERADA: <<<");
                    console.log(json.paymentUrl);
                    console.log(">>> Use esta URL para pagar e testar o callback <<<");
                    
                    // Iniciar monitoramento
                    monitorOrder(json.reference);
                }
            } catch (e) { console.error("Erro ao ler resposta"); }
        });
    });
    req.write(JSON.stringify(checkoutPayload));
    req.end();
}

function monitorOrder(reference) {
    console.log(`\nMonitorando pedido ${reference}... (Ctrl+C para parar)`);
    setInterval(() => {
        const req = https.request(`${SUPABASE_URL}/rest/v1/orders?reference=eq.${reference}&select=status`, {
            headers: {
                'apikey': AUTH_TOKEN,
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const orders = JSON.parse(data);
                    if (orders && orders.length > 0) {
                        console.log(`[${new Date().toLocaleTimeString()}] Status: ${orders[0].status}`);
                        if (orders[0].status === 'approved' || orders[0].status === 'paid') {
                            console.log("\n>>> PAGAMENTO CONFIRMADO! O CALLBACK FUNCIONOU! <<<");
                            process.exit(0);
                        }
                    }
                } catch (e) {}
            });
        });
        req.end();
    }, 5000);
}

getProduct().then(startCheckout).catch(console.error);
