const https = require('https');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Request method:', event.httpMethod);
    console.log('Request body:', event.body);
    console.log('Query params:', event.queryStringParameters);
    
    let cardData;
    
    // Handle different request methods
    if (event.httpMethod === 'GET') {
      cardData = event.queryStringParameters?.cardData;
    } else if (event.httpMethod === 'POST') {
      try {
        const body = event.body ? JSON.parse(event.body) : {};
        cardData = body.cardData || body.data;
      } catch (parseError) {
        cardData = event.body; // Fallback for plain text
      }
    } else {
      // Handle other methods by trying to parse body
      try {
        const body = event.body ? JSON.parse(event.body) : {};
        cardData = body.cardData || body.data;
      } catch (parseError) {
        cardData = event.queryStringParameters?.cardData || event.body;
      }
    }
    
    console.log('Parsed cardData:', cardData?.substring(0, 10) + '...');
    
    if (!cardData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Card data required' }),
      };
    }

    // Parse card data (format: number|month|year|cvv)
    const parts = cardData.split('|').map(part => part.trim());
    const [number, month, year, cvc] = parts;

    if (!number || !month || !year || !cvc) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          status: 'DEAD',
          message: 'Invalid card format',
          code: 0
        }),
      };
    }

    // Validate Shopify credentials
    const shopifyDomain = process.env.SHOPIFY_DOMAIN;
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!shopifyDomain || !shopifyToken || shopifyToken === 'test_token_123') {
      console.error('Shopify credentials not configured or using test values');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ERROR',
          message: 'Shopify credentials not configured',
          code: 2,
          card: { card: cardData, type: 'unknown' }
        }),
      };
    }

    // Check if it's a test card first
    const testCards = {
      '4242424242424242': 'LIVE',
      '4000000000000002': 'DEAD',
      '4000000000009995': 'DEAD',
      '4000000000000069': 'DEAD',
      '4111111111111111': 'LIVE',
      '5555555555554444': 'LIVE',
      '378282246310005': 'LIVE'
    };
    
    const cleanNumber = number.replace(/\s/g, '');
    if (testCards[cleanNumber]) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: testCards[cleanNumber],
          message: testCards[cleanNumber] === 'LIVE' ? 'Test card - Card approved' : 'Test card - Card declined',
          code: testCards[cleanNumber] === 'LIVE' ? 1 : 0,
          card: {
            card: cardData,
            type: getCardType(cleanNumber),
            last4: cleanNumber.slice(-4),
            country: 'US',
            funding: 'credit'
          }
        }),
      };
    }

    // Shopify $1 Authorization
    try {
      const authResult = await performShopifyAuth(shopifyDomain, shopifyToken, {
        number: cleanNumber,
        month: parseInt(month),
        year: parseInt(year.length === 2 ? '20' + year : year),
        cvc: cvc
      });

      let status = 'DEAD';
      let message = '$1 authorization failed';
      let code = 0;

      if (authResult.success) {
        status = 'LIVE';
        message = 'Card approved';
        code = 1;
      } else {
        message = authResult.error || 'Card declined';
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status,
          message,
          code,
          card: {
            card: cardData,
            type: getCardType(cleanNumber),
            last4: cleanNumber.slice(-4),
            country: authResult.country || 'Unknown',
            funding: authResult.funding || 'credit'
          }
        }),
      };

    } catch (shopifyError) {
      // Handle specific Shopify errors
      let status = 'DEAD';
      let message = 'Card declined';
      let code = 0;

      if (shopifyError.message.includes('declined')) {
        message = 'Card declined by issuer';
      } else if (shopifyError.message.includes('expired')) {
        message = 'Card expired';
      } else if (shopifyError.message.includes('invalid')) {
        message = 'Invalid card details';
      } else {
        message = shopifyError.message || 'Card declined';
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status,
          message,
          code,
          card: {
            card: cardData,
            type: getCardType(cleanNumber)
          }
        }),
      };
    }

  } catch (error) {
    console.error('Shopify validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'ERROR',
        message: 'Internal server error',
        code: 2
      }),
    };
  }
};

// Shopify $1 Authorization Function with improved error handling
async function performShopifyAuth(domain, token, cardData) {
  return new Promise((resolve, reject) => {
    // Create a $1 authorization to test the card
    const postData = JSON.stringify({
      payment: {
        amount: '1.00',
        currency: 'USD',
        credit_card: {
          number: cardData.number,
          month: cardData.month,
          year: cardData.year,
          verification_value: cardData.cvc
        },
        kind: 'authorization'
      }
    });

    const options = {
      hostname: domain,
      port: 443,
      path: '/admin/api/2023-10/payments.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Shopify-Access-Token': token,
        'User-Agent': 'chilli.cc-validator/1.0'
      },
      timeout: 15000 // 15 second timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`Shopify response status: ${res.statusCode}`);
          
          if (res.statusCode === 201 && response.payment) {
            // Authorization successful - immediately void it
            voidShopifyPayment(domain, token, response.payment.id)
              .catch(err => console.warn('Failed to void payment:', err));
              
            resolve({
              success: true,
              payment_id: response.payment.id,
              country: response.payment.credit_card?.country,
              funding: response.payment.credit_card?.funding
            });
          } else if (res.statusCode === 422 && response.errors) {
            // Validation errors (card declined, etc.)
            const errorMsg = typeof response.errors === 'object' ? 
              Object.values(response.errors).flat().join(', ') : 
              response.errors.toString();
            resolve({
              success: false,
              error: errorMsg
            });
          } else {
            // Other errors
            resolve({
              success: false,
              error: response.error || response.message || 'Authorization failed'
            });
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          reject(new Error('Invalid response from Shopify'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Helper function to void the authorization immediately
async function voidShopifyPayment(domain, token, paymentId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      payment: {
        kind: 'void'
      }
    });

    const options = {
      hostname: domain,
      port: 443,
      path: `/admin/api/2023-10/payments/${paymentId}.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Shopify-Access-Token': token
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Helper function to determine card type
function getCardType(number) {
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6(?:011|5)/.test(number)) return 'discover';
  if (/^3[0-5]/.test(number)) return 'diners';
  if (/^35/.test(number)) return 'jcb';
  return 'unknown';
}