// Simple API status checker
const https = require('https');

async function testAPI(endpoint, data) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, error: 'Invalid JSON', raw: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

async function checkAPIs() {
  console.log('🔍 Checking API Status...\n');
  
  const testCard = { cardData: '4242424242424242|12|2025|123' };
  
  // Test Stripe
  console.log('Testing Stripe API...');
  const stripeResult = await testAPI('/.netlify/functions/stripe-validate', testCard);
  if (stripeResult.error) {
    console.log('❌ Stripe API: Connection failed -', stripeResult.error);
  } else {
    console.log(`✅ Stripe API: HTTP ${stripeResult.status} -`, stripeResult.data?.status || 'Unknown');
  }
  
  // Test Shopify
  console.log('\nTesting Shopify API...');
  const shopifyResult = await testAPI('/.netlify/functions/shopify-validate', testCard);
  if (shopifyResult.error) {
    console.log('❌ Shopify API: Connection failed -', shopifyResult.error);
  } else {
    console.log(`✅ Shopify API: HTTP ${shopifyResult.status} -`, shopifyResult.data?.status || 'Unknown');
  }
}

checkAPIs();