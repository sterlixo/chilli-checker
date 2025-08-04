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

    // Start validation (local, not server)
    $startBtn.on('click', function() {
        // If gate2 is checked, skip (let backend handle)
        if ($('#gate2').is(':checked')) return;
        resetTabs();
        const cards = $ccInput.val().split('\n').map(l => l.trim()).filter(Boolean);
        if (!cards.length) return;
        $startBtn.prop('disabled', true);
        $ccInput.prop('disabled', true);
        $stopBtn.prop('disabled', false).show();
        $startBtn.hide();
        $progressModal.modal({ backdrop: 'static', keyboard: false });
        validator.isProcessing = true;
        validator.processBatch(
            cards,
            function(stats) {
                const percent = Math.floor((stats.processed / stats.total) * 100);
                $progressBar.width(percent + '%');
                $percentLabel.text(percent + '%');
            },
            function(result) {
                addResult(result);
            }
        ).then(() => {
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
        $stopBtn.prop('disabled', true).hide();
        $startBtn.prop('disabled', false).show();
        $ccInput.prop('disabled', false);
    });
});
