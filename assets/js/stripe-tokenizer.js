// Stripe Frontend Tokenization for Real Cards
class StripeTokenizer {
  constructor() {
    this.stripe = Stripe('pk_test_51RsaBfACXAfuiFKxNvmHe2EQwNLAPqfmPUSEzGXAyq465Cu4bTg33piS3wjgR7EO39bXhow0Zc7LE5MpxWIgHlFM007e3uBG83');
  }

  async createToken(cardData) {
    const { number, month, year, cvc } = this.parseCard(cardData);
    
    try {
      const { token, error } = await this.stripe.createToken('card', {
        number: number,
        exp_month: month,
        exp_year: year,
        cvc: cvc,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, token: token.id, card: token.card };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async validateWithToken(cardData) {
    const tokenResult = await this.createToken(cardData);
    
    if (!tokenResult.success) {
      return {
        status: 'DEAD',
        message: tokenResult.error,
        code: 0
      };
    }

    // Send token to backend for validation
    try {
      const response = await fetch('/.netlify/functions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: tokenResult.token,
          cardData: cardData 
        })
      });

      return await response.json();
    } catch (error) {
      return {
        status: 'DEAD',
        message: 'Validation failed',
        code: 0
      };
    }
  }

  parseCard(cardData) {
    const parts = cardData.split('|');
    return {
      number: parts[0]?.replace(/\s/g, '') || '',
      month: parts[1] || '',
      year: parts[2]?.length === 2 ? '20' + parts[2] : parts[2] || '',
      cvc: parts[3] || ''
    };
  }
}

window.StripeTokenizer = StripeTokenizer;