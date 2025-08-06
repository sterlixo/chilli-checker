// Bridge CCValidator logic to existing UI (no UI changes)
// Assumes script.js is loaded before this file

// Only run after DOM is ready
$(function() {
    // Check if CCValidator is available
    if (typeof CCValidator !== 'function') return;
    const validator = new CCValidator();

    // Use your existing textarea and buttons
    const $ccInput = $('#cc');
    const $startBtn = $('#start');
    const $stopBtn = $('#stop');
    const $progressModal = $('#progress-modal');
    const $progressBar = $('#progress-modal .progress-bar');
    const $percentLabel = $('#progress-modal .percent-label');
    const $liveTab = $('#live-tab');
    const $dieTab = $('#die-tab');
    const $unknownTab = $('#unknown-tab');
    const $liveBody = $('#live .pricing-body');
    const $dieBody = $('#die .pricing-body');
    const $unknownBody = $('#unknown .pricing-body');

    // Helper to reset UI
    function resetTabs() {
        $liveBody.empty();
        $dieBody.empty();
        $unknownBody.empty();
        $liveTab.find('span').text('0');
        $dieTab.find('span').text('0');
        $unknownTab.find('span').text('0');
        $progressBar.width('0%');
        $percentLabel.text('0%');
    }

    // Add result to tab
    function addResult(result) {
        const { number, month, year, cvv } = validator.extractCardData(result.cardData);
        const cardInfo = `${number}|${month}|${year}|${cvv}`;
        const msg = `<div><b style="color:${result.status === 'LIVE' ? '#20b27c' : (result.status === 'DEAD' ? '#ff014f' : '#fce00c')}">${result.status}</b> | ${cardInfo} | ${result.type ? result.type.toUpperCase() : ''} ${result.reason ? '| ' + result.reason : ''}</div>`;
        if (result.status === 'LIVE') {
            $liveBody.append(msg);
            $liveTab.find('span').text(parseInt($liveTab.find('span').text()) + 1);
        } else if (result.status === 'DEAD') {
            $dieBody.append(msg);
            $dieTab.find('span').text(parseInt($dieTab.find('span').text()) + 1);
        } else {
            $unknownBody.append(msg);
            $unknownTab.find('span').text(parseInt($unknownTab.find('span').text()) + 1);
        }
    }

    // Start validation (local or Stripe)
    $startBtn.on('click', function() {
        resetTabs();
        const cards = $ccInput.val().split('\n').map(l => l.trim()).filter(Boolean);
        if (!cards.length) return;
        
        $startBtn.prop('disabled', true);
        $ccInput.prop('disabled', true);
        $stopBtn.prop('disabled', false).show();
        $startBtn.hide();
        $progressModal.modal({ backdrop: 'static', keyboard: false });
        
        // Choose validator based on gate checkboxes - focus on Stripe only
        const useStripe = $('#gate2').is(':checked');
        let activeValidator = validator;
        let validationMethod = 'local';
        
        if (useStripe) {
            // Use RealApiValidator for Stripe
            if (typeof RealApiValidator !== 'undefined') {
                activeValidator = new RealApiValidator();
                validationMethod = 'stripe';
                console.log('Using Real API validator with stripe method');
            } else if (typeof StripeValidator !== 'undefined') {
                activeValidator = new StripeValidator();
                console.log('Using Stripe validator');
            } else if (typeof StripeFallback !== 'undefined') {
                activeValidator = new StripeFallback();
                console.log('Using Stripe fallback validator');
            }
        }
        
        activeValidator.isProcessing = true;
        
        // Pass validation method to RealApiValidator
        const processBatchArgs = [cards,
            function(stats) {
                const percent = Math.floor((stats.processed / stats.total) * 100);
                $progressBar.width(percent + '%');
                $percentLabel.text(percent + '%');
                
                // Show API success rate for RealApiValidator
                if (stats.apiSuccess !== undefined) {
                    const apiRate = stats.processed > 0 ? Math.round((stats.apiSuccess / stats.processed) * 100) : 0;
                    $percentLabel.text(`${percent}% (${apiRate}% Real API)`);
                }
            },
            function(result) {
                addResult(result);
            }
        ];
        
        // Add validation method for RealApiValidator
        if (activeValidator instanceof RealApiValidator) {
            processBatchArgs.push(validationMethod);
        }
        
        activeValidator.processBatch(...processBatchArgs).then(() => {
            $startBtn.prop('disabled', false).show();
            $ccInput.prop('disabled', false);
            $stopBtn.prop('disabled', true).hide();
            setTimeout(() => $progressModal.modal('hide'), 1200);
            $ccInput.val('');
        });
    });

    // Stop validation
    $stopBtn.on('click', function() {
        validator.stopProcessing();
        
        // Stop all possible validators
        if (typeof RealApiValidator !== 'undefined') {
            const realValidator = new RealApiValidator();
            realValidator.stopProcessing();
        }
        if (typeof StripeValidator !== 'undefined') {
            const stripeValidator = new StripeValidator();
            stripeValidator.stopProcessing();
        }
        
        $stopBtn.prop('disabled', true).hide();
        $startBtn.prop('disabled', false).show();
        $ccInput.prop('disabled', false);
    });
});
