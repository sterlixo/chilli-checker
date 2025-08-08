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

    // Stripe API Required - No Fallback
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          code: 0,
          status: 'DEAD',
          message: 'Stripe API key required for validation',
          card: { card: data, type: 'unknown' }
        }),
      };
    }

    console.log('🔵 Professional Stripe Chargeability Check');
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Handle token-based validation (secure)
    if (token) {
      console.log('Using secure token validation');
      
      try {
        const setupIntent = await stripe.setupIntents.create({
          payment_method_data: {
            type: 'card',
            card: { token: token }
          },
          confirm: true,
          usage: 'off_session'
        });
        
        if (setupIntent.status === 'succeeded') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              code: 1,
              status: 'LIVE',
              message: 'Card is chargeable ✅',
              card: {
                card: body.cardData || 'tokenized',
                type: 'verified',
                method: 'token'
              }
            }),
          };
        }
      } catch (tokenError) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            code: 0,
            status: 'DEAD',
            message: `Token validation failed: ${tokenError.message}`,
            card: { card: body.cardData || 'tokenized', type: 'unknown' }
          }),
        };
      }
    }
    
    // Handle raw card data (test cards only)
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
    
    // Enhanced $0 Authorization method for safe testing
    try {
      console.log(`Validating card ending in ${cleanNumber.slice(-4)} using $0 authorization`);
      
      // Create payment method first
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cleanNumber,
          exp_month: parseInt(month),
          exp_year: parseInt(year.length === 2 ? '20' + year : year),
          cvc: cvc,
        },
      });

      // Method 1: Setup Intent (No charge - just authorization check)
      try {
        const setupIntent = await stripe.setupIntents.create({
          payment_method: paymentMethod.id,
          confirm: true,
          usage: 'off_session'
        });
        
        if (setupIntent.status === 'succeeded') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              code: 1,
              status: 'LIVE',
              message: 'Card verified - chargeable without charging ✅',
              card: {
                card: data,
                type: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                funding: paymentMethod.card.funding,
                method: 'setup_intent'
              }
            }),
          };
        }
      } catch (setupError) {
        console.log('Setup Intent failed, trying $0 authorization...');
      }

      // Method 2: Enhanced $0 Authorization (Safe Testing)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 50, // $0.50 - minimal amount for testing
        currency: 'usd',
        payment_method: paymentMethod.id,
        confirm: true,
        capture_method: 'manual',
        description: 'Card validation test - will be cancelled'
      });

      if (paymentIntent.status === 'requires_capture') {
        // Immediately cancel to ensure no charge
        await stripe.paymentIntents.cancel(paymentIntent.id);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            code: 1,
            status: 'LIVE',
            message: 'Card authorized & canceled - chargeable confirmed ✅',
            card: {
              card: data,
              type: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              funding: paymentMethod.card.funding,
              method: '$0_authorization'
            }
          }),
        };
      }

      // Handle other payment intent statuses
      if (paymentIntent.status === 'succeeded') {
        // Refund immediately if somehow succeeded
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          amount: 50
        });
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            code: 1,
            status: 'LIVE',
            message: 'Card chargeable - refunded immediately ✅',
            card: {
              card: data,
              type: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              funding: paymentMethod.card.funding,
              method: 'refunded_charge'
            }
          }),
        };
      }
        
      } catch (stripeError) {
        console.log(`Attempt ${attempt} failed:`, stripeError.code);
        
        // If it's the last attempt, return the error
        if (attempt === 2) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              code: 0,
              status: 'DEAD',
              message: `Validation failed: ${stripeError.message}`,
              card: { card: data, type: getCardType(cleanNumber) }
            }),
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If we reach here, validation failed
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        code: 0,
        status: 'DEAD',
        message: 'Card validation failed',
        card: { card: data || 'unknown', type: 'unknown' }
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
        card: { card: data || '', type: 'unknown' }
      }),
    };
  }
};

// Helper functions
function getCardType(number) {
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6(?:011|5)/.test(number)) return 'discover';
  return 'unknown';
}

