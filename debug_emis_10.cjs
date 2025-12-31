
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

// Foco em snake_case (que deu erro 100 - Business Error)
// Tentando descobrir o nome da referencia

makeRequest("1. client_reference", {
  token: config.token,
  client_reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  mobile: "PAYMENT"
});

makeRequest("2. transaction_reference", {
  token: config.token,
  transaction_reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  mobile: "PAYMENT"
});

makeRequest("3. order_reference", {
  token: config.token,
  order_reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  mobile: "PAYMENT"
});

makeRequest("4. expiration_date (snake)", { // Teste aleatorio pra ver se ele le
  token: config.token,
  reference: ref,
  amount: "1000.00",
  expiration_date: "2025-12-31"
});

// Foco em PascalCase (que deu erro BODY - Schema Error)
// Tentando descobrir o nome do Amount

makeRequest("5. Pascal: TotalAmount", {
  token: config.token,
  Reference: ref,
  TotalAmount: "1000.00",
  CallbackUrl: config.callbackUrl
});

makeRequest("6. Pascal: Value", {
  token: config.token,
  Reference: ref,
  Value: "1000.00",
  CallbackUrl: config.callbackUrl
});
