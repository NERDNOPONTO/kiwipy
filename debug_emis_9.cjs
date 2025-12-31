
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

// Hipótese: 'token' é minusculo, 'Reference' é Pascal. O problema é o Amount.

// 1. token, Reference, amount (minusculo)
makeRequest("1. Hibrido: token, Reference, amount", {
  token: config.token,
  Reference: ref,
  amount: "1000.00",
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// 2. token, Reference, Amount (Pascal, string) - Já falhou antes, mas vamos confirmar
makeRequest("2. token, Reference, Amount(str)", {
  token: config.token,
  Reference: ref,
  Amount: "1000.00",
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// 3. token, Reference, Amount (Pascal, number)
makeRequest("3. token, Reference, Amount(num)", {
  token: config.token,
  Reference: ref,
  Amount: 1000.00,
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// 4. token, Reference, value (tentativa de outro nome)
makeRequest("4. token, Reference, value", {
  token: config.token,
  Reference: ref,
  value: "1000.00",
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});
