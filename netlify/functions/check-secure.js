exports.handler = async function(event, context) {
  console.log('Function called with method:', event.httpMethod);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const data = body.data;
    const token = body.token;
    
    console.log('Processing request:', { hasData: !!data, hasToken: !!token });

    if (!data && !token) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          code: 0,
          status: 'DEAD',
          message: 'No card data or token provided',
          card: { card: '', type: 'unknown' }
        }),
      };
    }

    // Test card database for validation
    const testCards = {
      '4242424242424242': { brand: 'visa', last4: '4242', status: 'LIVE' },
      '4000056655665556': { brand: 'mastercard', last4: '5556', status: 'LIVE' },
      '5555555555554444': { brand: 'mastercard', last4: '4444', status: 'LIVE' },
      '378282246310005': { brand: 'amex', last4: '0005', status: 'LIVE' },
      '6011111111111117': { brand: 'discover', last4: '1117', status: 'LIVE' },
      '5146161533726687': { brand: 'mastercard', last4: '6687', status: 'LIVE' },
      '4000000000000002': { brand: 'visa', last4: '0002', status: 'DEAD' },
      '4000000000009995': { brand: 'visa', last4: '9995', status: 'DEAD' }
    };

    // Handle token-based validation (secure method)
    if (token) {
      console.log('Using token-based validation');
      
      // Mock token validation for testing
      const mockTokens = {
        'tok_visa': { brand: 'visa', last4: '4242', status: 'LIVE' },
        'tok_mastercard': { brand: 'mastercard', last4: '5556', status: 'LIVE' },
        'tok_amex': { brand: 'amex', last4: '0005', status: 'LIVE' }
      };
      
      const tokenResult = mockTokens[token] || { brand: 'unknown', last4: '****', status: 'DEAD' };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          code: tokenResult.status === 'LIVE' ? 1 : 0,
          status: tokenResult.status,
          message: tokenResult.status === 'LIVE' ? 'Token validated successfully' : 'Invalid token',
          card: {
            card: `**** **** **** ${tokenResult.last4}`,
            type: tokenResult.brand,
            method: 'token'
          }
        }),
      };
    }

    // Handle raw card data (test cards only - no real API calls)
    const parts = data.split('|').map(part => part.trim());
    const [number, month, year, cvc] = parts;
    
    if (!number || !month || !year || !cvc) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          code: 0,
          status: 'DEAD',
          message: 'Invalid format',
          card: { card: data, type: 'unknown' }
        }),
      };
    }

    const cleanNumber = number.replace(/\s/g, '');
    
    // Check against test card database
    const testCard = testCards[cleanNumber];
    if (testCard) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          code: testCard.status === 'LIVE' ? 1 : 0,
          status: testCard.status,
          message: testCard.status === 'LIVE' ? 'Test card validated' : 'Test card declined',
          card: {
            card: `**** **** **** ${testCard.last4}`,
            type: testCard.brand,
            last4: testCard.last4
          }
        }),
      };
    }

    // Basic validation for unknown cards
    const isValidLuhn = luhnCheck(cleanNumber);
    const cardType = getCardType(cleanNumber);
    
    if (!isValidLuhn) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          code: 0,
          status: 'DEAD',
          message: 'Invalid card number (failed Luhn check)',
          card: { card: data, type: cardType }
        }),
      };
    }

    // For unknown valid cards, return test result
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        code: 1,
        status: 'LIVE',
        message: 'Card format valid (test environment)',
        card: {
          card: `**** **** **** ${cleanNumber.slice(-4)}`,
          type: cardType,
          last4: cleanNumber.slice(-4)
        }
      }),
    };
    
  } catch (err) {
    console.error('Check function error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        code: 0,
        status: 'DEAD',
        message: 'Server error: ' + err.message,
        card: { card: '', type: 'unknown' }
      }),
    };
  }
};

// Helper functions
function luhnCheck(number) {
  let sum = 0;
  let isEven = false;
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

function getCardType(number) {
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6(?:011|5)/.test(number)) return 'discover';
  return 'unknown';
}
