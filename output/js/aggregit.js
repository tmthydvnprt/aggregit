/*globals $,console,d3,cookieJar */
/*!
 * aggregit.js
 *
 * Copyright 2015 Timothy Davenport; Licensed MIT
 */
$(document).ready(function () {
    'use strict';

    var cachedUser  = null;

    var github_oauth_url = 'https://github.com/login/oauth/authorize?',
        github_id = '85bd6112f2a60a7edd66',
        github_callback = 'http://aggregit.com/a',
        github_scope = '',
        oauth_proxy_url = 'http://aggregit-proxy-576273.appspot.com/?';

    function deparam(string) {
        var params = {},
            pair,
            i;
        // Remove url portion of string
        string = string.substring(string.indexOf('?') + 1).split('&');
        // Parse
        for (i = string.length; i > 0;) {
            pair = string[--i].split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return params;
    }

    function github_authorize() {
        var url = '',
            state = Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8);

        // store state in cookie for later
        cookieJar.set('state', state);

        // Create url to access GitHub authentication
        url = github_oauth_url + $.param({
            'client_id' : github_id,
            'redirect_url' : github_callback,
            'scope' : github_scope,
            'state' : state
        });

        // Request authorization
        console.log(url);
        location.href = url;
    }

    function github_authenticate() {
        // Get GitHub authentication from redirected url
        var auth = deparam(window.location.search),
            url = '';
        // Check that state is valid
        if (cookieJar.get('state') === auth['state'] ) {
            console.log('state is good');
            // Turn authorization code into access token
            url = oauth_proxy_url + $.param(auth);
            $.getJSON(url, function(access) {
                console.log(access);
                if (access.hasOwnProperty('access_token')) {
                    cookieJar.set('access_token', access['access_token']);
                } else {
                    console.log('no token: proxy error');
                }
            });
        } else {
            console.log('state is bad');
            // should abort
        }

    }

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
    // clena url to use a key
    function unurl(url) {
        return url.replace(/\//ig, '_');
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
        var w = 940,
            h = 300,
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
        var w = 940,
            h = 300,
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
        var w = 627,
            h = 300,
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
                    '<span id="cached-user" class="input-group-addon"><a href="#!/user={0}" alt="User Data" title="User Data"><i class="fa fa-area-chart fa-2x"></i></a></span>'.format(user.login)
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

    function getGitHubUser(username, callback) {
        var USERS_API_URL = 'https://api.github.com/users',
            REPOS_API_URL = 'https://api.github.com/repos',
            TOKEN = cookieJar.has('access_token') ? '?access_token=' + cookieJar.get('access_token') : '',
            REPO_STATS_URLS = ['contributors', 'commit_activity', 'code_frequency', 'participation', 'punch_card'],
            HOUR_IN_MS = 60 * 60 * 1000,
            api_calls = 0,
            user = {
                "login": "",
                "id": 0,
                "avatar_url": "",
                "html_url": "",
                "site_admin": false,
                "name": "",
                "company": "",
                "blog": "",
                "location": "",
                "email": "",
                "hireable": false,
                "public_repos": 0,
                "public_gists": 0,
                "followers": 0,
                "following": 0,
                "created_at": null,
                "updated_at": null,
                "is_cookie" : false
            },
            repo = {
                "name": "",
                "owner": {"login": ""},
//                "html_url": "",
                "description": "",
                "fork": false,
                "created_at": null,
                "updated_at": null,
                "pushed_at": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "has_pages": true,
                "forks_count": 0,
                "open_issues_count": 0,
                "is_cookie" : false
            },
            repos = [];

        function getUser(username) {
            var userCookie = null,
                userData = null,
                dfUser =  null,
                blank =  null,
                userKey = unurl(username);

            // check if cookies exists for username
            if (cookieJar.has(userKey)) {
                userCookie = JSON.parse(cookieJar.get(userKey));
                // check if it is over an hour old
                if ((new Date() - new Date(userCookie.time)) < HOUR_IN_MS) {
                    userData = userCookie.data;
                }
            }
            // only look up data if it is old or if we ran out of api calls
            if (userData || api_calls > 60) {
                // create a deferred object so we can use
                // the same interface for cookie data as api data
                dfUser = $.Deferred();
                if (userData) {
                    console.log('using cookie: {0}'.format(userKey));
                    dfUser.resolve(userData);
                } else {
                    console.log('TOO MANY api calls: {0}'.format(api_calls));
                    blank = $.extend(true, {}, user);
                    dfUser.resolve(blank);
                }
                return dfUser;
            } else {
                api_calls += 1;
                console.log('({0}) making request: {1}'.format(api_calls, username));
                return $.getJSON([USERS_API_URL, username].join('/') + TOKEN);
            }
        }

        function getRepos(username) {
            var reposCookie = null,
                reposData = null,
                dfRepos =  null,
                blank =  null,
                repos_url = [USERS_API_URL, username, 'repos'].join('/') + TOKEN;

            // check if cookies exists for username
            if (cookieJar.has(repos_url)) {
                reposCookie = JSON.parse(cookieJar.get(repos_url));
                // check if it is over an hour old
                if ((new Date() - new Date(reposCookie.time)) < HOUR_IN_MS) {
                    reposData = reposCookie.data;
                }
            }
            // only look up data if it is old or if we ran out of api calls
            if (reposData || api_calls > 59) {
                // create a deferred object so we can use
                // the same interface for cookie data as api data
                dfRepos = $.Deferred();
                if (reposData) {
                    console.log('using cookie: {0}'.format(repos_url));
                    dfRepos.resolve(reposData);
                } else {
                    console.log('TOO MANY api calls: {0}'.format(api_calls));
                    blank = $.extend(true, {}, repo);
                    dfRepos.resolve([blank]);
                }
                return dfRepos;
            } else {
                api_calls += 1;
                console.log('({0}) making request: {1}'.format(api_calls, repos_url));
                return $.getJSON(repos_url);
            }
        }

        // get the user
        $.when(getUser(username)).done(function (userData) {
            var key = '',
                userCookie = null,
                storeResponse = false,
                cookieString = '';

            // grab only the data we need
            user = copyBIfInA(user, userData);

            // if api data, store as cookie
            if (!user.is_cookie) {
                // add flag and package up together with time
                user.is_cookie = true;
                userCookie = {
                    'data' : user,
                    'time' : new Date()
                };
                // store
                cookieString = JSON.stringify(userCookie);
                storeResponse = cookieJar.set(user.login, cookieString);
                if (storeResponse) {
                    console.log('request done, storing cookie: {0}'.format(user.login));
                } else {
                    console.log('TROUBLE storing cookie: {0}'.format(user.login));
                }
            }

            // get the repos
            $.when(getRepos(userData.login)).done(function (reposData) {
                var reposCookie = null,
                    getJsonArray = [],
                    langHash = {},
                    statsHash = {},
                    storeResponse = false,
                    repos_url = [USERS_API_URL, username, 'repos'].join('/') + TOKEN,
                    cookieString = '',
                    r = 0;

                // loop thru the repos
                reposData.forEach(function (repoData, i) {
                    // grab only the data we need
                    repos.push(copyBIfInA(repo, repoData));
                });

                // if api data, store as cookie
                if (!repos[0].is_cookie) {
                    // add flag and package up together with time
                    for (r = 0; r < repos.length; r += 1) {
                        repos[r].is_cookie = true;
                    }
                    reposCookie = {
                        'data' : repos,
                        'time' : new Date()
                    };
                    console.log(reposCookie);
                    // store
                    cookieString = JSON.stringify(reposCookie);
                    storeResponse = cookieJar.set(repos_url, cookieString);
                    if (storeResponse) {
                        console.log('request done, storing cookie: {0}'.format(repos_url));
                        console.log(cookieString.length);
                        console.log(cookieString);
                    } else {
                        console.log('TROUBLE storing cookie: {0}'.format(repos_url));
                        console.log(cookieString.length);
                        console.log(cookieString);
                    }
                }

                function getRepoLangs(languagesUrl, index) {
                    api_calls += 1;
                    console.log('({0}) making request: {1}'.format(api_calls, languagesUrl));
                    return $.getJSON(languagesUrl, function (language) {
                        langHash[index] = language;
                    });
                }
                function getRepoStats(statUrl, index, stat) {
                    api_calls += 1;
                    console.log('({0}) making request: {1}'.format(api_calls, statUrl));
                    return $.getJSON(statUrl, function (stats) {
                        statsHash[index][stat] = stats;
                    });
                }

                user.repos = [];
                // loop thru the repos
                repos.forEach(function (repoData, i) {
                    var key = '',
                        repo_url = [REPOS_API_URL, username, repoData.name].join('/');

                    // add the repo to the user
                    user.repos[i] = repoData;

                    //get the languages and stats
                    getJsonArray.push(getRepoLangs([repo_url, 'languages'].join('/') + TOKEN, i));
                    REPO_STATS_URLS.forEach(function (stat) {
                        statsHash[i] = {};
                        getJsonArray.push(getRepoStats([repo_url, 'stats', stat].join('/') + TOKEN, i, stat));
                    });

                });

                // wait until all the json requests are done
                $.when.apply($, getJsonArray).done(function (response) {
                    console.log('languages and stats request done');
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
                            user.repos[index].stats = {};
                            for (stat in statsHash[index]) {
                                if (statsHash[index].hasOwnProperty(stat)) {
                                    user.repos[index].stats[stat] = statsHash[index][stat];
                                }
                            }
                        }
                    }
                }).fail(function (response) {
                    console.log('languages or stats request failed');

                }).always(function (response) {
                    console.log('all requests done!');
                    console.log('caching results');
                    cachedUser = $.extend(true, {}, user);
                    cookieJar.cookies().forEach(function (name) {
                        var time = '',
                            cookie = cookieJar.get(name);
                        try {
                            time = new Date(JSON.parse(cookie).time);
                        } catch (e) {
                            time = cookie;
                        }
                        console.log('    {0}: {1}'.format(name, time));
                    });
                    console.log('');
                    // ALL DONE!
                    return callback(user, '');
                });
            }).fail(function (response) {
                console.log('repos request failed');
                callback(user, response);
            });
        }).fail(function (response) {
            console.log('user request failed');
            callback(user, response);
        });
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
        // cookies
        lastvisit   = null,
        //this will store the scroll position
        keepScroll  = false,
        // store pages
        pages = {
            home : function () {
                renderTemplate(page, 'home', 'aggregit');
            },
            user : function (username) {
                // username fallback
                username = username || 'tmthydvnprt_example';
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
                        console.log('Requesting GitHub User Data');
                        console.log('---------------------------------------------');
                        console.log('');
                        getGitHubUser(username, renderUser);
                    }
                }
            },
            authorize : function () {
                renderTemplate(page, 'authorize', 'aggregit: authorize');
                $('#authorize-btn').click(function (e) {
                    github_authorize();
                });
            },
            about : function () {
                renderTemplate(page, 'about', 'aggregit: about');
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

    // $('#authenticate').click(function (e) {
    //     github_authenticate();
    // });

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
                    $("#nav-search").submit(function () {
                        var username = $('#nav-search-user').val();
                        location.hash = '#!/user=' + username;

                        return false;
                    });
                    $("#home-search").submit(function () {
                        var username = $('#home-search-user').val();
                        location.hash = '#!/user=' + username;

                        return false;
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
        console.log('welcome');
        console.log('');
    } else {
        lastvisit = cookieJar.get('visit');
        console.log('welcome back, your last visit was ' + lastvisit);
        console.log('');
        console.log('these are your stored cookie:');
        cookieJar.cookies().forEach(function (name) {
            var time = '',
                cookie = cookieJar.get(name);
            try {
                time = new Date(JSON.parse(cookie).time);
            } catch (e) {
                time = cookie;
            }
            console.log('    {0}: {1}'.format(name, time));
        });
        console.log('');

    }

    // listen for hash change or page load
    $(window).on('hashchange', router);
    $(window).on('load', router);
});
