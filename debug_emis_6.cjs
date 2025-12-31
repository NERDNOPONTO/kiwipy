
const https = require('https');

const config = {
  token: "0d86263f-7649-4d42-bb3c-1f0722ea675b", 
  endpoint: "https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken",
  callbackUrl: "https://culonga.com/culongaPay"
};

function makeRequest(name, payload, query = "") {
  const url = new URL(config.endpoint + query);
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

// 1. token in Query
makeRequest("1. Query token", {
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
}, `?token=${config.token}`);

// 2. merchantToken in Query
makeRequest("2. Query merchantToken", {
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
}, `?merchantToken=${config.token}`);

// 3. Authorization Header (Retrying)
// Maybe it needs 'Basic' or just the token?
function makeRequestHeader(name, payload, authHeader) {
  const url = new URL(config.endpoint);
  const body = JSON.stringify(payload);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length,
      'Authorization': authHeader
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
  req.write(body);
  req.end();
}

makeRequestHeader("3. Auth Header Bearer", {
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
}, `Bearer ${config.token}`);

makeRequestHeader("4. Auth Header Raw", {
  reference: ref,
  amount: "1000.00",
  callbackUrl: config.callbackUrl,
  mobile: "PAYMENT"
}, config.token);
