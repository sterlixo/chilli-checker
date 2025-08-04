(function($) {
    'use strict';

    function checkDomain() {
        const allowedDomain = 'chillihub';
        const currentDomain = window.location.hostname;

        if (currentDomain !== allowedDomain && currentDomain !== 'localhost' && currentDomain !== '127.0.0.1') {
            window.location.href = `https://${allowedDomain}`;
        }
    }

    var imJs = {
        m: function(e) {
            checkDomain();
            imJs.d();
            imJs.methods();
        },
        d: function(e) {
            this._window = $(window),
                this._document = $(document),
                this._body = $('body'),
                this._html = $('html')

        },

        methods: function(e) {
            imJs.featherAtcivation();
            imJs.backToTopInit();
            imJs.mobileMenuActive();
            imJs.stickyHeader();
            imJs.smothScroll();
            imJs.smothScroll_Two();
            imJs.stickyAdjust();
            imJs.contactForm();
            imJs.populateYearDropdown();
        },




        contactForm: function() {
            $('.rwt-dynamic-form').on('submit', function(e) {
                e.preventDefault();
                var _self = $(this);
                var __selector = _self.closest('input,textarea');
                _self.closest('div').find('input,textarea').removeAttr('style');
                _self.find('.error-msg').remove();
                _self.closest('div').find('button[type="submit"]').attr('disabled', 'disabled');
                var data = $(this).serialize();
                $.ajax({
                    url: 'http://localhost:5000/contact',
                    type: "post",
                    dataType: 'json',
                    data: data,
                    success: function(data) {
                        _self.closest('div').find('button[type="submit"]').removeAttr('disabled');
                        if (data.code == false) {
                            _self.closest('div').find('[name="' + data.field + '"]');
                            _self.find('.rn-btn').after('<div class="error-msg"><p>*' + data.err + '</p></div>');
                        } else {
                            $('.error-msg').hide();
                            $('.form-group').removeClass('focused');
                            _self.find('.rn-btn').after('<div class="success-msg"><p>' + data.success + '</p></div>');
                            _self.closest('div').find('input,textarea').val('');

                            setTimeout(function() {
                                $('.success-msg').fadeOut('slow');
                            }, 5000);
                        }
                    }
                });
            });

        },

        populateYearDropdown: function() {
            const yearSelect = document.getElementById('year');
            if (yearSelect) {
                const currentYear = new Date().getFullYear();
                for (let year = currentYear; year <= currentYear + 8; year++) {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelect.appendChild(option);
                }
            }
        },

        wowActive: function() {
            //new WOW().init();
        },

        smothScroll: function() {
            $(document).on('click', '.smoth-animation', function(event) {
                event.preventDefault();
                $('html, body').animate({
                    scrollTop: $($.attr(this, 'href')).offset().top - 50
                }, 300);
            });
        },
        // two scroll spy
        smothScroll_Two: function() {
            $(document).on('click', '.smoth-animation-two', function(event) {
                event.preventDefault();
                $('html, body').animate({
                    scrollTop: $($.attr(this, 'href')).offset().top - 0
                }, 300);
            });
        },


        stickyAdjust: function(e) {
            // Sticky Top Adjust..,
            $('.rbt-sticky-top-adjust').css({
                top: 120
            });

            $('.rbt-sticky-top-adjust-two').css({
                top: 200
            });
            $('.rbt-sticky-top-adjust-three').css({
                top: 25
            });
        },

        featherAtcivation: function() {
            feather.replace()
        },


        backToTopInit: function() {
            // declare variable
            var scrollTop = $('.backto-top');
            $(window).scroll(function() {
                // declare variable
                var topPos = $(this).scrollTop();
                // if user scrolls down - show scroll to top button
                if (topPos > 100) {
                    $(scrollTop).css('opacity', '1');

                } else {
                    $(scrollTop).css('opacity', '0');
                }
            });

            //Click event to scroll to top
            $(scrollTop).on('click', function() {
                $('html, body').animate({
                    scrollTop: 0,
                    easingType: 'linear',
                }, 500);
                return false;
            });

        },

        stickyHeader: function(e) {
            $(window).scroll(function() {
                if ($(this).scrollTop() > 250) {
                    $('.header--sticky').addClass('sticky')
                } else {
                    $('.header--sticky').removeClass('sticky')
                }
            })
        },

        mobileMenuActive: function(e) {
            $('.humberger-menu').on('click', function(e) {
                e.preventDefault();
                $('.popup-mobile-menu').addClass('menu-open');
                imJs._html.css({
                    overflow: 'hidden'
                })
            });

            $('.close-menu-activation, .popup-mobile-menu .primary-menu .nav-item a').on('click', function(e) {
                e.preventDefault();
                $('.popup-mobile-menu').removeClass('menu-open');
                $('.has-droupdown > a').removeClass('open').siblings('.submenu').removeClass('active').slideUp('400');
                imJs._html.css({
                    overflow: ''
                })
            });

            $('.popup-mobile-menu').on('click', function(e) {
                e.target === this && $('.popup-mobile-menu').removeClass('menu-open');
                imJs._html.css({
                    overflow: ''
                })
            });


            $('.has-droupdown > a').on('click', function(e) {
                e.preventDefault();
                $(this).siblings('.submenu').toggleClass('active').slideToggle('400');
                $(this).toggleClass('open');
                imJs._html.css({
                    overflow: ''
                })
            });


            $('.nav-pills .nav-link').on('click', function(e) {
                $('.rn-popup-mobile-menu').removeClass('menu-open');
                imJs._html.css({
                    overflow: ''
                })
            })


        },

        awsActivation: function(e) {
            //AOS.init();
        },

    }
    imJs.m();


})(jQuery, window)

document.addEventListener('DOMContentLoaded', function() {
    const copyrightElement = document.getElementById('copyright');
    const currentYear = new Date().getFullYear();
    copyrightElement.textContent = ` 2022-${currentYear}`;

    // Add clipboard event listener
    document.addEventListener('copy', function(e) {
        const selection = document.getSelection();
        if (selection) {
            const text = selection.toString();
            // Remove zero-width characters
            const cleanText = text.replace(/[\u200B\u200C\u200D]/g, '');
            e.clipboardData.setData('text/plain', cleanText);
            e.preventDefault();
        }
    });
});