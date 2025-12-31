
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
  callback_url: config.callbackUrl,
  client_name: "Test User",
  client_email: "test@example.com",
  client_msisdn: "900000000"
};

// 1. Amount sem decimais (string)
makeRequest("1. Amount int string", {
  ...base,
  amount: "1000",
  mobile: "PAYMENT"
});

// 2. Amount com virgula (string)
makeRequest("2. Amount comma string", {
  ...base,
  amount: "1000,00",
  mobile: "PAYMENT"
});

// 3. Amount numerico
makeRequest("3. Amount number", {
  ...base,
  amount: 1000,
  mobile: "PAYMENT"
});

// 4. Testar outro metodo: 'card' (talvez mobile não esteja ativo para este token)
makeRequest("4. Method: card", {
  ...base,
  amount: "1000.00",
  card: "PAYMENT" // Tentativa
});

// 5. Testar outro metodo: 'card' boolean
makeRequest("5. Method: card boolean", {
  ...base,
  amount: "1000.00",
  card: true 
});
