
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

// O erro anterior foi "reference is required" (code 100) usando snake_case
// Vamos testar variações de nomes para referência

const ref = "REF-" + Date.now();

// 1. Tentar "reference" novamente (talvez o valor precise de algo especifico?)
makeRequest("1. snake_case standard", {
  token: config.token,
  reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  mobile: "PAYMENT"
});

// 2. Tentar "client_reference"
makeRequest("2. client_reference", {
  token: config.token,
  client_reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  mobile: "PAYMENT"
});

// 3. Tentar "transaction_reference"
makeRequest("3. transaction_reference", {
  token: config.token,
  transaction_reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  mobile: "PAYMENT"
});

// 4. Tentar "Reference" (Pascal) misturado com snake_case (improvavel, mas vai que...)
makeRequest("4. Pascal Reference", {
  token: config.token,
  Reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  mobile: "PAYMENT"
});
