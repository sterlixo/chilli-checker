// Free Card Validation (No Real Charging)
class FreeCardValidator {
  constructor() {
    this.binDatabase = {
      // Major card BINs (first 6 digits)
      '424242': { type: 'visa', bank: 'Test Bank', country: 'US' },
      '411111': { type: 'visa', bank: 'Test Bank', country: 'US' },
      '555555': { type: 'mastercard', bank: 'Test Bank', country: 'US' },
      '378282': { type: 'amex', bank: 'Test Bank', country: 'US' }
    };
  }

  validateCard(cardData) {
    const { number, month, year, cvv } = this.parseCard(cardData);
    
    // Basic validations
    if (!this.luhnCheck(number)) {
      return { status: 'DEAD', message: 'Invalid card number', code: 0 };
    }
    
    if (!this.validateExpiry(month, year)) {
      return { status: 'DEAD', message: 'Card expired', code: 0 };
    }
    
    if (!this.validateCVV(cvv, this.getCardType(number))) {
      return { status: 'DEAD', message: 'Invalid CVV', code: 0 };
    }
    
    // BIN lookup
    const bin = number.substring(0, 6);
    const binInfo = this.binDatabase[bin];
    
    if (binInfo) {
      return {
        status: 'LIVE',
        message: 'Card format valid',
        code: 1,
        card: {
          type: binInfo.type,
          bank: binInfo.bank,
          country: binInfo.country
        }
      };
    }
    
    return {
      status: 'UNKNOWN',
      message: 'Card format valid but BIN unknown',
      code: 0,
      card: { type: this.getCardType(number) }
    };
  }

  parseCard(cardData) {
    const parts = cardData.split('|');
    return {
      number: parts[0]?.replace(/\D/g, '') || '',
      month: parts[1] || '',
      year: parts[2] || '',
      cvv: parts[3] || ''
    };
  }

  luhnCheck(number) {
    let sum = 0;
    let alternate = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let n = parseInt(number.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n = (n % 10) + 1;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }

  validateExpiry(month, year) {
    const now = new Date();
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    return expiry > now;
  }

  validateCVV(cvv, cardType) {
    if (cardType === 'amex') return cvv.length === 4;
    return cvv.length === 3;
  }

  getCardType(number) {
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    return 'unknown';
  }
}

window.FreeCardValidator = FreeCardValidator;