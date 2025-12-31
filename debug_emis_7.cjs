
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

const ref = "REF-" + Date.now();

// 1. token, Reference, Amount (number)
makeRequest("1. Amount number", {
  token: config.token,
  Reference: ref,
  Amount: 1000.00,
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// 2. token, Reference, amount (number)
makeRequest("2. amount number", {
  token: config.token,
  Reference: ref,
  amount: 1000.00,
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// 3. All PascalCase except token
makeRequest("3. All Pascal except token", {
  token: config.token,
  Reference: ref,
  Amount: "1000.00",
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT",
  ClientName: "Test",
  ClientEmail: "test@email.com",
  ClientMsisdn: "999999999"
});

// 4. Try snake_case
makeRequest("4. snake_case", {
  token: config.token,
  reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
  mobile: "PAYMENT"
});
