exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { data } = body;

    // CCValidator class (from script.js)
    class CCValidator {
      constructor() {
        this.cardPatterns = {
          visa: {
            pattern: /^4[0-9]{12}(?:[0-9]{3})?$/,
            cvvLength: [3],
          },
          mastercard: {
            pattern: /^5[1-5][0-9]{14}$/,
            cvvLength: [3],
          },
          amex: {
            pattern: /^3[47][0-9]{13}$/,
            cvvLength: [4],
          },
          discover: {
            pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
            cvvLength: [3],
          },
          diners: {
            pattern: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
            cvvLength: [3],
          },
          jcb: {
            pattern: /^(?:2131|1800|35\d{3})\d{11}$/,
            cvvLength: [3],
          },
        };
        this.isProcessing = false;
        this.currentBatch = null;
      }

      extractCardData(cardData) {
        const parts = cardData.split("|").map((part) => part.trim());
        return {
          number: parts[0] || "",
          month: parts[1] || "",
          year: parts[2] || "",
          cvv: parts[3] || "",
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

      validateExpiration(month, year) {
        if (!month || !year) return false;
        if (month.length !== 2) return false;
        const mm = parseInt(month, 10);
        if (mm < 1 || mm > 12) return false;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let fullYear = parseInt(year, 10);
        if (year.length === 2) {
          fullYear = 2000 + fullYear;
        } else if (year.length !== 4) {
          return false;
        }
        if (fullYear < currentYear) return false;
        if (fullYear === currentYear && mm < currentMonth) return false;
        return true;
      }

      validateCVV(cvv, cardType) {
        if (!cvv) return false;
        const typeInfo = this.cardPatterns[cardType] || { cvvLength: [3] };
        return typeInfo.cvvLength.includes(cvv.length) && /^\d+$/.test(cvv);
      }

      validateCard(cardData) {
        const { number, month, year, cvv } = this.extractCardData(cardData);
        if (!number) return { valid: false, reason: "Missing card number" };
        const cleanedNumber = number.replace(/\D/g, "");
        const type = Object.entries(this.cardPatterns).find(([_, info]) => info.pattern.test(cleanedNumber))?.[0] || "unknown";
        if (!this.luhnCheck(cleanedNumber)) {
          return { valid: false, type, reason: "Failed Luhn check" };
        }
        if (!this.validateExpiration(month, year)) {
          return { valid: false, type, reason: "Invalid expiration date" };
        }
        if (!this.validateCVV(cvv, type)) {
          return { valid: false, type, reason: "Invalid CVV" };
        }
        return { valid: true, type };
      }

      simulateStatus() {
        const random = Math.random();
        if (random < 0.2) return "LIVE";
        return "DEAD";
      }
    }

    const validator = new CCValidator();
    const validation = validator.validateCard(data);
    let status = "Unknown";
    let code = 2;
    if (validation.valid) {
      status = validator.simulateStatus();
      code = status === "LIVE" ? 1 : 0;
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        code,
        status,
        message: validation.reason || (status === "LIVE" ? "Card is valid" : "Card is invalid"),
        card: {
          card: data,
          type: validation.type,
        }
      }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request' }),
    };
  }
};
