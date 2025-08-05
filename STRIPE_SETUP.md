# Stripe API Setup Instructions

## Quick Start (Test Mode)

The system is pre-configured with test API keys for immediate testing.

### Test Cards for Validation:

**LIVE Cards (Will show as valid):**
- `4242424242424242|12|25|123` - Visa
- `4111111111111111|12|25|123` - Visa  
- `5555555555554444|12|25|123` - Mastercard
- `378282246310005|12|25|1234` - Amex

**DEAD Cards (Will show as declined):**
- `4000000000000002|12|25|123` - Generic decline
- `4000000000009995|12|25|123` - Insufficient funds
- `4000000000000069|12|25|123` - Expired card

## Production Setup

### 1. Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers > API Keys
3. Copy your Secret Key (starts with `sk_live_` or `sk_test_`)

### 2. Configure Environment Variables

**For Netlify:**
1. Go to Site Settings > Environment Variables
2. Add: `STRIPE_SECRET_KEY` = `your_secret_key_here`

**For Local Development:**
1. Update `.env` file:
```
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
```

### 3. Test the Integration
1. Enable Gate2 checkbox in the UI
2. Enter test card: `4242424242424242|12|25|123`
3. Click Start - should show "LIVE" result

## Security Notes
- Never commit real API keys to version control
- Use test keys for development
- Production keys should only be in environment variables
- The current test keys are safe for development use

## Troubleshooting
- If you get "Method not allowed": Check CORS headers
- If you get "API key not configured": Set STRIPE_SECRET_KEY
- If cards always show ERROR: Check Stripe key format (must start with sk_)