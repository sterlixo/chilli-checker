const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51OaKZTKqZ8QjQX0X1234567890abcdefghijklmnopqrstuvwxyz');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST method for validation
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Only POST method allowed' })
    };
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

    // Log for debugging
    console.log('Stripe key available:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Using test key fallback:', !process.env.STRIPE_SECRET_KEY);

    // Create payment method with Stripe
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: number.replace(/\s/g, ''),
          exp_month: parseInt(month),
          exp_year: parseInt(year.length === 2 ? '20' + year : year),
          cvc: cvc,
        },
      });

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
            message: testCards[cleanNumber] === 'LIVE' ? 'Test card - Valid' : 'Test card - Declined',
            code: testCards[cleanNumber] === 'LIVE' ? 1 : 0,
            card: {
              card: cardData,
              type: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              country: paymentMethod.card.country || 'US',
              funding: paymentMethod.card.funding || 'credit'
            }
          }),
        };
      }

      // Enhanced validation for chargeable cards
      let status = 'DEAD';
      let message = 'Card declined';
      let code = 0;
      
      try {
        // Method 1: Try $0.50 authorization (most reliable for testing chargeability)
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 50, // $0.50 - minimal amount to test chargeability
          currency: 'usd',
          payment_method: paymentMethod.id,
          confirm: true,
          capture_method: 'manual',
          description: 'Card validation test - will be cancelled'
        });
        
        if (paymentIntent.status === 'requires_capture') {
          // Card is chargeable - cancel the authorization immediately
          await stripe.paymentIntents.cancel(paymentIntent.id);
          status = 'LIVE';
          message = 'Card is chargeable and valid';
          code = 1;
        } else if (paymentIntent.status === 'requires_action') {
          // Card requires 3D Secure but is valid
          await stripe.paymentIntents.cancel(paymentIntent.id);
          status = 'LIVE';
          message = 'Card valid - requires 3D Secure';
          code = 1;
        } else if (paymentIntent.status === 'succeeded') {
          // Shouldn't happen with manual capture, but handle it
          status = 'LIVE';
          message = 'Card charged successfully';
          code = 1;
        }
      } catch (paymentError) {
        // If payment fails, try setup intent as fallback
        try {
          const setupIntent = await stripe.setupIntents.create({
            payment_method: paymentMethod.id,
            confirm: true,
            usage: 'off_session',
          });

          if (setupIntent.status === 'succeeded') {
            status = 'LIVE';
            message = 'Card valid for future payments';
            code = 1;
          } else if (setupIntent.status === 'requires_action') {
            status = 'LIVE';
            message = 'Card valid - requires authentication';
            code = 1;
          }
        } catch (setupError) {
          console.log('Both payment and setup failed:', paymentError.message, setupError.message);
          // Will use the original paymentError for response
          throw paymentError;
        }
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
            type: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            country: paymentMethod.card.country,
            funding: paymentMethod.card.funding
          }
        }),
      };

    } catch (stripeError) {
      // Handle specific Stripe errors
      let status = 'DEAD';
      let message = 'Card declined';
      let code = 0;

      if (stripeError.type === 'StripeCardError') {
        switch (stripeError.code) {
          case 'card_declined':
            message = 'Card declined by issuer';
            break;
          case 'expired_card':
            message = 'Card expired';
            break;
          case 'incorrect_cvc':
            message = 'Invalid CVC';
            break;
          case 'processing_error':
            message = 'Processing error';
            break;
          case 'incorrect_number':
            message = 'Invalid card number';
            break;
          default:
            message = stripeError.message || 'Card validation failed';
        }
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        message = 'Invalid card data format';
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
            type: 'unknown'
          }
        }),
      };
    }

  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'DEAD',
        message: 'Validation failed: ' + error.message,
        code: 0,
        card: { card: cardData, type: 'unknown' }
      }),
    };
  }
};