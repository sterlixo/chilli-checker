// Initialize feather icons and gate controls
$(document).ready(function() {
    feather.replace();

    // Set Stripe gate to be checked by default
    if ($('#gate2').length) {
        $('#gate2').prop('checked', true).trigger('change');
    }
    
    // Add visual feedback for Gate2 (Stripe) checkbox
    $('#gate2').on('change', function() {
        const label = $(this).next('label');
        if ($(this).is(':checked')) {
            $('#gate3').prop('checked', false).next('label').removeClass('text-success');
            label.addClass('text-primary');
            console.log('Stripe Gate enabled');
        } else {
            label.removeClass('text-primary');
            console.log('Stripe Gate disabled');
        }
    });
    
    // Remove Shopify gate functionality - keep UI but disable
    $('#gate3').on('change', function() {
        // Disable Shopify gate
        $(this).prop('checked', false);
        alert('Shopify validation has been disabled. Please use Stripe validation instead.');
    });
    
    // Modal focus management
    $('#progress-modal').on('shown.bs.modal', function() {
        $(this).find('#modal-stop').focus();
    });
    
    $('#bin-generator').on('shown.bs.modal', function() {
        $(this).find('#bin').focus();
    });
    
    // Shake UI when name is clicked
    $('.bubble-name').on('click', function() {
        $('body').addClass('shake-ui');
        setTimeout(() => $('body').removeClass('shake-ui'), 800);
    });
});