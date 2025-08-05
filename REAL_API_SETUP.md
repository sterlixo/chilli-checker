# Real API Setup Guide

This guide will help you configure real API validation instead of using fallback methods.

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Stripe Configuration (Required for Stripe validation)
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key_here
# For testing, use: sk_test_your_test_stripe_secret_key_here

# Shopify Configuration (Required for Shopify validation)
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_private_app_access_token_here
```

## Stripe Setup

1. **Get Stripe API Keys:**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your Secret key (starts with `sk_test_` for test mode or `sk_live_` for live mode)
   - Add it to your `.env` file as `STRIPE_SECRET_KEY`

2. **Test Cards for Development:**
   - `4242424242424242` - Always succeeds
   - `4000000000000002` - Always declined
   - `4000000000009995` - Always declined (insufficient funds)

## Shopify Setup

1. **Create a Private App:**
   - Go to your Shopify admin → Apps → App and sales channel settings
   - Click "Develop apps" → "Create an app"
   - Give it a name like "Card Validator"

2. **Configure Permissions:**
   - Go to "Configuration" tab
   - Under "Admin API access scopes", enable:
     - `read_orders`
     - `write_orders` 
     - `read_customers`
     - `write_customers`

3. **Get Access Token:**
   - Click "Install app"
   - Copy the "Admin API access token"
   - Add it to your `.env` file as `SHOPIFY_ACCESS_TOKEN`
   - Add your store domain as `SHOPIFY_DOMAIN` (e.g., `your-store.myshopify.com`)

## Netlify Deployment

1. **Set Environment Variables in Netlify:**
   - Go to your Netlify site dashboard
   - Navigate to Site settings → Environment variables
   - Add the same variables from your `.env` file

2. **Deploy:**
   - Push your changes to your repository
   - Netlify will automatically redeploy with the new configuration

## How It Works

The new `RealApiValidator` class:

1. **Prioritizes Real APIs:** Always tries the actual Stripe/Shopify APIs first
2. **Retry Logic:** Attempts up to 3 times with delays between retries
3. **Fallback Only When Necessary:** Only uses simulated validation if all API attempts fail
4. **Better Reporting:** Shows you the percentage of real API calls vs fallbacks
5. **Improved Error Handling:** Provides detailed error messages and logging

## Verification

To verify your setup is working:

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Start a card validation
4. Look for messages like:
   - `"Using Real API validator with stripe method"`
   - `"Batch complete: X real API calls, Y fallbacks"`

If you see mostly real API calls and few fallbacks, your setup is working correctly!

## Troubleshooting

**High Fallback Rate:**
- Check your environment variables are set correctly
- Verify your API keys are valid and have proper permissions
- Check the browser console for specific error messages

**Stripe Issues:**
- Ensure your secret key starts with `sk_test_` or `sk_live_`
- Check your Stripe dashboard for any API errors
- Verify your account is in good standing

**Shopify Issues:**
- Confirm your private app has the correct permissions
- Check that your domain format is correct (include `.myshopify.com`)
- Verify the access token is copied correctly (no extra spaces)

## Security Notes

- Never commit your `.env` file to version control
- Use test keys during development
- Rotate your API keys regularly
- Monitor your API usage in the respective dashboards