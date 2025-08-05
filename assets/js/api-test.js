// API Test Script - Use this to verify your real API setup
class ApiTester {
  constructor() {
    this.testResults = [];
  }

  async testStripeApi() {
    console.log('🧪 Testing Stripe API...');
    
    const testCard = '4242424242424242|12|2025|123';
    
    try {
      const response = await fetch('/.netlify/functions/stripe-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardData: testCard })
      });

      const result = await response.json();
      
      if (result.status === 'ERROR') {
        console.error('❌ Stripe API Error:', result.message);
        return false;
      } else {
        console.log('✅ Stripe API Working:', result.status, '-', result.message);
        return true;
      }
    } catch (error) {
      console.error('❌ Stripe API Request Failed:', error);
      return false;
    }
  }

  async testShopifyApi() {
    console.log('🧪 Testing Shopify API...');
    
    const testCard = '4242424242424242|12|2025|123';
    
    try {
      const response = await fetch('/.netlify/functions/shopify-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardData: testCard })
      });

      const result = await response.json();
      
      if (result.status === 'ERROR') {
        console.error('❌ Shopify API Error:', result.message);
        return false;
      } else {
        console.log('✅ Shopify API Working:', result.status, '-', result.message);
        return true;
      }
    } catch (error) {
      console.error('❌ Shopify API Request Failed:', error);
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 Starting API Tests...\n');
    
    const stripeWorking = await this.testStripeApi();
    const shopifyWorking = await this.testShopifyApi();
    
    console.log('\n📊 Test Results:');
    console.log(`Stripe API: ${stripeWorking ? '✅ Working' : '❌ Failed'}`);
    console.log(`Shopify API: ${shopifyWorking ? '✅ Working' : '❌ Failed'}`);
    
    if (stripeWorking || shopifyWorking) {
      console.log('\n🎉 At least one API is working! Your real API validation is set up correctly.');
    } else {
      console.log('\n⚠️  Both APIs failed. Check your environment variables and API credentials.');
      console.log('See REAL_API_SETUP.md for configuration instructions.');
    }
    
    return { stripe: stripeWorking, shopify: shopifyWorking };
  }
}

// Auto-run test when script loads (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname.includes('netlify')) {
  window.apiTester = new ApiTester();
  
  // Add a button to manually run tests
  document.addEventListener('DOMContentLoaded', function() {
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Test APIs';
    testButton.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:10px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;';
    testButton.onclick = () => window.apiTester.runFullTest();
    document.body.appendChild(testButton);
  });
}

window.ApiTester = ApiTester;