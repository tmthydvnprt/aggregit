/*globals $,console,d3 */
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
    
    function renderPunchCard(elem, data) {
        // reference: http://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337
        console.log('punchcard');
        
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
            .on("mouseover", function(d) {      
                punchTooltip.html(d[2])  
                    .style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 10) + "px");    
                punchTooltip.transition()        
                    .duration(200)      
                    .style("opacity", 0.9);      
            })            
            .on("mouseout", function(d) {       
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
        console.log('participation');
        
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
            line = d3.svg.line()
                .interpolate("basis")
                .x(function(d, i) {
                    return x(i);
                })
                .y(function(d, i) {
                    return y(d);
                }),
            svg = d3.select(elem)
                .append("svg")
                .attr("id", "participation-svg")
                .attr("width", w)
                .attr("height", h),
            x = d3.scale.linear().domain([0, MAX_X-1]).range([left_pad, w - pad]),
            y = d3.scale.linear().domain([d3.max(data, function (d) {
                        return d3.max([d.owner, d.all]);
                    }), 0]).range([pad, h - bottom_pad - pad]),
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
        participations = color.domain().map(function(name) {
            return {
                name: name,
                values: data.map(function(d) {
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
            .attr("d", function(d) {
                return line(d.values);
            })
            .style("stroke", function(d) {
                return color(d.name);
            });
    }
    function renderLanguages(elem, data) {
        // reference: http://bl.ocks.org/mbostock/3887193
        // reference: http://jsfiddle.net/Nw62g/1/ 
        console.log('languages');
        
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
                .value(function(d) {
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
        languages = color.domain().map(function(name) {
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
            .style("fill", function(d) {
                return color(d.data.language);
            })
            .on("mouseover", function(d) {      
                langTooltip.html('<strong>' + d.data.language + '</strong><br>' + d.data.kiB + ' kiB');      
            })            
            .on("mouseout", function(d) {     
                langTooltip.html('<strong>' + MAX_LANG + ' languages</strong><br>' + MAX_kiB + ' kiB');     
            })
            .transition()
            .delay(function(d, i) {
                return i * 256;
            })
            .duration(256)
            .attrTween('d', function(d) {
                var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                    return function(t) {
                        d.endAngle = i(t);
                        return arc(d);
                    }
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
        $('#punchcard-checklist input:checked').each(function() {
            punchRepos.push($(this).attr('name'));
        });
        
        // aggregate punch card data
        user.repos.forEach(function (repo, i) {
            if ($.inArray(repo.name, punchRepos) > -1) {
                console.log('adding ' + repo.name + ' to punch card');
                repo.stats.punch_card.forEach(function (punch, i) {
                    aggPunchCard[i][2] += punch[2];
                });
            }
        });

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
        $('#participation-checklist input:checked').each(function() {
            punchRepos.push($(this).attr('name'));
        });
        $('#ownerall-checklist input:checked').each(function() {
            owner = ($(this).attr('name') == 'owner') ? true : owner;
            all = ($(this).attr('name') == 'all') ? true : all;
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
        user.repos.forEach(function (repo, i) {
            if ($.inArray(repo.name, punchRepos) > -1) {
                console.log('adding ' + repo.name + ' to participation');                
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
            for (z = 0; z < aggParticipation.length; z += 1 ) {
                if (aggParticipation[z].owner > 0 || aggParticipation[z].all > 0) {
                    aggParticipation = aggParticipation.slice(z);
                    break;
                }
            }
        }
        renderParticipation('#participation', aggParticipation);
    }
    
    function aggregateLanguages(user) {
        var aggLanguages = [],
            punchRepos = [],
            language;
        
        //gather which repos, time, and who to include
        $('#languages-checklist input:checked').each(function() {
            punchRepos.push($(this).attr('name'));
        }); 
        
        // aggregate language data
        user.repos.forEach(function (repo, i) {
            if ($.inArray(repo.name, punchRepos) > -1) {
                console.log('adding ' + repo.name + ' to languages');                
                for (language in repo.languages) {
                    if (aggLanguages.hasOwnProperty(language)) {
                        aggLanguages[language] += repo.languages[language];
                    } else {
                        aggLanguages[language] = repo.languages[language];
                    }
                }
            }
        });
        renderLanguages('#languages', aggLanguages);
    }
    
    function renderUser(user, errors) {
        // update the DOM
        if (errors) {
            $('title').text('aggregit: error');
            $('#username').text('Error');
            $('#user').html(errors.responseJSON.message);
        } else {
            var REPO_CHECKLIST_TEMPLATE = '<li><input {1} type="checkbox" name="{0}">{2}{0}</li>',
                repoChecklist = [];
            
            // format dates
            user.created_at = formatDate(new Date(user.created_at));
            user.updated_at = formatDate(new Date(user.updated_at));
            
            // update user info
            $('title').text('aggregit: ' + user.login);
            $('#nav-user').attr('href', user.html_url);
            $('#user-info').html(
                $('#user-info-template').html().format(user)
            );
            
            // update user data
            $('#user-data').html(
                $('#user-data-template').html().format(user)
            );
            
            // build repos selector
            user.repos.forEach(function(repo, i) {
                var check = (repo.fork) ? '' : 'checked=""',
                    fork = (repo.fork) ? '<i class="fa fa-code-fork text-info"></i> ' : '';
                repoChecklist.push(REPO_CHECKLIST_TEMPLATE.format(repo.name, check, fork));
            });
            
            // draw punchcard, and update when repo selector clicked
            $('#punchcard-checklist').html(repoChecklist.join(''));
            aggregatePunchCard(user);
            $('#punchcard-checklist input').click(function() {
                aggregatePunchCard(user);
            });
            
            // draw participation, and update when clicked
            $('#participation-checklist').html(repoChecklist.join(''));
            aggregateParticipation(user);
            $('#participation-checklist input').click(function() {
                aggregateParticipation(user);
            });  
            $('#ownerall-checklist input').click(function() {
                aggregateParticipation(user);
            });       
            $('#zoom-checklist input').click(function() {
                aggregateParticipation(user);
            }); 
            
            // draw languages, and update when repo selector clicked
            $('#languages-checklist').html(repoChecklist.join(''));
            aggregateLanguages(user);
            $('#languages-checklist input').click(function() {
                aggregateLanguages(user);
            });       

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