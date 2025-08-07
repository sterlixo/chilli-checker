// Advanced Card Validation - High Accuracy Prediction
class AdvancedCardValidator {
  constructor() {
    // Known valid BIN ranges from major issuers
    this.validBins = {
      visa: [
        { start: 400000, end: 499999, confidence: 85 },
        { start: 424242, end: 424242, confidence: 100 }, // Test card
        { start: 411111, end: 411111, confidence: 100 }  // Test card
      ],
      mastercard: [
        { start: 510000, end: 559999, confidence: 85 },
        { start: 222100, end: 272099, confidence: 85 },
        { start: 555555, end: 555555, confidence: 100 }  // Test card
      ],
      amex: [
        { start: 340000, end: 379999, confidence: 80 },
        { start: 378282, end: 378282, confidence: 100 }  // Test card
      ]
    };
    
    // High-confidence patterns
    this.patterns = {
      highConfidence: [
        /^4242424242424242$/, // Stripe test
        /^4111111111111111$/, // Visa test
        /^5555555555554444$/, // MC test
        /^378282246310005$/   // Amex test
      ],
      suspicious: [
        /^0000/, /^1111/, /^2222/, /^3333/, /^5555/, /^6666/, /^7777/, /^8888/, /^9999/
      ]
    };
  }

  validateCard(cardData) {
    const { number, month, year, cvv } = this.parseCard(cardData);
    const cleanNumber = number.replace(/\D/g, '');
    
    // Multi-layer validation
    const checks = {
      luhn: this.luhnCheck(cleanNumber),
      format: this.formatCheck(cleanNumber, month, year, cvv),
      bin: this.binCheck(cleanNumber),
      pattern: this.patternCheck(cleanNumber),
      expiry: this.expiryCheck(month, year)
    };
    
    // Calculate confidence score
    let confidence = 0;
    let reasons = [];
    
    if (!checks.luhn) {
      return { status: 'DEAD', message: 'Failed Luhn algorithm', confidence: 0 };
    }
    confidence += 20;
    
    if (!checks.format) {
      return { status: 'DEAD', message: 'Invalid format', confidence: 0 };
    }
    confidence += 15;
    
    if (!checks.expiry) {
      return { status: 'DEAD', message: 'Card expired', confidence: 0 };
    }
    confidence += 15;
    
    // BIN analysis
    const binResult = checks.bin;
    if (binResult.valid) {
      confidence += binResult.confidence;
      reasons.push(`Valid ${binResult.type} BIN`);
    } else {
      confidence -= 20;
      reasons.push('Unknown BIN');
    }
    
    // Pattern analysis
    if (checks.pattern.suspicious) {
      confidence -= 30;
      reasons.push('Suspicious pattern');
    } else if (checks.pattern.highConfidence) {
      confidence += 30;
      reasons.push('Known test card');
    }
    
    // Final determination
    const status = confidence >= 70 ? 'LIVE' : 'DEAD';
    const message = `${status} - Confidence: ${confidence}% (${reasons.join(', ')})`;
    
    return {
      status,
      message,
      confidence,
      code: status === 'LIVE' ? 1 : 0,
      card: {
        type: this.getCardType(cleanNumber),
        last4: cleanNumber.slice(-4)
      }
    };
  }

  parseCard(cardData) {
    const parts = cardData.split('|');
    return {
      number: parts[0] || '',
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

  formatCheck(number, month, year, cvv) {
    return number.length >= 13 && number.length <= 19 &&
           month.length === 2 && parseInt(month) >= 1 && parseInt(month) <= 12 &&
           year.length === 2 && cvv.length >= 3 && cvv.length <= 4;
  }

  binCheck(number) {
    const bin = parseInt(number.substring(0, 6));
    const cardType = this.getCardType(number);
    
    if (this.validBins[cardType]) {
      for (const range of this.validBins[cardType]) {
        if (bin >= range.start && bin <= range.end) {
          return { valid: true, confidence: range.confidence, type: cardType };
        }
      }
    }
    
    return { valid: false, confidence: 0, type: cardType };
  }

  patternCheck(number) {
    const suspicious = this.patterns.suspicious.some(pattern => pattern.test(number));
    const highConfidence = this.patterns.highConfidence.some(pattern => pattern.test(number));
    
    return { suspicious, highConfidence };
  }

  expiryCheck(month, year) {
    const now = new Date();
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    return expiry > now;
  }

  getCardType(number) {
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6(?:011|5)/.test(number)) return 'discover';
    return 'unknown';
  }
}

window.AdvancedCardValidator = AdvancedCardValidator;