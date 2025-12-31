
const https = require('https');

const config = {
  token: "0d86263f-7649-4d42-bb3c-1f0722ea675b", 
  endpoint: "https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken",
  callbackUrl: "https://culonga.com/culongaPay"
};

function makeRequest(name, payload) {
  const url = new URL(config.endpoint);
  const body = JSON.stringify(payload);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length
    }
  };

  const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log(`\n[${name}] Status: ${res.statusCode}`);
      console.log(`[${name}] Response: ${data}`);
    });
  });

  req.on('error', e => console.error(e));
  req.write(body);
  req.end();
}

const ref = "REF" + Math.floor(Math.random() * 10000);

const base = {
  token: config.token,
  reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  // Adicionando dados do cliente que podem ser obrigatorios para MCX
  client_name: "Test User",
  client_email: "test@example.com",
  client_msisdn: "900000000" // Formato padrao angolano
};

// 1. Tentar apenas adicionar os dados do cliente (talvez habilite auto?)
makeRequest("1. Dados Cliente", base);

// 2. mcx: true
makeRequest("2. mcx: true", {
  ...base,
  mcx: true
});

// 3. multicaixa: true
makeRequest("3. multicaixa: true", {
  ...base,
  multicaixa: true
});

// 4. payment_method: "MCX" (singular)
makeRequest("4. payment_method: MCX", {
  ...base,
  payment_method: "MCX"
});

// 5. mobile: true (ja tentei PAYMENT antes, mas vai que...)
makeRequest("5. mobile: true", {
  ...base,
  mobile: true
});
