// Shopify $1 Auth Gate Validator
class ShopifyValidator {
  constructor() {
    this.apiEndpoint = '/.netlify/functions/shopify-validate';
    this.isProcessing = false;
  }

  async validateCard(cardData) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cardData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shopify API error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Shopify validation error:', error);
      console.error('Request details:', {
        url: this.apiEndpoint,
        cardData: cardData?.substring(0, 10) + '...'
      });
      return {
        status: 'ERROR',
        message: `Shopify validation error: ${error.message}`,
        code: 2
      };
    }
  }

  async processBatch(cardsData, progressCallback, resultCallback) {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const batch = {
      total: cardsData.length,
      processed: 0,
      valid: 0,
      live: 0,
      dead: 0,
    };

    for (let i = 0; i < cardsData.length; i++) {
      if (!this.isProcessing) break;

      const cardData = cardsData[i].trim();
      if (!cardData) continue;

      const result = await this.validateCard(cardData);
      
      batch.processed++;
      
      if (result.status === 'LIVE') {
        batch.valid++;
        batch.live++;
      } else if (result.status === 'DEAD') {
        batch.valid++;
        batch.dead++;
      }

      const progress = Math.floor((batch.processed / batch.total) * 100);

      if (result.status === 'LIVE' || result.status === 'DEAD') {
        resultCallback({
          cardData,
          status: result.status,
          type: result.card?.type || 'unknown',
          reason: result.message,
          progress,
          valid: result.status !== 'ERROR'
        });
      }

      progressCallback(batch);

      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.isProcessing = false;
    return batch;
  }

  stopProcessing() {
    this.isProcessing = false;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopifyValidator;
} else {
  window.ShopifyValidator = ShopifyValidator;
}