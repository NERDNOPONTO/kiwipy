
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
  callback_url: config.callbackUrl
};

// Teste 1: Confirmar que mobile: "PAYMENT" tira o erro 107
makeRequest("1. mobile: PAYMENT", {
  ...base,
  mobile: "PAYMENT"
});

// Teste 2: mobile: "ENABLED"
makeRequest("2. mobile: ENABLED", {
  ...base,
  mobile: "ENABLED"
});

// Teste 3: mobile: {} (objeto vazio)
makeRequest("3. mobile: {}", {
  ...base,
  mobile: {}
});

// Teste 4: reference numerica (para tentar resolver o erro 100)
makeRequest("4. ref numerica + mobile: PAYMENT", {
  token: config.token,
  reference: "1234567890",
  amount: "1000.00",
  mobile: "PAYMENT"
});
