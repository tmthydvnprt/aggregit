/*globals $,console,d3,cookieJar,formatDate,github,aggregitor,opr,InstallTrigger,Blob,renderTemplate,renderUser */
/*!
 * aggregit.js
 *
 * Copyright 2015 Timothy Davenport; Licensed MIT
 */
var FIVE_MIN_IN_MS = 5 * 60 * 1000,
    EXAMPLE_USERNAME = 'tmthydvnprt_example',
    // Opera 8.0+
    isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,
    // Firefox 1.0+
    isFirefox = typeof InstallTrigger !== 'undefined',
    // At least Safari 3+: "[object HTMLElementConstructor]"
    isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    // Internet Explorer 6-11
    isIE = !!document.documentMode,
    // Edge 20+
    isEdge = !isIE && !!window.StyleMedia,
    // Chrome 1+
    isChrome = !!window.chrome && !!window.chrome.webstore,
    // Blink engine detection
    isBlink = (isChrome || isOpera) && !!window.CSS;

console.log('Is Opera: ' + isOpera);
console.log('Is FireFox: ' + isFirefox);
console.log('Is Safari: ' + isSafari);
console.log('Is IE: ' + isIE);
console.log('Is Edge: ' + isEdge);
console.log('Is Chrome: ' + isChrome);
console.log('Is Blink: ' + isBlink);

function updateBar(value, max, text) {
    'use strict';
    var percent = 100.0 * value / max;
    $('.progress-bar').attr('aria-valuenow', value);
    $('.progress-bar').attr('aria-valuemax', max);
    $('.progress-bar').attr('style', 'width: ' + percent + '%;');
    $('.progress-bar').html(text);
}

$(document).ready(function () {
    'use strict';

    function renderTemplate(elem, name, titleText) {
        if (titleText) {
            $('title').html(titleText);
        } else {
            $('title').text(name);
        }
        console.log('Rendering Page: ' + name);
        console.log('');
        elem.html($('#' + name + '-template').html());
        $(elem.children()[0]).attr('id', name);
    }

    function makeJsonFile(obj) {
        var data = null,
            text = JSON.stringify(obj),
            textFile = null;
        if (isSafari) {
            textFile = 'data:application/text;charset=utf-8,' + encodeURIComponent(text);
        } else {
            data = new Blob([text], {type: 'text/json'});
            if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
            }
            textFile = window.URL.createObjectURL(data);
        }
        return textFile;
    }

    function exportUser() {
        // Display safari warning
        if (isSafari) {
            $('.panel-body').append('<div id="safari-warning" class="alert alert-warning"><p class="smallprint"><strong><i class="fa fa-warning"></i> It looks like you are using Safari.</strong><br>The file will be downloaded from a blank page and named <code>Unknown</code>. You may close the blank page once the file appears in your <code>~/Downloads</code> Folder. You should rename this file to <code class="filename">____.json</code>.</p></div>');
        } else {
            $('#safari-warning').remove();
        }

        // Download/export user data as json
        $('#export-btn').attr('href', makeJsonFile(github.data.user));
        if (github.data.user.hasOwnProperty('login')) {
            $('#export-btn').attr('download', github.data.user.login + '.json');
            $('.filename').html(github.data.user.login + '.json');
        } else {
            $('#export-btn').attr('download', 'warning_no_user_data.json');
            $('.filename').html('warning_no_user_data.json');
        }
        $('#export-btn').removeClass('disabled');
        $('#export-btn').html('Export Data');
        $('#export-btn').attr('alt', 'Export Data');
    }

    function authOn(valid_auth) {
        // Change authentication status
        if (valid_auth) {
            $('#auth-icon i').removeClass('fa-times-circle');
            $('#auth-icon i').addClass('fa-check-circle');
            $('#auth-icon').addClass('authed');
            $('#auth-icon').attr('href', 'Nice!');
            $('#auth-icon').attr('alt', 'GitHub access is authorized!');
            $('#auth-icon').attr('title', 'GitHub access is authorized!');
            // Recheck auth user data
            github.get_current_user();
        } else {
            $('#auth-icon i').removeClass('fa-check-circle');
            $('#auth-icon i').addClass('fa-times-circle');
            $('#auth-icon').removeClass('authed');
            $('#auth-icon').attr('href', '#!/authorize');
            $('#auth-icon').attr('alt', 'GitHub access is locked! You should authorize Aggregit for full experience.');
            $('#auth-icon').attr('title', 'GitHub access is locked! You should authorize Aggregit for full experience.');
        }
    }

    // Page js
    // -------------------------------------------------------------------------------------
    var page        = $('#page'),
        hashparams  = [],
        hash        = '',
        params      = '',
        urlpath     = '',
        filename    = '',
        newlocation = '',
        initHoldOff = 0,
        bringOut    = 0,
        now         = null,
        // Cookies
        lastvisit   = null,
        lastauth    = null,
        // This will store the scroll position
        keepScroll  = false,
        // Store pages
        pages = {
            home : function () {
                renderTemplate(page, 'home', 'aggregit');
            },
            user : function (params) {
                // Check if auth is valid
                var auth = cookieJar.get('valid_auth'),
                // Username fallback
                    username = (params && params[0]) || EXAMPLE_USERNAME,
                    unauth = (params && (params.length > 1 || params[1] === 'unauth')) ? true : false;
                // Proceed as usual if authorized
                if (auth || unauth || username === EXAMPLE_USERNAME) {
                    console.log('Authorized! Aggregit User\n');
                    // Start rendering page
                    renderTemplate(page, 'user', 'aggregit: ' + username);
                    // Decide what data to get
                    if (username === 'tmthydvnprt_example') {
                        console.log('Requesting Example User Data (local)');
                        console.log('---------------------------------------------');
                        console.log('');
                        $.getJSON('data/tmthydvnprt_example.json', function (user) {
                            renderUser(user, '');
                        });
                    } else {
                        // Check if cached user exists
                        if (github.data.user && github.data.user.login === username) {
                            console.log('Using Cached User Data (already requested this)');
                            console.log('---------------------------------------------');
                            console.log('');
                            renderUser(github.data.user, '');
                        } else {
                            // Aggregit it all
                            $('#cached-user').remove();
                            $('#export-user').remove();
                            console.log('Requesting GitHub User Data');
                            console.log('---------------------------------------------');
                            console.log('');
                            // Clear history for this access
                            github.calls = 0;
                            // Bind action to update progress bar
                            $(document).bind('ajaxComplete', function (e) {
                                var val = github.calls,
                                    max = github.total_calls,
                                    percent = 0;
                                percent = 100.0 * val / max;
                                updateBar(val, max, String(Math.round(100.0 *  percent) / 100) + '%');
                            });
                            // Get all the user's data from GitHub
                            github.get_all_user_data(username, renderUser);
                        }
                    }
                // Store searched username and go get authorization if auth is not valid
                } else {
                    console.log('NOT Authorized! Route to Authorize first\n');
                    cookieJar.set('searchUser', username);
                    location.hash = '#!/authorize';
                    return false;
                }
            },
            authorize : function () {
                renderTemplate(page, 'authorize', 'aggregit: authorize');
                $('#unauthorized').attr('href', '#!/user=' + cookieJar.get('searchUser') + '&unauth');
                $('#authorize-btn').click(function (e) {
                    github.authorize();
                });
            },
            authenticate : function () {
                renderTemplate(page, 'authenticate', 'aggregit: authenticate');
                // Check if this is am authentication redirect from GitHub
                if (location.search.indexOf('code') > -1) {
                    console.log('github redirect, create access token.');
                    github.authenticate();
                } else {
                    console.log('missing authorization code.');
                }
            },
            about : function () {
                renderTemplate(page, 'about', 'aggregit: about');
            },
            exportuser : function () {
                renderTemplate(page, 'exportuser', 'aggregit: export user');
                exportUser();
            },
            help : function () {
                renderTemplate(page, 'help', 'aggregit: help');
                $('#nav-search .input-group-addon, #nav-search .form-control').addClass('help-pulse');
            },
            contact : function () {
                renderTemplate(page, 'contact', 'aggregit: contact');
            },
            unknown : function () {
                renderTemplate(page, 'unknown', 'aggregit: unknown?');
            }
        };

    function searchUser(e) {
        // Get the form's first input
        var username = $(e.target[0]).val(),
            auth = cookieJar.get('valid_auth');
        cookieJar.set('searchUser', username);
        if (auth || username === EXAMPLE_USERNAME) {
            // Route to user page
            console.log('Authorized Route to User\n');
            location.hash = '#!/user=' + username;
        } else {
            // Route to authorize page
            console.log('NOT Authorized! Route to Authorize\n');
            location.hash = '#!/authorize';
        }
        return false;
    }

    // Route hashchanges to page
    function router(e) {

        // Clear last page stuff
        $('.help-pulse').removeClass('help-pulse');
        $('.holdoff-time').removeClass('holdoff-time');
        $('#nav-user').attr('href', "https://github.com");
        $('#nav-user').attr('title', "Go to GitHub");
        $('#nav-user').attr('alt', "Go to GitHub");

        // Cache page, hash, and filename
        page = page || $('#page');
        hashparams = location.hash.slice(1).split('=');
        urlpath = location.pathname.split('/');
        filename = urlpath.slice(-1)[0] || 'index.html';
        hash = hashparams[0];
        params = hashparams[1];
        // Split params if multiple
        if (params) {
            params = params.split('&');
        }

        console.log('Routing');
        console.log('-----------------------------------------');
        console.log('    urlpath : ' + urlpath);
        console.log('    filename: ' + filename);
        console.log('    hash    : ' + hash);
        console.log('    params  : ' + params);
        console.log('');

        // Index page with internal hash routing
        if (filename === 'index.html') {

            // Default to home if on index page
            hash = hash || '!/home';

            // On-page hash
            if (hash.slice(0, 2) === '!/') {

                // Zoom to the top
                $('html,body').animate({
                    scrollTop: 0
                }, 300);

                // Animate out
                $('#page section').addClass('bringOut');

                // Wait until animation it done
                bringOut = setTimeout(function () {
                    page.removeClass('rendered');
                    page.addClass('routing');

                    // Route to new page
                    hash = hash.slice(2);
                    if (pages.hasOwnProperty(hash)) {
                        pages[hash](params);
                    } else if (location.pathname === '/aggregit/') {
                        pages.home();
                    } else {
                        pages.unknown();
                    }

                    // Setup page
                    page.addClass('rendered');
                    // On-page scroll links
                    $('a[href*="#"]').click(function () {
                        // Stop auto scroll
                        keepScroll = document.body.scrollTop;
                    });
                    // Bind enter clicks on input
                    $("#nav-search").submit(searchUser);
                    $("#home-search").submit(searchUser);

                    clearInterval(bringOut);
                }, 500);

            // On-page hash
            } else if (hash) {
                if (keepScroll !== false) {
                    // Move scroll position to stored position
                    document.body.scrollTop = keepScroll;
                    keepScroll = false;
                }
                var target = $('#' + hash);
                target = target.length ? target : $('[name=' + hash + ']');
                if (target.length) {
                    $('html,body').animate({
                        scrollTop: target.offset().top - 60
                    }, 512);
                }
            }
        // If on any other page
        } else {
            // Add index to hashrouting
            if (hash.slice(0, 2) === '!/') {
                urlpath[urlpath.length - 1] = "index.html";
                newlocation = urlpath.join("/") + location.hash;
                location.assign(newlocation);
            } else {
                console.log('routed nowhere?');
            }
        }

        return false;
    }

    initHoldOff = setTimeout(function () {
        $('.holdoff').removeClass('holdoff');
        clearTimeout(initHoldOff);
    }, 256);

    if (!cookieJar.has('lastvisit')) {
        lastvisit = (new Date()).toISOString();
        cookieJar.set('lastvisit', lastvisit);
        console.log('Welcome');
        console.log('');
        // Check Authentication
        github.check_authentication(authOn);

    } else {
        lastvisit = cookieJar.get('lastvisit');
        console.log('Welcome back, your last visit was ' + lastvisit);
        console.log('');

        // Check Authentication if last auth was more that five minutes ago
        if (cookieJar.has('auth_time') && cookieJar.has('access_token')) {
            now = new Date();
            lastauth = new Date(cookieJar.get('auth_time'));
            if ((now - lastauth) > FIVE_MIN_IN_MS) {
                github.check_authentication(authOn);
            } else {
                console.log('Authenticated within the last 5 minutes.');
                authOn(true);
            }
        } else {
            github.check_authentication(authOn);
        }

        // Identify Cookies
        console.log('These are your stored cookie:');
        cookieJar.cookies().forEach(function (name) {
            var cookie = cookieJar.get(name);
            console.log('    {0}: {1}'.format(name, cookie));
        });
        console.log('');
    }

    // Get auth user data if it doesn't exist
    // This is placed here to catch a newly authenticated user coming back from a github redirect to a new page (all object re initialiazed, only have cookies)
    if (cookieJar.has('valid_auth') && cookieJar.get('valid_auth') && !cookieJar.has('auth_user')) {
        console.log('Getting auth user data');
        github.get_current_user();
    } else {
        console.log('Not authorized or already have auth user data');
    }

    // Listen for hash change or page load
    $(window).on('hashchange', router);
    $(window).on('load', router);
});
