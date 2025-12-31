
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

// Tentando "multicaixa_express" e "mcx" com valores "ENABLED" ou "PAYMENT"
// pois 'mobile' deu erro 104, talvez seja o metodo errado para este merchant

const base = {
  token: config.token,
  reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl,
};

// 1. multicaixa_express: "ENABLED"
makeRequest("1. multicaixa_express: ENABLED", {
  ...base,
  multicaixa_express: "ENABLED"
});

// 2. mcx: "ENABLED"
makeRequest("2. mcx: ENABLED", {
  ...base,
  mcx: "ENABLED"
});

// 3. multicaixa_express: "PAYMENT"
makeRequest("3. multicaixa_express: PAYMENT", {
  ...base,
  multicaixa_express: "PAYMENT"
});

// 4. mcx: "PAYMENT"
makeRequest("4. mcx: PAYMENT", {
  ...base,
  mcx: "PAYMENT"
});
