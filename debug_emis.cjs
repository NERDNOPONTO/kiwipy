
const https = require('https');

const config = {
  // Token encontrado nos snippets anteriores - assumindo ser o de teste/dev
  token: "0d86263f-7649-4d42-bb3c-1f0722ea675b", 
  endpoint: "https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken",
  callbackUrl: "https://culonga.com/culongaPay"
};

function makeRequest(name, payload, headers = {}) {
  const url = new URL(config.endpoint);
  const body = JSON.stringify(payload);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length,
      ...headers
    }
  };

  console.log(`\n--- Test: ${name} ---`);
  // console.log("Payload:", body);

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

const ref = "TEST-" + Date.now();

// 1. Current Implementation (Token in body)
makeRequest("1. Token in Body", {
  reference: ref,
  amount: "1000.00",
  token: config.token,
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});

// 2. Token in Header (Authorization)
makeRequest("2. Token in Header (Bearer)", {
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
}, {
  'Authorization': `Bearer ${config.token}`
});

// 3. merchantToken instead of token
makeRequest("3. merchantToken in Body", {
  reference: ref,
  amount: "1000.00",
  merchantToken: config.token,
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
});
