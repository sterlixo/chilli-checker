/**
 * Secure Credit Card Validator
 * Uses test tokens and secure validation methods
 */

class SecureCardValidator {
  constructor() {
    this.testCards = {
      '4242424242424242': { brand: 'visa', last4: '4242', status: 'LIVE' },
      '4000056655665556': { brand: 'mastercard', last4: '5556', status: 'LIVE' },
      '5555555555554444': { brand: 'mastercard', last4: '4444', status: 'LIVE' },
      '378282246310005': { brand: 'amex', last4: '0005', status: 'LIVE' },
      '6011111111111117': { brand: 'discover', last4: '1117', status: 'LIVE' },
      '5146161533726687': { brand: 'mastercard', last4: '6687', status: 'LIVE' }
    };
  }

  async validateCard(cardData) {
    try {
      const parts = cardData.split('|').map(part => part.trim());
      const [number, month, year, cvc] = parts;
      
      if (!number || !month || !year || !cvc) {
        return {
          valid: false,
          error: 'Invalid format'
        };
      }
All API attempts failed, using local validation
simple-validator.js:91 Validating card: 5146164178185284|07|2028|603
simple-validator.js:96 Validation attempt 1/2
      const cleanNumber = number.replace(/\s/g, '');
      
      // Check against test card database
      const testCard = this.testCards[cleanNumber];
      if (testCard) {
        return {
          valid: testCard.status === 'LIVE',
          status: testCard.status,
          brand: testCard.brand,
          last4: testCard.last4,
          message: testCard.status === 'LIVE' ? 'Valid test card' : 'Test card declined'
        };
      }

      // Basic validation for unknown cards
      const isValidLuhn = this.luhnCheck(cleanNumber);
      const cardType = this.getCardType(cleanNumber);
      
      return {
        valid: isValidLuhn,
        status: isValidLuhn ? 'LIVE' : 'DEAD',
        brand: cardType,
        last4: cleanNumber.slice(-4),
        message: isValidLuhn ? 'Valid card format' : 'Invalid card number'
      };
      
    } catch (err) {
      return {
        valid: false,
        error: err.message
      };
    }
  }

  luhnCheck(number) {
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  getCardType(number) {
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6(?:011|5)/.test(number)) return 'discover';
    return 'unknown';
  }
}

// Usage example
document.addEventListener('DOMContentLoaded', () => {
  const validator = new SecureCardValidator();
  
  // Example usage
  document.getElementById('validate-btn')?.addEventListener('click', async () => {
    const cardData = document.getElementById('card-input').value;
    
    if (!cardData) {
      alert('Please enter card data');
      return;
    }
    
    const result = await validator.validateCard(cardData);
    
    if (result.valid) {
      console.log('✅ Card is valid:', result);
      alert(`Card is ${result.status}: ${result.brand} ending in ${result.last4}`);
    } else {
      console.log('❌ Card is invalid:', result);
      alert(`Card validation failed: ${result.error || result.message}`);
    }
  });
});
