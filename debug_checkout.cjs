
// const fetch = require('node-fetch');
// Node 18+ has native fetch, but if this is older node, we might need axios or http
// Let's use https module for compatibility if fetch fails
const https = require('https');

const SUPABASE_URL = "https://bmbmkvrypycdttnbeeiq.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYm1rdnJ5cHljZHR0bmJlZWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzk5NzksImV4cCI6MjA4Mjc1NTk3OX0.aOm_86p6_uXsvvOKuOSLfuxNnQhALmWhx_dSIyFDJJE";

async function testCheckout() {
  const url = new URL(`${SUPABASE_URL}/functions/v1/create-checkout-session`);
  
  const payload = JSON.stringify({
    productId: "prod_123", 
    name: "Test User",
    email: "test@example.com",
    phone: "999999999"
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Length': payload.length
    }
  };

  console.log("Calling:", url.toString());

  const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log("Status:", res.statusCode);
      console.log("Body:", data);
    });
  });

  req.on('error', (e) => {
    console.error("Request failed:", e);
  });

  req.write(payload);
  req.end();
}

testCheckout();
