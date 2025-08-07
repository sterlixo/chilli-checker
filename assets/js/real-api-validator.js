// Real API Validator - Prioritizes actual API calls over fallbacks
class RealApiValidator {
  constructor() {
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 2000;
  }

  async validateCard(cardData, method = 'stripe') {
    try {
      return await this.callRealApi(cardData, method);
    } catch (error) {
      console.log('API call failed:', error.message);
      return {
        status: 'DEAD',
        message: 'API validation failed - card not verified',
        code: 0,
        card: { card: cardData, type: 'unknown' }
      };
    }
  }

  async callRealApi(cardData, method) {
    const endpoint = '/.netlify/functions/check';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ data: cardData }),
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      status: result.status,
      message: result.message,
      code: result.code,
      card: result.card
    };
  }



  async processBatch(cardsData, progressCallback, resultCallback, method = 'stripe') {
    console.log('RealApiValidator processBatch called with:', cardsData.length, 'cards');
    if (this.isProcessing) {
      console.log('Already processing, returning');
      return;
    }

    this.isProcessing = true;
    console.log('Starting batch processing...');
    const batch = {
      total: cardsData.length,
      processed: 0,
      valid: 0,
      live: 0,
      dead: 0,
      apiSuccess: 0,
      fallbackUsed: 0
    };

    for (let i = 0; i < cardsData.length && this.isProcessing; i++) {
      const cardData = cardsData[i].trim();
      if (!cardData) continue;

      console.log(`Processing card ${i + 1}/${cardsData.length}:`, cardData);
      
      const result = await this.validateCard(cardData, method);
      console.log('Validation result:', result);
      
      batch.processed++;
      if (result.status === 'LIVE') {
        batch.apiSuccess++;
        batch.valid++;
        batch.live++;
      } else {
        batch.valid++;
        batch.dead++;
      }

      const progress = Math.floor((batch.processed / batch.total) * 100);

      resultCallback({
        cardData,
        status: result.status,
        type: result.card?.type || 'unknown',
        reason: result.message,
        progress,
        valid: result.status !== 'ERROR'
      });

      progressCallback(batch);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessing = false;
    
    // Log final stats
    console.log(`Batch complete: ${batch.apiSuccess} successful API validations`);
    
    return batch;
  }

  extractCardData(cardData) {
    const parts = cardData.split("|").map(part => part.trim());
    return {
      number: parts[0] || "",
      month: parts[1] || "",
      year: parts[2] || "",
      cvv: parts[3] || ""
    };
  }

  luhnCheck(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, "");
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  getCardType(number) {
    const cleanNumber = number.replace(/\D/g, "");
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    if (/^3[0-5]/.test(cleanNumber)) return 'diners';
    if (/^35/.test(cleanNumber)) return 'jcb';
    return 'unknown';
  }

  stopProcessing() {
    this.isProcessing = false;
  }
}

window.RealApiValidator = RealApiValidator;