
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

// Já sabemos que snake_case funciona e reference/amount estão ok.
// Agora precisamos habilitar o metodo de pagamento.

const base = {
  token: config.token,
  reference: ref,
  amount: "1000.00",
  callback_url: config.callbackUrl
};

// 1. multicaixa_express (booleano)
makeRequest("1. multicaixa_express: true", {
  ...base,
  multicaixa_express: true
});

// 2. mc_express (booleano)
makeRequest("2. mc_express: true", {
  ...base,
  mc_express: true
});

// 3. card (booleano)
makeRequest("3. card: true", {
  ...base,
  card: true
});

// 4. debit_card (booleano)
makeRequest("4. debit_card: true", {
  ...base,
  debit_card: true
});
