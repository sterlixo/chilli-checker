// Base CCValidator class for local validation
class CCValidator {
    constructor() {
        this.isProcessing = false;
    }

    // Extract card data from string format
    extractCardData(cardData) {
        const parts = cardData.split("|").map(part => part.trim());
        return {
            number: parts[0] || "",
            month: parts[1] || "",
            year: parts[2] || "",
            cvv: parts[3] || ""
        };
    }

    // Luhn algorithm validation
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

    // Get card type from number
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

    // Validate single card
    validateCard(cardData) {
        const { number, month, year, cvv } = this.extractCardData(cardData);
        
        // Basic validation
        if (!number || !month || !year) {
            return {
                status: 'DEAD',
                message: 'Invalid card format',
                card: { card: cardData, type: 'unknown' }
            };
        }

        // Luhn check
        if (!this.luhnCheck(number)) {
            return {
                status: 'DEAD',
                message: 'Invalid card number (Luhn check failed)',
                card: { card: cardData, type: this.getCardType(number) }
            };
        }

        // Date validation
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const cardYear = parseInt(year);
        const cardMonth = parseInt(month);

        if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
            return {
                status: 'DEAD',
                message: 'Card expired',
                card: { card: cardData, type: this.getCardType(number) }
            };
        }

        // If all checks pass, consider it valid (local validation only)
        return {
            status: 'LIVE',
            message: 'Valid card format',
            card: { card: cardData, type: this.getCardType(number) }
        };
    }

    // Process batch of cards
    async processBatch(cardsData, progressCallback, resultCallback) {
        if (this.isProcessing) return;

        this.isProcessing = true;
        const batch = {
            total: cardsData.length,
            processed: 0,
            valid: 0,
            live: 0,
            dead: 0
        };

        for (let i = 0; i < cardsData.length; i++) {
            if (!this.isProcessing) break;

            const cardData = cardsData[i].trim();
            if (!cardData) continue;

            const result = this.validateCard(cardData);
            
            batch.processed++;
            
            if (result.status === 'LIVE') {
                batch.valid++;
                batch.live++;
            } else if (result.status === 'DEAD') {
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

            // Small delay to prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.isProcessing = false;
        return batch;
    }

    // Stop processing
    stopProcessing() {
        this.isProcessing = false;
    }
}

// Make it globally available
window.CCValidator = CCValidator;

$(document).ready(function() {
    let isProcessing = false;
    const validator = new AdvancedCardValidator();

    $('#start').click(function() {
        if (isProcessing) return;

        const cardData = $('#cc').val().trim();
        if (!cardData) {
            alert('Please enter card data');
            return;
        }

        const cards = cardData.split('\n').filter(line => line.trim());
        if (cards.length === 0) {
            alert('No valid card data found');
            return;
        }

        startValidation(cards);
    });

    $('#stop, #modal-stop').click(function() {
        isProcessing = false;
        $('#progress-modal').modal('hide');
        $('#start').prop('disabled', false).show();
        $('#stop').prop('disabled', true).hide();
    });

    async function startValidation(cards) {
        isProcessing = true;
        $('#start').prop('disabled', true).hide();
        $('#stop').prop('disabled', false).show();
        $('#progress-modal').modal('show');

        // Clear results
        $('#live .pricing-body').empty();
        $('#die .pricing-body').empty();
        $('#unknown .pricing-body').empty();
        $('#live-tab span').text('0');
        $('#die-tab span').text('0');
        $('#unknown-tab span').text('0');

        let processed = 0;
        let liveCount = 0;
        let dieCount = 0;
        let unknownCount = 0;

        for (let i = 0; i < cards.length && isProcessing; i++) {
            const cardData = cards[i].trim();
            if (!cardData) continue;

            const result = validator.validateCard(cardData);
            processed++;

            const msg = `<div><b style="color:${result.status === 'LIVE' ? '#20b27c' : (result.status === 'DEAD' ? '#ff014f' : '#fce00c')}">${result.status}</b> | ${cardData} | ${result.card?.type || 'unknown'} | ${result.message}</div>`;

            if (result.status === 'LIVE') {
                liveCount++;
                $('#live .pricing-body').append(msg);
                $('#live-tab span').text(liveCount);
            } else if (result.status === 'DEAD') {
                dieCount++;
                $('#die .pricing-body').append(msg);
                $('#die-tab span').text(dieCount);
            } else {
                unknownCount++;
                $('#unknown .pricing-body').append(msg);
                $('#unknown-tab span').text(unknownCount);
            }

            const percentage = Math.floor((processed / cards.length) * 100);
            $('.progress-bar').css('width', percentage + '%');
            $('.percent-label').text(percentage + '%');
            $('#live-count').text(liveCount);
            $('#die-count').text(dieCount);
            $('#unknown-count').text(unknownCount);

            await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for UI updates
        }

        isProcessing = false;
        $('#progress-modal').modal('hide');
        $('#start').prop('disabled', false).show();
        $('#stop').prop('disabled', true).hide();
    }
});