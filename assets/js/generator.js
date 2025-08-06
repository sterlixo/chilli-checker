let exit;
const SIGNATURE = ""; // Removed zero-width signature for security

$("#start").click(function() {
    exit = 0;
    $(this).attr('disabled', 'disabled');
    $('#cc').attr('disabled', 'disabled');
    $('#stop').removeAttr('disabled');
    $(this).hide();
    $('#stop').show();

    $('#progress-modal').modal({
        backdrop: 'static',
        keyboard: false
    });

    let ccs = $('#cc').val().split("\n");
    const useGate2 = $("#gate2").is(":checked");
    const useGate3 = false; // Shopify gate disabled
    const timerDuration = useGate2 ? 4500 : 2500;

    const timer = ms => new Promise(res => setTimeout(res, ms));

    async function check() {
        for (i = 0; i < ccs.length; i++) {
            let postData = {
                data: ccs[i],
                charge: useGate2
            };

            let apiUrl, requestData;
            if (useGate2) {
                apiUrl = "/.netlify/functions/stripe-validate";
                requestData = { cardData: ccs[i] };
            } else {
                apiUrl = "/.netlify/functions/check";
                requestData = postData;
            }
            
            $.ajax({
                url: apiUrl,
                type: "POST",
                data: JSON.stringify(requestData),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function(response) {
                    let htmlAdd, htmlCount, progress;
                    let res = response;
                    progress = ((i + 1) / ccs.length * 100).toFixed(2) + '%';
                    switch (res.code) {
                        case 0:
                            htmlAdd = $('#die');
                            htmlCount = $('#die-tab');
                            break;
                        case 1:
                            htmlAdd = $('#live');
                            htmlCount = $('#live-tab');
                            break;
                        case 2:
                            htmlAdd = $('#unknown');
                            htmlCount = $('#unknown-tab');
                            break;
                        default:
                            // console.log(res);
                    }
                    const safeStatus = $('<div>').text(res.status).html();
                    const safeCard = $('<div>').text(res.card.card).html();
                    const safeType = $('<div>').text(res.card.type || 'Unknown').html();
                    const safeMessage = $('<div>').text(res.message).html();
                    const msg = `<div><b style="color:${res.status === 'Live' ? '#20b27c' : (res.status === 'Die' ? '#ff014f' : '#fce00c')}">${safeStatus}</b> | ${safeCard} | ${safeType} | ${safeMessage}</div>`;
                    htmlAdd.children().children().append(msg);
                    htmlCount.children().html(parseInt(htmlCount.children().text()) + 1);

                    // Update modal counts from tabs
                    $('#live-count').text($('#live-tab span').text());
                    $('#die-count').text($('#die-tab span').text());
                    $('#unknown-count').text($('#unknown-tab span').text());

                    $('#progress-modal .progress-bar').width(progress);
                    $('#progress-modal .percent-label').html(progress);
                    removeline();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // If Stripe API fails and gate2 is checked, use fallback
                    if (useGate2 && typeof StripeFallback !== 'undefined') {
                        const fallback = new StripeFallback();
                        fallback.validateCard(ccs[i]).then(function(result) {
                            const safeStatus = $('<div>').text(result.status).html();
                            const safeCard = $('<div>').text(result.card.card).html();
                            const safeType = $('<div>').text(result.card.type || 'Unknown').html();
                            const safeMessage = $('<div>').text(result.message).html();
                            const msg = `<div><b style="color:${result.status === 'LIVE' ? '#20b27c' : '#ff014f'}">${safeStatus}</b> | ${safeCard} | ${safeType} | ${safeMessage}</div>`;
                            
                            if (result.status === 'LIVE') {
                                $('#live').children().children().append(msg);
                                $('#live-tab').children().html(parseInt($('#live-tab').children().text()) + 1);
                            } else {
                                $('#die').children().children().append(msg);
                                $('#die-tab').children().html(parseInt($('#die-tab').children().text()) + 1);
                            }
                            
                            $('#live-count').text($('#live-tab span').text());
                            $('#die-count').text($('#die-tab span').text());
                            $('#unknown-count').text($('#unknown-tab span').text());
                            
                            let progress = ((i + 1) / ccs.length * 100).toFixed(2) + '%';
                            $('#progress-modal .progress-bar').width(progress);
                            $('#progress-modal .percent-label').html(progress);
                            removeline();
                        });
                        return;
                    }
                    
                    // Original error handling
                    const safeCard = $('<div>').text(ccs[i]).html();
                    const safeError = $('<div>').text('Fallback validation').html();
                    const errorMsg = `<div><b style="color:#ff014f">Error</b> | ${safeCard} | ${safeError}</div>`;
                    $('#unknown').children().children().append(errorMsg);
                    $('#unknown-tab').children().html(parseInt($('#unknown-tab').children().text()) + 1);

                    // Update modal counts from tabs
                    $('#live-count').text($('#live-tab span').text());
                    $('#die-count').text($('#die-tab span').text());
                    $('#unknown-count').text($('#unknown-tab span').text());

                    let progress = ((i + 1) / ccs.length * 100).toFixed(2) + '%';
                    $('#progress-modal .progress-bar').width(progress);
                    $('#progress-modal .percent-label').html(progress);
                    removeline();
                }
            });

            if (exit == 1 || i == ccs.length - 1) {
                $('#stop').attr('disabled', 'disabled');
                $('#start').removeAttr('disabled');
                $('#cc').removeAttr('disabled', 'readonly');
                setTimeout(() => {
                    $('#progress-modal').modal('hide');
                }, 1200);
                $('#start').show();
                $('#stop').hide();
                if (i == ccs.length - 1) {
                    $('#cc').val('');
                }
                return;
            }

            await timer(timerDuration);
        }
    }
    check();
});

$("#modal-stop").click(function() {
    exit = 1;
    $('#progress-modal').modal('hide');
    $('#stop').attr('disabled', 'disabled');
    $('#start').removeAttr('disabled');
    $('#cc').removeAttr('disabled', 'readonly');
    $('#start').show();
    $('#stop').hide();
});

// Fix modal focus issues
$('#progress-modal').on('show.bs.modal', function() {
    $(this).removeAttr('aria-hidden');
}).on('hidden.bs.modal', function() {
    $(this).attr('aria-hidden', 'true');
    $(this).find('button').blur();
});

$("#stripe").on("change", function() {
    if ($(this).is(":checked"))
        $("#key").show()
    else $("#key").hide();
})

$("#bin").blur(function() {
    $("#bin").val(addPlaceholder());
});
$("#gen").click(function() {
    $("#cc").val(generate());
    $(".close").click();
});

// Add this event handler for the modal
$('#bin-generator').on('show.bs.modal', function() {
    $(this).removeAttr('aria-hidden');
}).on('shown.bs.modal', function() {
    $('#bin').focus();
    // Populate year dropdown
    const yearSelect = $('#year');
    if (yearSelect.children('option').length === 1) { // Only populate if it's not already populated
        const currentYear = new Date().getFullYear();
        for (let i = 0; i <= 10; i++) {
            yearSelect.append(new Option(currentYear + i, currentYear + i));
        }
    }
    // Populate month dropdown
    const monthSelect = $('#month');
    if (monthSelect.children('option').length === 1) { // Only populate if it's not already populated
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        for (let i = 0; i < months.length; i++) {
            monthSelect.append(new Option(months[i], String(i + 1).padStart(2, '0')));
        }
    }
}).on('hide.bs.modal', function() {
    $(this).attr('aria-hidden', 'true');
});

function removeline() {
    var lines = $("#cc").val().split('\n');
    lines.splice(0, 1);
    $("#cc").val(lines.join("\n"));
}

function generate() {
    var t = "";
    if (!("" === $("#bin").val() || $("#bin").val().length < 6)) {
        let creditCards = "";
        for (var e = 0; e < $("#quantity").val(); e++) {
            creditCards += makeCC();
            0 === e && (t = creditCards);
            creditCards += generateDate();
            creditCards += generateCCV2();
            e < $("#quantity").val() - 1 && (creditCards += "\n");
        }
        return creditCards;
    }
}

function makeCC() {
    let bin = $("#bin").val();
    let template = addPlaceholder();
    for (let attempt = 0; attempt < 500; attempt++) {
        let cardNumber = template.split('').map(char =>
            char.toLowerCase() === 'x' ? rand(0, 9).toString() : char
        ).join('');

        if (validateLuhn(cardNumber)) {
            return cardNumber + SIGNATURE;
        }
    }
    return template.replace(/x/gi, () => rand(0, 9).toString()) + SIGNATURE;
}

function generateDate() {
    var e = "" === $("#month").val() ? pad(rand(1, 12), 2) : $("#month").val();
    var t = "" === $("#year").val() ? (new Date().getFullYear()) + rand(2, 5) : $("#year").val();
    return "|" + e + "|" + t;
}

function generateCCV2() {
    let length = ($("#bin").val().length < 16) ? 4 : 3;
    return $("#cvv").val() ? "|" + $("#cvv").val() : "|" + Array.from({
        length
    }, () => rand(0, 9)).join('');
}

function addPlaceholder() {
    let e = "",
        t = $("#bin").val();
    if (!(t.length < 6)) {
        t = t.replace(/\s+/g, "");
        /^3/.exec(t) ? tl = 15 : tl = 16;
        t = t.replace(/X/g, "x");
        t = t.replace(/[^0-9x]/g, "");
        for (var n = 0; n < tl - t.length; n++) e += "x";
        t += e;
    }
    return t;
}

function rand(t, e) {
    return 0 == t ? Math.floor(Math.random() * e + 0) : Math.floor(Math.random() * (e - t + 1)) + t;
}

function pad(t, e) {
    return t.toString().padStart(e, '0');
}

function validateLuhn(cardNumber) {
    let sum = 0;
    let isEven = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        isEven = !isEven;
    }
    return (sum % 10) === 0;
}