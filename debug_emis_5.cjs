
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

// 1. Mixed: token, Reference, amount
makeRequest("1. Mixed", {
  token: config.token,
  Reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});

// 2. PascalCase everything
makeRequest("2. PascalCase", {
  Token: config.token,
  Reference: ref,
  Amount: "1000.00",
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// 3. Weird Mix: token, Reference, Amount
makeRequest("3. Weird Mix", {
  token: config.token,
  Reference: ref,
  Amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});
