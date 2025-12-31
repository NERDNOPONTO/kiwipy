
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

  console.log(`\n--- Test: ${name} ---`);
  const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}`);
    });
  });

  req.on('error', e => console.error(e));
  req.write(body);
  req.end();
}

const ref = "REF-" + Date.now();

// Test A: merchantToken + reference (Retest to be sure)
makeRequest("A. merchantToken + reference", {
  merchantToken: config.token,
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});

// Test B: merchantToken + Reference (Capitalized)
makeRequest("B. merchantToken + Reference", {
  merchantToken: config.token,
  Reference: ref,
  Amount: "1000.00",
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// Test C: merchant_token + reference
makeRequest("C. merchant_token + reference", {
  merchant_token: config.token,
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});

// Test D: merchantToken + transactionId (maybe ref is called transactionId?)
makeRequest("D. merchantToken + transactionId", {
  merchantToken: config.token,
  transactionId: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});
