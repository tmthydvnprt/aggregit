/*globals $,console,d3,cookieJar,github */
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
    isIE = /*@cc_on!@*/false || !!document.documentMode,
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

$(document).ready(function () {
    'use strict';

    var cachedUser  = {
            "message" : "There is no user data. Return to http://aggregit.com to access a GitHub user first."
        },
        textFile = null;

    function makeJsonFile(obj) {
		var data = null,
            text = JSON.stringify(obj);
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
        $('#export-btn').attr('href', makeJsonFile(cachedUser));
        if (cachedUser.hasOwnProperty('login')) {
            $('#export-btn').attr('download', cachedUser['login'] + '.json');
            $('.filename').html(cachedUser['login'] + '.json');
        } else {
            $('#export-btn').attr('download', 'warning_no_user_data.json');
            $('.filename').html('warning_no_user_data.json');
        }
        $('#export-btn').removeClass('disabled');
        $('#export-btn').html('Export Data');
        $('#export-btn').attr('alt', 'Export Data');
    }

    // Unique Render functions
    // -------------------------------------------------------------------------------------
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

    function renderPunchCard(elem, data) {
        // reference: http://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337
        console.log('Rendering Punchcard');
        console.log('');

        // remove last plot if there
        d3.select("#punchcard-svg").remove();

        // setup parameters and variables
        var w = parseInt($(elem).width(), 10),
            h = parseInt(w / 3, 10),
            pad = 20,
            left_pad = 100,
            DAYS = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' '),
            svg = d3.select(elem)
                .append("svg")
                .attr("id", "punchcard-svg")
                .attr("width", w)
                .attr("height", h),
            x = d3.scale.linear().domain([0, 23]).range([left_pad, w - pad]),
            y = d3.scale.linear().domain([0, 6]).range([pad, h - pad * 2]),
            xAxis = d3.svg.axis().scale(x).orient("bottom")
                .ticks(24)
                .tickFormat(function (d) {
                    var m = (d > 12) ? 'p' : 'a';
                    d = (d % 12 === 0) ? 12 : (d % 12);
                    return d + m;
                }),
            yAxis = d3.svg.axis().scale(y).orient("left")
                .ticks(7)
                .tickFormat(function (d) {
                    return DAYS[d];
                }),
            max_r = d3.max(data.map(function (d) {
                return d[2];
            })),
            r = d3.scale.linear()
                .domain([0, d3.max(data, function (d) {
                    return d[2];
                })])
                .range([0, 12]),
            punchTooltip = d3.select("body")
                .append("div")
                .attr("id", "punchcard-tooltip")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .text("punchcard");

        // add axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0, " + (h - pad) + ")")
            .call(xAxis);
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (left_pad - pad) + ", 0)")
            .call(yAxis);

        // add loading text
        svg.append("text")
            .attr("class", "aggregitting")
            .text("aggregitting...")
            .attr("x", function () {
                return w / 2;
            })
            .attr("y", function () {
                return (h / 2) - 5;
            });

        // remove loading text
        svg.selectAll(".aggregitting").remove();

        // plot the data!
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "circle")
            .attr("cx", function (d) {
                return x(d[1]);
            })
            .attr("cy", function (d) {
                return y(d[0]);
            })
            .attr("r", function (d) {
                return 0;
            })
            .on("mouseover", function (d) {
                punchTooltip.html(d[2])
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 10) + "px");
                punchTooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
            })
            .on("mouseout", function (d) {
                punchTooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition(1000)
            .attr("r", function (d) {
                return r(d[2]);
            });

    }
    function renderParticipation(elem, data) {
        // reference: http://bl.ocks.org/mbostock/3884955
        console.log('Rendering Participation');
        console.log('');

        // remove last plot if there
        d3.select("#participation-svg").remove();

        // setup parameters and variables
        var w = parseInt($(elem).width(), 10),
            h = parseInt(w / 3, 10),
            pad = 20,
            bottom_pad = 40,
            left_pad = 100,
            participations,
            MAX_X = data.length,
            MAX_Y = d3.max(data.map(function (d) {
                return d3.max([d.owner, d.all]);
            })),
            color = d3.scale.category10(),
            lines,
            svg = d3.select(elem)
                .append("svg")
                .attr("id", "participation-svg")
                .attr("width", w)
                .attr("height", h),
            x = d3.scale.linear().domain([0, MAX_X - 1]).range([left_pad, w - pad]),
            y = d3.scale.linear()
                .domain([d3.max(data, function (d) {
                    return d3.max([d.owner, d.all]);
                }), 0])
                .range([pad, h - bottom_pad - pad]),
            line = d3.svg.line()
                .interpolate("basis")
                .x(function (d, i) {
                    return x(i);
                })
                .y(function (d, i) {
                    return y(d);
                }),
            xAxis = d3.svg.axis().scale(x).orient("bottom")
                .ticks(MAX_X)
                .tickFormat(function (d) {
                    return MAX_X - d;
                }),
            yAxis = d3.svg.axis().scale(y).orient("left"),
            partTooltip = d3.select("body")
                .append("div")
                .attr("id", "participation-tooltip")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .text("participation");

        // use object keys for series color domain
        color.domain(d3.keys(data[0]));

        // repackage data for plotting
        participations = color.domain().map(function (name) {
            return {
                name: name,
                values: data.map(function (d) {
                    return +d[name];
                })
            };
        });

        // add axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0, " + (h - bottom_pad) + ")")
            .call(xAxis);
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (left_pad - pad) + ", 0)")
            .call(yAxis);
        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", w - pad)
            .attr("y", h - 10)
            .text("time (# of weeks ago)");
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("x", -pad)
            .attr("y", pad)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("activity (# of commits)");
        // add loading text
        svg.append("text")
            .attr("class", "aggregitting")
            .text("aggregitting...")
            .attr("x", function () {
                return w / 2;
            })
            .attr("y", function () {
                return (h / 2) - 5;
            });

        // remove loading text
        svg.selectAll(".aggregitting").remove();

        // plot the data!
        lines = svg.selectAll(".participation")
            .data(participations)
            .enter()
            .append("g")
            .attr("class", "participation");

        lines.append("path")
            .attr("class", "line")
            .attr("d", function (d) {
                return line(d.values);
            })
            .style("stroke", function (d) {
                return color(d.name);
            });
    }
    function renderLanguages(elem, data) {
        // reference: http://bl.ocks.org/mbostock/3887193
        // reference: http://jsfiddle.net/Nw62g/1/
        console.log('Rendering Languages');
        console.log('');

        // remove last plot if there
        d3.select("#languages-svg").remove();
        d3.select("#languages-tooltip").remove();

        // setup parameters and variables
        var w = parseInt($(elem).width(), 10),
            h = parseInt(w / 3, 10),
            radius = Math.min(w, h) / 2,
            pad = 20,
            bottom_pad = 40,
            left_pad = 100,
            color = d3.scale.category10(),
            g,
            arc = d3.svg.arc()
                .outerRadius(0.98 * radius)
                .innerRadius(0.80 * radius),
            languages,
            MAX_kiB = Math.floor(d3.sum(d3.values(data)) / 10.24) / 100,
            MAX_LANG = d3.keys(data).length,
            pie = d3.layout.pie()
                .sort(null)
                .value(function (d) {
                    return d.kiB;
                }),
            svg = d3.select(elem)
                .append("svg")
                .attr("id", "languages-svg")
                .attr("width", w)
                .attr("height", h)
                .append("g")
                .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")"),

            langTooltip = d3.select(elem)
                .append("div")
                .attr("id", "languages-tooltip")
                .attr("class", "tooltip")
                .style("opacity", 1)
                .html('<strong>' + MAX_LANG + ' languages</strong><br>' + MAX_kiB + ' kiB');

        // use object keys for series color domain
        color.domain(d3.keys(data));

        // repackage data for plotting
        languages = color.domain().map(function (name) {
            return {
                language: name,
                kiB: Math.floor(data[name] / 10.24) / 100
            };
        });

        // add loading text
        svg.append("text")
            .attr("class", "aggregitting")
            .text("aggregitting...")
            .attr("x", function () {
                return w / 2;
            })
            .attr("y", function () {
                return (h / 2) - 5;
            });

        // remove loading text
        svg.selectAll(".aggregitting").remove();

        // plot the data!
        g = svg.selectAll(".arc")
            .data(pie(languages))
            .enter()
            .append("g")
            .attr("class", "arc");
        g.append("path")
            //.attr("d", arc)
            .style("fill", function (d) {
                return color(d.data.language);
            })
            .on("mouseover", function (d) {
                langTooltip.html('<strong>' + d.data.language + '</strong><br>' + d.data.kiB + ' kiB');
            })
            .on("mouseout", function (d) {
                langTooltip.html('<strong>' + MAX_LANG + ' languages</strong><br>' + MAX_kiB + ' kiB');
            })
            .transition()
            .delay(function (d, i) {
                return i * 256;
            })
            .duration(256)
            .attrTween('d', function (d) {
                var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                return function (t) {
                    d.endAngle = i(t);
                    return arc(d);
                };
            });

//        g.append("text")
//            .attr("transform", function(d) {
//                return "translate(" + arc.centroid(d) + ")";
//            })
//            .attr("dy", ".35em")
//            .style("text-anchor", "middle")
//            .text(function(d) {
//                return d.data.language;
//            });

    }

    function aggregatePunchCard(user) {

        var aggPunchCard = [],
            h = 0,
            d = 0,
            punchRepos = [];

        // fill empty punchcard
        for (d = 0; d < 7; d += 1) {
            for (h = 0; h < 24; h += 1) {
                aggPunchCard.push([d, h, 0]);
            }
        }

        //gather which repos to include
        $('#punchcard-checklist input:checked').each(function () {
            punchRepos.push($(this).attr('name'));
        });

        // aggregate punch card data
        console.log('Aggregating Punch Card:');
        user.repos.forEach(function (repo, i) {
            if ($.inArray(repo.name, punchRepos) > -1) {
                console.log('    ' + repo.name);
                repo.stats.punch_card.forEach(function (punch, i) {
                    aggPunchCard[i][2] += punch[2];
                });
            }
        });
        console.log('');
        renderPunchCard('#punchcard', aggPunchCard);
    }

    function aggregateParticipation(user) {
        var aggParticipation = [],
            d = 0,
            x = 0,
            z = 0,
            PARTICIPATION_SIZE = 52,
            punchRepos = [],
            owner = false,
            all = false,
            zoom = false;

        //gather which repos, time, and who to include
        $('#participation-checklist input:checked').each(function () {
            punchRepos.push($(this).attr('name'));
        });
        $('#ownerall-checklist input:checked').each(function () {
            owner = ($(this).attr('name') === 'owner') ? true : owner;
            all = ($(this).attr('name') === 'all') ? true : all;
        });
        zoom = $('#zoom-checklist input:checked').length > 0 ? true : zoom;

        // fill empty participation
        for (d = 0; d < PARTICIPATION_SIZE; d += 1) {
            x = {};
            if (owner) {
                x.owner = 0;
            }
            if (all) {
                x.all = 0;
            }
            aggParticipation.push(x);
        }

        // aggregate participation data
        console.log('Aggregating Participation:');
        user.repos.forEach(function (repo, i) {
            if ($.inArray(repo.name, punchRepos) > -1) {
                console.log('    ' + repo.name);
                for (d = 0; d < PARTICIPATION_SIZE; d += 1) {
                    if (owner) {
                        aggParticipation[d].owner += repo.stats.participation.owner[d];
                    }
                    if (all) {
                        aggParticipation[d].all += repo.stats.participation.all[d];
                    }
                }
            }
        });
        if (zoom) {
            for (z = 0; z < aggParticipation.length; z += 1) {
                if (aggParticipation[z].owner > 0 || aggParticipation[z].all > 0) {
                    aggParticipation = aggParticipation.slice(z);
                    break;
                }
            }
        }
        console.log('');
        renderParticipation('#participation', aggParticipation);
    }

    function aggregateLanguages(user) {
        var aggLanguages = [],
            punchRepos = [],
            language;

        //gather which repos, time, and who to include
        $('#languages-checklist input:checked').each(function () {
            punchRepos.push($(this).attr('name'));
        });

        // aggregate language data
        console.log('Aggregating Languages:');
        user.repos.forEach(function (repo, i) {
            var language;
            if ($.inArray(repo.name, punchRepos) > -1) {
                console.log('    ' + repo.name);
                for (language in repo.languages) {
                    if (repo.languages.hasOwnProperty(language)) {
                        if (aggLanguages.hasOwnProperty(language)) {
                            aggLanguages[language] += repo.languages[language];
                        } else {
                            aggLanguages[language] = repo.languages[language];
                        }
                    }
                }
            }
        });
        console.log('');
        renderLanguages('#languages', aggLanguages);
    }

    function renderUser(user, errors) {
        console.log('Caching User');

        cachedUser = $.extend(true, {}, user);
        console.log('Render the User');
        console.log('---------------------------------------------');
        // update the DOM
        if (errors) {
            console.log('Errors! Rate-limit');
            $('title').text('aggregit: error');

            $('#user-info').html(
                $('#error-template').html()
            );
        } else {
            var REPO_CHECKLIST_TEMPLATE = '<li><input {1} type="checkbox" name="{0}">{2}{0}</li>',
                repoChecklist = [];

            // format dates
            user.created_at = formatDate(new Date(user.created_at));
            user.updated_at = formatDate(new Date(user.updated_at));
            user.site_admin = user.site_admin ? '<i class="fa fa-fw fa-github-alt"></i> site admint' : '';
            user.hireable = user.hireable ? '<i class="fa fa-fw fa-check-circle"></i> hireable' : '';

            // add cached data button
            if ($('#cached-user').length === 0) {
                $('#nav-search .input-group').append(
                    '<span id="cached-user" class="input-group-addon"><a href="#!/user={0}" alt="{0}\'s data"><i class="fa fa-area-chart fa-2x"></i></a></span><span id="export-user" class="input-group-addon"><a href="#!/export" alt="Export {0}\'s data"><i class="fa fa-cloud-download fa-2x"></i></a></span>'.format(user.login)
                );
            }
            $('#cached-user').attr("href", "#!/user={0}".format(user.login));

            // update user info
            $('title').text('aggregit: ' + user.login);
            $('#username').val('');
            $('#username').attr('placeholder', user.login);
            $('#nav-user').attr('href', user.html_url);
            $('#nav-user').attr('title', "Go to User");
            $('#nav-user').attr('alt', "Go to User");
            $('#user-info').html(
                $('#user-info-template').html().format(user)
            );

            // update user data
            $('#user-data').html(
                $('#user-data-template').html().format(user)
            );

            // build repos selector
            user.repos.forEach(function (repo, i) {
                var check = (repo.fork) ? '' : 'checked=""',
                    fork = (repo.fork) ? '<i class="fa fa-code-fork text-info"></i> ' : '';
                repoChecklist.push(REPO_CHECKLIST_TEMPLATE.format(repo.name, check, fork));
            });

            // draw punchcard, and update when repo selector clicked
            $('#punchcard-checklist').html(repoChecklist.join(''));
            aggregatePunchCard(user);
            $('#punchcard-checklist input').click(function () {
                aggregatePunchCard(user);
            });

            // draw participation, and update when clicked
            $('#participation-checklist').html(repoChecklist.join(''));
            aggregateParticipation(user);
            $('#participation-checklist input').click(function () {
                aggregateParticipation(user);
            });
            $('#ownerall-checklist input').click(function () {
                aggregateParticipation(user);
            });
            $('#zoom-checklist input').click(function () {
                aggregateParticipation(user);
            });

            // draw languages, and update when repo selector clicked
            $('#languages-checklist').html(repoChecklist.join(''));
            aggregateLanguages(user);
            $('#languages-checklist input').click(function () {
                aggregateLanguages(user);
            });
        }
    }

    function authOn(valid_auth) {
        // change authentication status
        if (valid_auth) {
            $('#auth-icon i').removeClass('fa-times-circle');
            $('#auth-icon i').addClass('fa-check-circle');
            $('#auth-icon').addClass('authed');
            $('#auth-icon').attr('href', 'Nice!');
            $('#auth-icon').attr('alt', 'GitHub access is authorized!');
            $('#auth-icon').attr('title', 'GitHub access is authorized!');
        } else {
            $('#auth-icon i').removeClass('fa-check-circle');
            $('#auth-icon i').addClass('fa-times-circle');
            $('#auth-icon').removeClass('authed');
            $('#auth-icon').attr('href', '#!/authorize');
            $('#auth-icon').attr('alt', 'GitHub access is locked! You should authorize Aggregit for full experience.');
            $('#auth-icon').attr('title', 'GitHub access is locked! You should authorize Aggregit for full experience.');
        }
    }

    // page js
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
        // cookies
        lastvisit   = null,
        lastauth    = null,
        //this will store the scroll position
        keepScroll  = false,
        // store pages
        pages = {
            home : function () {
                renderTemplate(page, 'home', 'aggregit');
            },
            user : function (params) {
                // Check if auth is valid
                var auth = cookieJar.get('valid_auth'),
                // username fallback
                    username = params[0] || EXAMPLE_USERNAME,
                    unauth = (params.length > 0 || params[1] === 'unauth') ? true : false;
                // proceed as usual if authorized
                if (auth || unauth || username === EXAMPLE_USERNAME) {
                    console.log('Authorized! Aggregit User\n');
                    // start rendering page
                    renderTemplate(page, 'user', 'aggregit: ' + username);
                    // check if cached user exists
                    if (cachedUser && cachedUser.login === username) {
                        console.log('Using Cached User Data (already requested this)');
                        console.log('---------------------------------------------');
                        console.log('');
                        renderUser(cachedUser, '');
                    } else {
                        // decide what data to get
                        if (username === 'tmthydvnprt_example') {
                            console.log('Requesting Example User Data (local)');
                            console.log('---------------------------------------------');
                            console.log('');
                            $.getJSON('data/tmthydvnprt_example.json', function (user) {
                                renderUser(user, '');
                            });
                        } else {
                            // aggregit it all
                            $('#cached-user').remove();
                            $('#export-user').remove();
                            console.log('Requesting GitHub User Data');
                            console.log('---------------------------------------------');
                            console.log('');
                            getGitHubUser(username, renderUser);
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
            export : function () {
                renderTemplate(page, 'export', 'aggregit: export');
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

    function searchUser() {
        // get the form's first input
        var username = $(this[0]).val(),
            auth = cookieJar.get('valid_auth');
        cookieJar.set('searchUser', username);
        if (auth || username === EXAMPLE_USERNAME) {
            // route to user page
            console.log('Authorized Route to User\n');
            location.hash = '#!/user=' + username;
        } else {
            // route to authorize page
            console.log('NOT Authorized! Route to Authorize\n');
            location.hash = '#!/authorize';
        }
        return false;
    }

    // route hashchanges to page
    function router(e) {

        // clear last page stuff
        $('.help-pulse').removeClass('help-pulse');
        $('.holdoff-time').removeClass('holdoff-time');
        $('#nav-user').attr('href', "https://github.com");
        $('#nav-user').attr('title', "Go to GitHub");
        $('#nav-user').attr('alt', "Go to GitHub");

        // cache page, hash, and filename
        page = page || $('#page');
        hashparams = location.hash.slice(1).split('=');
        urlpath = location.pathname.split('/');
        filename = urlpath.slice(-1)[0] || 'index.html';
        hash = hashparams[0];
        params = hashparams[1];
        // split params if multiple
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
                    } else if (location.pathname === '/aggregit/') {
                        pages.home();
                    } else {
                        pages.unknown();
                    }

                    // setup page
                    page.addClass('rendered');
                    // on-page scroll links
                    $('a[href*="#"]').click(function () {
                        // stop auto scroll
                        keepScroll = document.body.scrollTop;
                    });
                    // bind enter clicks on input
                    $("#nav-search").submit(searchUser);
                    $("#home-search").submit(searchUser);

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
    if (cookieJar.has('valid_auth') && cookieJar.get('valid_auth') && !cookieJar.has('auth_user')) {
        console.log('Getting auth user data');
        github.get_current_user();
    } else {
        console.log('Not authorized or already have auth user data');
    }

    // listen for hash change or page load
    $(window).on('hashchange', router);
    $(window).on('load', router);
});
