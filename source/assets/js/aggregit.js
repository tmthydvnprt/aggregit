/*globals $,console,d3,cookieJar,formatDate,github,aggregitor,opr,InstallTrigger,Blob */
/*!
 * aggregit.js
 *
 * Copyright 2015 Timothy Davenport; Licensed MIT
 */
var FIVE_MIN_IN_MS = 5 * 60 * 1000,
    EXAMPLE_USERNAME = 'tmthydvnprt_example',
    RENDER_DELAY = 600,
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

    // Var textFile = null;

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
        // Reference: http://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337
        console.log('Rendering Punchcard');
        console.log('');

        // Remove last plot if there
        d3.select("#punchcard-svg").remove();

        // Setup parameters and variables
        var w = parseInt($(elem).width(), 10),
            h = parseInt(w / 3, 10),
            pad = 20,
            left_pad = 100,
            DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
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

        // Add axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0, " + (h - pad) + ")")
            .call(xAxis);
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (left_pad - pad) + ", 0)")
            .call(yAxis);

        // Add loading text
        svg.append("text")
            .attr("class", "aggregitting")
            .text("aggregitting...")
            .attr("x", function () {
                return w / 2;
            })
            .attr("y", function () {
                return (h / 2) - 5;
            });

        // Remove loading text
        svg.selectAll(".aggregitting").remove();

        // Plot the data!
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
        // Reference: http://bl.ocks.org/mbostock/3884955
        console.log('Rendering Participation');
        console.log('');

        // Remove last plot if there
        d3.select("#participation-svg").remove();

        // Setup parameters and variables
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

        // Use object keys for series color domain
        color.domain(d3.keys(data[0]));

        // Repackage data for plotting
        participations = color.domain().map(function (name) {
            return {
                name: name,
                values: data.map(function (d) {
                    return +d[name];
                })
            };
        });

        // Add axis
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
        // Add loading text
        svg.append("text")
            .attr("class", "aggregitting")
            .text("aggregitting...")
            .attr("x", function () {
                return w / 2;
            })
            .attr("y", function () {
                return (h / 2) - 5;
            });

        // Remove loading text
        svg.selectAll(".aggregitting").remove();

        // Plot the data!
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
        // Reference: http://bl.ocks.org/mbostock/3887193
        // Reference: http://jsfiddle.net/Nw62g/1/
        console.log('Rendering Languages');
        console.log('');

        // Remove last plot if there
        d3.select("#languages-svg").remove();
        d3.select("#languages-tooltip").remove();

        // Setup parameters and variables
        var tipStr = '<strong>{0}</strong><br>{1} kiB<br>{2}%',
            w = parseInt($(elem).width(), 10),
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
                .html(tipStr.format(MAX_LANG + ' Languages', MAX_kiB, 100.00));

        // Use object keys for series color domain
        color.domain(d3.keys(data));

        // Repackage data for plotting
        languages = color.domain().map(function (name) {
            return {
                language: name,
                kiB: Math.floor(data[name] / 10.24) / 100
            };
        });

        // Add loading text
        svg.append("text")
            .attr("class", "aggregitting")
            .text("aggregitting...")
            .attr("x", function () {
                return w / 2;
            })
            .attr("y", function () {
                return (h / 2) - 5;
            });

        // Remove loading text
        svg.selectAll(".aggregitting").remove();

        // Plot the data!
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
                langTooltip.html(tipStr.format(
                    d.data.language,
                    d.data.kiB,
                    Math.round(10000.0 * d.data.kiB / MAX_kiB) / 100
                ));
            })
            .on("mouseout", function (d) {
                langTooltip.html(tipStr.format(MAX_LANG + ' Languages', MAX_kiB, 100.00));
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
//            .attr("transform", function (d) {
//                return "translate(" + arc.centroid(d) + ")";
//            })
//            .attr("dy", ".35em")
//            .style("text-anchor", "middle")
//            .text(function (d) {
//                return d.data.language;
//            });

    }

    function renderHeatmap(elem, data) {
        // Reference: http://bl.ocks.org/mbostock/4063318
        console.log('Rendering Heatmap');
        console.log('');

        function getValues(obj) {
            var array = [],
                key = '';
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    array.push(obj[key]);
                }
            }
            return array;
        }

        // Remove last plot if there
        d3.select("#heatmap-svg").remove();

        // Setup parameters and variables
        var WEEKDAY = {0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'},
            OFFSET = 24 * 60 * 60 * 1000,
            w = parseInt($(elem).width(), 10),
            h = parseInt(w / 6, 10),
            cell_size = parseInt(w / 56, 10),
            pad = 20,
            left_pad = 100,
            format = d3.time.format("%Y-%m-%d"),
            MIN_T = format.parse(Object.keys(data)[0]),
            MAX_T = format.parse(Object.keys(data).slice(-1)[0]),
            MAX_C = d3.max(getValues(data)),
            color = d3.scale.threshold()
                .domain(d3.range(1, MAX_C, MAX_C / 8))
                .range(d3.range(8).map(function (d) { return "q" + d + "-8"; })),
            svg = d3.select(elem).selectAll("svg")
                    .data([0])
                .enter().append("svg")
                    .attr("id", "heatmap-svg")
                    .attr("width", w)
                    .attr("height", h)
                    .attr("class", "RdYlGn")
                .append("g")
                    .attr("transform", "translate(" + ((w - cell_size * 53) / 2) + "," + (h - cell_size * 7 - 1) + ")"),
            rect = svg.selectAll(".day")
                .data(function (d) {
                    return d3.time.days(MIN_T, MAX_T);
                })
                .enter().append("rect")
                .attr("class", "day")
                .attr("width", cell_size)
                .attr("height", cell_size)
                .attr("x", function (d) {
                    if (d.getDay() === 0) {
                        return (d3.time.weeks(MIN_T, d).length + 1) * cell_size;
                    } else {
                        return d3.time.weeks(MIN_T, d).length * cell_size;
                    }
                })
                .attr("y", function (d) { return d.getDay() * cell_size; })
                .datum(format);

        // svg.append("text")
        //     .attr("transform", "translate(-6," + cell_size * 3.5 + ")rotate(-90)")
        //     .style("text-anchor", "middle")
        //     .text(function (d) { return d; });
        rect.append("title").text(function (d) { return d; });

        function monthPath(m) {
            var t0 = m.m0,
                t1 = m.m1,
                d0 = t0.getDay(),
                w0 = d3.time.weeks(MIN_T, t0).length,
                d1 = t1.getDay(),
                w1 = d3.time.weeks(MIN_T, t1).length;
            if (d0 === 0) {
                w0 += 1;
            }
            if (d1 === 0) {
                w1 += 1;
            }
            return "M" + (w0 + 1) * cell_size + "," + d0 * cell_size
                + "H" + w0 * cell_size + "V" + 7 * cell_size
                + "H" + w1 * cell_size + "V" + (d1 + 1) * cell_size
                + "H" + (w1 + 1) * cell_size + "V" + "0"
                + "H" + (w0 + 1) * cell_size + "Z";
        }

        svg.selectAll(".month")
            .data(function (d) {
                var m0 = d3.time.months(MIN_T, MAX_T),
                    m1 = d3.time.months(MIN_T, MAX_T),
                    m = [],
                    i = 0;
                for (i = 0; i < m1.length; i += 1) {
                    m1[i] = new Date(m1[i].getTime() - OFFSET);
                }
                m0.splice(0, 0, MIN_T);
                m1.push(MAX_T);
                for (i = 0; i < m0.length; i += 1) {
                    m.push({'m0': m0[i], 'm1': m1[i]});
                }
                return m;
            })
            .enter().append("path")
            .attr("class", "month")
            .attr("d", monthPath);

        rect//.filter(function (d) { return d in data; })
                .attr("class", function (d) { return "day " + color(data[d]); })
            .select("title")
                .text(function (d) { return WEEKDAY[format.parse(d).getDay()] + " " + d + ": " + data[d]; });

            // heatmapTooltip = d3.select("body")
            //     .append("div")
            //     .attr("id", "heatmap-tooltip")
            //     .attr("class", "tooltip")
            //     .style("opacity", 0)
            //     .text("heatmap");
    }

    function aggregatePunchCard(user) {

        var aggPunchCard = [],
            h = 0,
            d = 0,
            i = 0,
            punchRepos = [],
            key = '',
            repo = {};

        // Fill empty punchcard
        for (d = 0; d < 7; d += 1) {
            for (h = 0; h < 24; h += 1) {
                aggPunchCard.push([d, h, 0]);
            }
        }

        // Gather which repos to include
        $('#punchcard-checklist input:checked').each(function () {
            punchRepos.push($(this).attr('name'));
        });

        // Aggregate punch card data
        console.log('Aggregating Punch Card:');
        for (key in user.repos) {
            if (user.repos.hasOwnProperty(key)) {
                repo = user.repos[key];
                if ($.inArray(repo.name, punchRepos) > -1) {
                    if (!$.isEmptyObject(repo.stats.punch_card)) {
                        console.log('    ' + repo.name);
                        for (i = 0; i < repo.stats.punch_card.length; i += 1) {
                            aggPunchCard[i][2] += repo.stats.punch_card[i][2];
                        }
                    }
                }
            }
        }
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
            zoom = false,
            key = '',
            repo = {};

        // Gather which repos, time, and who to include
        $('#participation-checklist input:checked').each(function () {
            punchRepos.push($(this).attr('name'));
        });
        $('#ownerall-checklist input:checked').each(function () {
            owner = ($(this).attr('name') === 'owner') ? true : owner;
            all = ($(this).attr('name') === 'all') ? true : all;
        });
        zoom = $('#zoom-checklist input:checked').length > 0 ? true : zoom;

        // Fill empty participation
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

        // Aggregate participation data
        console.log('Aggregating Participation:');
        for (key in user.repos) {
            if (user.repos.hasOwnProperty(key)) {
                repo = user.repos[key];
                if ($.inArray(repo.name, punchRepos) > -1) {
                    console.log('    ' + repo.name);
                    for (d = 0; d < PARTICIPATION_SIZE; d += 1) {
                        if (owner && repo.stats.participation.hasOwnProperty('owner')) {
                            aggParticipation[d].owner += repo.stats.participation.owner[d];
                        }
                        if (all && repo.stats.participation.hasOwnProperty('all')) {
                            aggParticipation[d].all += repo.stats.participation.all[d];
                        }
                    }
                }
            }
        }
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

    function aggregateHeatmap(user) {
        var aggHeatmap = {},
            key = '',
            heatRepos = [],
            WEEKS_IN_YEAR = 52,
            DAYS_IN_WEEK = 7,
            d = 0,
            w = 0,
            weekdate = null,
            date = null,
            date_str = '',
            OFFSET = 24 * 60 * 60 * 1000,
            repo = {};

        // Gather which repos, time, and who to include
        $('#participation-checklist input:checked').each(function () {
            heatRepos.push($(this).attr('name'));
        });

        console.log('Aggregating Heatmap (code activity):');
        for (key in user.repos) {
            if (user.repos.hasOwnProperty(key)) {
                repo = user.repos[key];
                if ($.inArray(repo.name, heatRepos) > -1) {
                    console.log('    ' + repo.name);
                    if (!$.isEmptyObject(repo.stats.commit_activity)) {
                        for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                            weekdate = new Date(repo.stats.commit_activity[w].week * 1000);
                            for (d = 0; d < DAYS_IN_WEEK; d += 1) {
                                date = new Date(weekdate.getTime() + d * OFFSET);
                                date_str = '{0}-{1}-{2}'.format(
                                    date.getFullYear(),
                                    ('0' + (date.getMonth() + 1)).slice(-2),
                                    ('0' + date.getDate()).slice(-2)
                                );
                                if (aggHeatmap.hasOwnProperty(date_str)) {
                                    aggHeatmap[date_str] += repo.stats.commit_activity[w].days[d];
                                } else {
                                    aggHeatmap[date_str] = repo.stats.commit_activity[w].days[d];
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log('');
        console.log(aggHeatmap);
        console.log('');
        renderHeatmap('#heatmap', aggHeatmap);
    }

    function aggregateLanguages(user) {
        var aggLanguages = [],
            punchRepos = [],
            language = '',
            key = '',
            repo = {};

        // Gather which repos, time, and who to include
        $('#languages-checklist input:checked').each(function () {
            punchRepos.push($(this).attr('name'));
        });

        // Aggregate language data
        console.log('Aggregating Languages:');
        for (key in user.repos) {
            if (user.repos.hasOwnProperty(key)) {
                repo = user.repos[key];
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
            }
        }
        console.log('');
        renderLanguages('#languages', aggLanguages);
    }

    function renderUser(user, errors) {

        updateBar(100, 100, '100%');
        setTimeout(function () {

            var repos = ["aggregit", "allisondavenport", "compfipy", "dffrnet", "ende", "eugene", "juxtapy", "quilt", "tmthydvnprt.github.io", "utilipy"];
            console.log(aggregitor.agg_contributors(aggregitor.process_contributors(user), repos));
            console.log(aggregitor.agg_code_frequency(aggregitor.process_code_frequency(user), repos));
            console.log(aggregitor.agg_commit_activity(aggregitor.process_commit_activity(user), repos));
            console.log(aggregitor.agg_participation(aggregitor.process_participation(user), repos));
            console.log(aggregitor.agg_punch_card(aggregitor.process_punch_card(user), repos));

            console.log('Render the User');
            console.log('---------------------------------------------');
            // Update the DOM
            if (errors) {
                console.log('Errors! Rate-limit');
                $('title').text('aggregit: error');

                $('#user-info').html(
                    $('#error-template').html()
                );
            } else {
                var REPO_CHECKLIST_TEMPLATE = '<li><input {1} type="checkbox" name="{0}">{2}{0}</li>',
                    repoChecklist = [],
                    key = '',
                    repo = {},
                    check = '',
                    fork = '';

                // Format dates
                user.created_at = formatDate(new Date(user.created_at));
                user.updated_at = formatDate(new Date(user.updated_at));
                user.site_admin = user.site_admin ? '<i class="fa fa-fw fa-github-alt"></i> site admint' : '';
                user.hireable = user.hireable ? '<i class="fa fa-fw fa-check-circle"></i> hireable' : '';

                // Add cached data button
                if ($('#cached-user').length === 0) {
                    $('#nav-search .input-group').append(
                        '<span id="cached-user" class="input-group-addon"><a href="#!/user={0}" alt="{0}\'s data"><i class="fa fa-area-chart fa-2x"></i></a></span><span id="export-user" class="input-group-addon"><a href="#!/exportuser" alt="Export {0}\'s data"><i class="fa fa-cloud-download fa-2x"></i></a></span>'.format(user.login)
                    );
                }
                $('#cached-user').attr("href", "#!/user={0}".format(user.login));

                // Update user info
                $('title').text('aggregit: ' + user.login);
                $('#username').val('');
                $('#username').attr('placeholder', user.login);
                $('#nav-user').attr('href', user.html_url);
                $('#nav-user').attr('title', "Go to User");
                $('#nav-user').attr('alt', "Go to User");
                $('#user-info').html(
                    $('#user-info-template').html().format(user)
                );

                // Update user data
                $('#user-data').html(
                    $('#user-data-template').html().format(user)
                );

                // Build repos selector
                for (key in user.repos) {
                    if (user.repos.hasOwnProperty(key)) {
                        repo = user.repos[key];
                        check = (repo.fork) ? '' : 'checked=""';
                        fork = (repo.fork) ? '<i class="fa fa-code-fork text-info"></i> ' : '';
                        repoChecklist.push(REPO_CHECKLIST_TEMPLATE.format(repo.name, check, fork));
                    }
                }

                // Draw punchcard, and update when repo selector clicked
                $('#punchcard-checklist').html(repoChecklist.join(''));
                aggregatePunchCard(user);
                $('#punchcard-checklist input').click(function () {
                    aggregatePunchCard(user);
                });

                // Draw participation/commit_activity, and update when clicked
                $('#participation-checklist').html(repoChecklist.join(''));
                aggregateParticipation(user);
                aggregateHeatmap(user);
                $('#participation-checklist input').click(function () {
                    aggregateParticipation(user);
                    aggregateHeatmap(user);
                });
                $('#ownerall-checklist input').click(function () {
                    aggregateParticipation(user);
                    aggregateHeatmap(user);
                });
                $('#zoom-checklist input').click(function () {
                    aggregateParticipation(user);
                    aggregateHeatmap(user);
                });

                // Draw languages, and update when repo selector clicked
                $('#languages-checklist').html(repoChecklist.join(''));
                aggregateLanguages(user);
                $('#languages-checklist input').click(function () {
                    aggregateLanguages(user);
                });
            }
        }, RENDER_DELAY);
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
