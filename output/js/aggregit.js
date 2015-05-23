/*globals $,console*/
/*!
 * aggregit.js
 * 
 * Copyright 2015 Timothy Davenport; Licensed MIT
 */

$(document).ready(function () {
    'use strict';
    
    // Utility functions
	// -------------------------------------------------------------------------------------
    function isObject(a) {
        return (!!a) && (a.constructor === Object);
    }
    function copyBIfInA(a, b) {
        var key;
        a = $.extend(true, {}, a);
        for (key in a) {
            if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
                if (isObject(a[key]) && isObject(b[key])) {
                    a[key] = copyBIfInA(a[key], b[key]);
                } else {
                    a[key] = b[key];
                }
            }
        }
        return a;
    }

    // add string formatting
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var str = this.toString(),
                args,
                arg;
            if (!arguments.length) {
                return str;
            }
            args = typeof arguments[0];
            args = ("string" === args || "number" === args) ? arguments : arguments[0];
            for (arg in args) {
                if (args.hasOwnProperty(arg)) {
                    str = str.replace(new RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
                }
            }
            return str;
        };
    }
        
	// Unique functions
	// -------------------------------------------------------------------------------------
    function formatDate(d) {
        var MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
        return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }
    
    function renderTemplate(elem, name, titleText) {
		if (titleText) {
			$('title').html(titleText);
		} else {
			$('title').text(name);
		}
        console.log(name);
		elem.html($('#' + name + '-template').html());
		$(elem.children()[0]).attr('id', name);
	}
    
    function renderUser(user, errors) {
        // update the DOM
        if (errors) {
            $('title').text('aggregit: error');
            $('#username').text('Error');
            $('#user').html(errors.responseJSON.message);
        } else {
            
            user.created_at = formatDate(new Date(user.created_at));
            user.updated_at = formatDate(new Date(user.updated_at));
            
            $('title').text('aggregit: ' + user.login);
            $('#nav-user').attr('href', user.html_url);
            $('#user-info').html(
                $('#user-info-template').html().format(user)
            );
            $('#user-data').html(
                $('#user-data-template').html().format(user)
            );
        }
    }

    function getGitHubUser(username, callback) {
        var API_URL = 'https://api.github.com/users/',
            REPO_STATS_URLS = ['contributors', 'commit_activity', 'code_frequency', 'participation', 'punch_card'],
            user = {
                "login": "",
                "id": 0,
                "avatar_url": "",
                "html_url": "",
                "repos": [],
                "type": "",
                "site_admin": false,
                "name": "",
                "company": "",
                "blog": "",
                "location": "",
                "email": "",
                "hireable": false,
                "bio": null,
                "public_repos": 0,
                "public_gists": 0,
                "followers": 0,
                "following": 0,
                "created_at": null,
                "updated_at": null
            },
            repo = {
                "id": 0,
                "name": "",
                "full_name": "",
                "owner": {"login": ""},
                "private": false,
                "html_url": "",
                "description": "",
                "fork": false,
                "created_at": null,
                "updated_at": null,
                "pushed_at": null,
                "homepage": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": "",
                "languages": {},
                "stats" : {},
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": true,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": ""
            };
                
        function getUser(username) {
            return $.getJSON(API_URL + username);
        }

        function getRepos(repos_url) {
            return $.getJSON(repos_url);
        }

        // get the user
        $.when(getUser(username)).done(function (userData) {
            var key;
            
            // grab only the data we need
            user = copyBIfInA(user, userData);
            
            // get the repos
            $.when(getRepos(userData.repos_url)).done(function (reposData) {
                var getJsonArray = [],
                    langHash = {},
                    statsHash = {};
                
                function getRepoLangs(languagesUrl, index) {
                    return $.getJSON(languagesUrl, function (language) {
                        langHash[index] = language;
                    });
                }
                function getRepoStats(statUrl, index, stat) {
                    return $.getJSON(statUrl, function (stats) {
                        statsHash[index][stat] = stats;
                    });
                }
                
                // loop thru the repos
                reposData.forEach(function (repoData, i) {
                    var key = '',
                        tempRepo = {};
                
                    // grab only the data we need
                    tempRepo = copyBIfInA(repo, repoData);
                                        
                    // add the repo to the user
                    user.repos[i] = $.extend(true, {}, tempRepo);
                    
                    //get the languages
                    getJsonArray.push(getRepoLangs(repoData.languages_url, i));
                    REPO_STATS_URLS.forEach(function (stat) {
                        statsHash[i] = {};
                        getJsonArray.push(getRepoStats(repoData.url + '/stats/' + stat, i, stat));
                    });
                    
                });
                                                
                // wait until all the json requests are done
                $.when.apply($, getJsonArray).done(function (response) {
                    console.log('done');
                    console.log(response);
                    var index,
                        stat;
                    // add languages to repos
                    for (index in langHash) {
                        if (langHash.hasOwnProperty(index)) {
                            user.repos[index].languages = langHash[index];
                        }
                    }
                    // add stats to repos
                    for (index in statsHash) {
                        if (statsHash.hasOwnProperty(index)) {
                            for (stat in statsHash[index]) {
                                if (statsHash[index].hasOwnProperty(stat)) {
                                    user.repos[index].stats[stat] = statsHash[index][stat];
                                }
                            }
                        }
                    }
                }).fail(function (response) {
                    console.log('fail');
                    console.log(response);
                    
                }).always(function (response) {
                    console.log('always');
                    console.log(response);
                    // ALL DONE!
                    return callback(user, '');
                });
            }).fail(function (response) {
                console.log(response);
                callback(user, response);
            });
        }).fail(function (response) {
            console.log(response);
            callback(user, response);
        });
    }
    
    // page js
    // -------------------------------------------------------------------------------------
    var page              = $('#page'),
        hashparams        = [],
        hash              = '',
        params            = '',
        urlpath           = '',
        filename          = '',
        newlocation       = '',
        initHoldOff       = 0,
        bringOut          = 0,
        
        //this will store the scroll position
        keepScroll        = false,
        // store pages
        pages = {
            home : function () {
                renderTemplate(page, 'home', 'aggregit');
            },
            user : function (username) {
                var hardcode = true;
                // aggregit it all
                username = username || 'tmthydvnprt';
                renderTemplate(page, 'user', 'aggregit: ' + username);
                if (hardcode) {
                    $.getJSON('data/user.json', function (user) {
                        renderUser(user, '');
                    });
                } else {
                    getGitHubUser(username, renderUser);
                }
            },
            about : function () {
                renderTemplate(page, 'about', 'aggregit: about');
            }
        };
    
	// route hashchanges to page
	function router(e) {
        		
        // clear last page stuff
		$('.holdoff-time').removeClass('holdoff-time');

		// cache page, hash, and filename
		page = page || $('#page');
		hashparams = location.hash.slice(1).split('=');
        urlpath = location.pathname.split('/');
        filename = urlpath.slice(-1)[0];
        hash = hashparams[0];
        params = hashparams[1];
        
        console.log('page    : ' + page);
        console.log('hash    : ' + hash);
        console.log('params  : ' + params);
        console.log('urlpath : ' + urlpath);
        console.log('filename: ' + filename);
        
        // index page with internal hash routing
        if (filename === 'index.html') {
            
            // default to home if on index page
            hash = hash || '!/home';
            
            // on-page hash
            if (hash.slice(0, 2) === '!/') {
                
                // zoom to the top
                $('html,body').animate({
                    scrollTop: 0
                }, 300);
                
                // animate out
                $('#page section').addClass('bringOut');

                // wait until animation it done
                bringOut = setTimeout(function () {
                    page.removeClass('rendered');
                    page.addClass('routing');

                    // route to new page
                    hash = hash.slice(2);
                    if (pages.hasOwnProperty(hash)) {
                        pages[hash](params);
                    } else {
                        pages.home();
                    }

                    // setup page
                    page.addClass('rendered');
                    // on-page scroll links
                    $('a[href*="#"]').click(function () {
                        // stop auto scroll
                        keepScroll = document.body.scrollTop;
                    });
                    // band enter clicks on input
                    $("input").on("keydown", function (e) {
                        if (e.keyCode === 13) {
                            var username = $(this).val();
                            e.preventDefault();
                            console.log(username);
                            location.hash = '#!/user=' + username;
                            router();
                        }
                    });

                    clearInterval(bringOut);
                }, 500);

            // on-page hash
            } else if (hash) {
                if (keepScroll !== false) {
                    //move scroll position to stored position
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
        // if on any other page
        } else {
            // add index to hashrouting
            if (hash.slice(0, 2) === '!/') {
                urlpath[urlpath.length - 1] = "index.html";
                newlocation = urlpath.join("/") + location.hash;
                location.assign(newlocation);
            } else {
                console.log('do nothing');
            }
        }
        
        return false;
	}
    
	initHoldOff = setTimeout(function () {
		$('.holdoff').removeClass('holdoff');
		clearTimeout(initHoldOff);
	}, 256);

	// listen for hash change or page load
	$(window).on('hashchange', router);
	$(window).on('load', router);
});