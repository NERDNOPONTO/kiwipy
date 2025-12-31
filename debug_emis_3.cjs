
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

// 1. camelCase keys
makeRequest("1. camelCase", {
  merchantToken: config.token,
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});

// 2. PascalCase keys
makeRequest("2. PascalCase", {
  MerchantToken: config.token,
  Reference: ref,
  Amount: "1000.00",
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// 3. 'token' key (Original)
makeRequest("3. token key", {
  token: config.token,
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});

// 4. merchantToken + transactionId
makeRequest("4. merchantToken + transactionId", {
  merchantToken: config.token,
  transactionId: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});
