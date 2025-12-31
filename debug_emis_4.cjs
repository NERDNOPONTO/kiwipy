
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

// 1. token + Reference (PascalCase)
makeRequest("1. token + Reference", {
  token: config.token,
  Reference: ref,
  Amount: "1000.00",
  CallbackUrl: config.callbackUrl,
  Mobile: "PAYMENT"
});

// 2. token + transactionId
makeRequest("2. token + transactionId", {
  token: config.token,
  transactionId: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});

// 3. token + expiration (maybe reference isn't required if expiration is set? no...)
// Let's try to mimic the user's error "invalid frame token"
// The user got "invalid frame token" (code 104).
// My Test 3 gave "reference is required" (code 100).
// Why the difference?
// Maybe the user's token is BAD?
// If I use a bad token with the correct key `token`:
makeRequest("3. Bad Token", {
  token: "BAD_TOKEN",
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});
