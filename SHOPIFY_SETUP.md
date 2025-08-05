# Shopify $1 Auth Gate Setup Instructions

## Quick Start (Test Mode)

The system is pre-configured with test credentials for immediate testing.

### Test Cards for $1 Authorization:

**LIVE Cards (Will pass $1 auth):**
- `4242424242424242|12|25|123` - Visa
- `4111111111111111|12|25|123` - Visa  
- `5555555555554444|12|25|123` - Mastercard
- `378282246310005|12|25|1234` - Amex

**DEAD Cards (Will fail $1 auth):**
- `4000000000000002|12|25|123` - Generic decline
- `4000000000009995|12|25|123` - Insufficient funds

## Production Setup

### 1. Create Shopify Private App
1. Go to your Shopify Admin
2. Navigate to Apps > App and sales channel settings
3. Click "Develop apps" > "Create an app"
4. Name it "Card Validator" 
5. Configure Admin API scopes: `write_payment_gateways`, `write_orders`
6. Install the app and copy the Access Token

### 2. Configure Environment Variables

**For Netlify:**
1. Go to Site Settings > Environment Variables
2. Add: `SHOPIFY_DOMAIN` = `your-store.myshopify.com`
3. Add: `SHOPIFY_ACCESS_TOKEN` = `shpat_your_token_here`

**For Local Development:**
1. Update `.env` file:
```
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_actual_token_here
```

### 3. Test the Integration
1. Enable Gate3 (Shopify) checkbox in the UI
2. Enter test card: `4242424242424242|12|25|123`
3. Click Start - should show "LIVE" result with "$1 authorization successful"

## How $1 Auth Works

1. **Authorization**: Creates a $1 authorization charge
2. **Validation**: Checks if the authorization succeeds
3. **Result**: Returns LIVE if auth passes, DEAD if declined
4. **Cleanup**: Authorization is automatically voided (no actual charge)

## Security Notes
- Never commit real API tokens to version control
- Use test credentials for development
- Production tokens should only be in environment variables
- The current test tokens are safe for development use

## Validation Rates (Fallback Mode)
- Visa: ~9% live rate (more restrictive than Stripe)
- Mastercard: ~7% live rate
- Amex: ~5% live rate
- Other cards: ~3% live rate

## Troubleshooting
- If you get "Method not allowed": Check CORS headers
- If you get "Credentials not configured": Set SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN
- If cards always show ERROR: Check Shopify app permissions
- If $1 auth fails: Verify payment gateway is configured in Shopify

## API Endpoints Used
- `POST /admin/api/2023-10/payments.json` - Create $1 authorization
- Requires: `X-Shopify-Access-Token` header
- Returns: Payment object with authorization status