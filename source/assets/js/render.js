/*globals $,console,d3,aggregitor,updateBar,formatDate,renderPunchCard,renderParticipation,renderHeatmap,renderLanguages,aggregatePunchCard,aggregateParticipation,aggregateHeatmap,aggregateLanguages */
/*!
 * render.js
 *
 * Copyright 2016 Timothy Davenport; Licensed MIT
 */
(function () {
    'use strict';

    var RENDER_DELAY = 600;

    // Unique User Render functions
    // -------------------------------------------------------------------------------------
    window.renderPunchCard = function (elem, data) {
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
                .style("top", "50%")
                .style("left", "50%")
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
                    .style("top", (d3.event.pageY - 16) + "px");
                punchTooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
            })
            .on("mouseout", function (d) {
                punchTooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition(700)
            .attr("r", function (d) {
                return r(d[2]);
            });
    };

    window.renderParticipation = function (elem, data) {
        // Reference: http://bl.ocks.org/mbostock/3884955 & http://bl.ocks.org/mbostock/3902569
        console.log('Rendering Participation');
        console.log('');

        // Remove last plot if there
        d3.select("#participation-svg").remove();

        // Setup parameters and variables
        var w = parseInt($(elem).width(), 10),
            h = parseInt(w / 3, 10),
            pad = 20,
            yaxisOffset = 5,
            bottom_pad = 40,
            left_pad = 60,
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
                .attr("height", h);

        svg.append('rect')
                .attr('width', w)
                .attr('height', h)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                .on("mousemove", function () {
                    var x0 = Math.floor(x.invert(d3.mouse(this)[0])),
                        y0 = 0,
                        tip = '';

                    if (0 <= x0 && x0 < MAX_X) {
                        y0 = y(Math.max(data[x0].all, data[x0].owner))
                        tip = 'weeks ago: ' + (52 - x0) + '<br>all: ' + data[x0].all + '<br>owner:' + data[x0].owner;
                        partTooltip.html(tip)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - d3.mouse(this)[1] + y0 - 40) + "px");
                        partTooltip.transition()
                            .duration(200)
                            .style("opacity", 0.9);
                    }
                })
                .on("mouseout", function (d) {
                    partTooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .transition(700);

            var x = d3.scale.linear().domain([0, MAX_X - 1]).range([left_pad, w - pad]),
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
                .style("top", "50%")
                .style("left", "50%")
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
            .attr("transform", "translate(" + (left_pad - pad + yaxisOffset) + ", 0)")
            .call(yAxis);
        svg.append("text")
            .attr("class", "xlabel")
            .attr("text-anchor", "end")
            .attr("x", w - pad)
            .attr("y", h - 10)
            .text("time (# of weeks ago)");
        svg.append("text")
            .attr("class", "ylabel")
            .attr("text-anchor", "end")
            .attr("x", -pad)
            .attr("y", 0)
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

    };

    window.renderLanguages = function (elem, data, lang_select) {
        // Reference: http://bl.ocks.org/mbostock/3887193
        // Reference: http://jsfiddle.net/Nw62g/1/
        console.log('Rendering Languages');
        console.log('');

        // Remove last plot if there
        d3.select("#languages-svg").remove();
        d3.select("#languages-tooltip").remove();

        // Filter languages if need be
        var i = 0, key = '', temp = {};
        if (lang_select) {
            for (i in lang_select) {
                key = lang_select[i];
                if (data.hasOwnProperty(key)) {
                    temp[key] = data[key];
                }
            }
            data = temp;
        }

        // Setup parameters and variables
        var lang = '',
            l = 0,
            value_sorted_keys = Object.keys(data).sort(function (a, b) {return data[a] - data[b]; }),
            langlist = '',
            tipStr = '<strong>{0}</strong><br>{1} kiB<br>{2}%',
            w = parseInt($(elem).width(), 10),
            h = parseInt(Math.min(w, 400), 10),
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

    };

    window.renderHeatmap = function (elem, data) {
        // Reference: http://bl.ocks.org/mbostock/4063318 & http://bl.ocks.org/tjdecke/5558084
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
        function rotate(array, times) {
            while(times--) {
                var temp = array.shift();
                array.push(temp);
            }
            return array;
        }

        // Remove last plot if there
        d3.select("#heatmap-svg").remove();

        // Setup parameters and variables
        var WEEKDAY = {0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'},
            OFFSET = 24 * 60 * 60 * 1000,
            DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            w = parseInt($(elem).width(), 10),
            h = parseInt(w / 5.5, 10),
            cell_size = parseInt(w / 56, 10),
            pad = 0,
            left_pad = 0,
            format = d3.time.format("%Y-%m-%d"),
            sorted_keys = Object.keys(data).sort(),
            MAX_T = new Date(),
            MIN_T = new Date(),
            dateOffset = 53 * 7 + 1 + MAX_T.getDay();

        MIN_T.setTime(MIN_T.getTime() - (86400000 * dateOffset));

        var MAX_C = d3.max(getValues(data)),
            color = d3.scale.threshold()
                .domain(d3.range(1, MAX_C, MAX_C / 7).map(function(d) {return Math.floor(d)}))
                .range(d3.range(8).map(function (d) { return "q" + Math.floor(Math.min(d, MAX_C)) + "-8"; })),
            svg = d3.select(elem).selectAll("svg")
                    .data([0])
                .enter().append("svg")
                    .attr("id", "heatmap-svg")
                    .attr("width", w)
                    .attr("height", h)
                    .attr("class", "RdYlGn")
                .append("g")
                    .attr("transform", "translate(" + ((w - cell_size * 53) / 2) + "," + (h - cell_size * 8.5 - 1) + ")"),
            heatmapTooltip = d3.select("body")
                .append("div")

                .attr("id", "heatmap-tooltip")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("top", "50%")
                .style("left", "50%")
                .text("heatmap"),

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

            var legend = svg.selectAll(".legend")
                    .data([0].concat(d3.range(1, MAX_C, MAX_C / 7).map(function(d) {return Math.floor(d)})));

            legend.enter().append("g")
                    .attr("class", "legend");

            legend.append("rect")
                    .attr("x", function(d, i) { return d3.time.weeks(MIN_T, MAX_T).length * cell_size - cell_size * (8 - i); })
                    .attr("y", 7.2 * cell_size)
                    .attr("width", cell_size)
                    .attr("height", cell_size)
                    .attr("class", function (d) {return "day " + color(d);});

            legend.append("text")
                    .attr("x", function(d, i) { return d3.time.weeks(MIN_T, MAX_T).length * cell_size - cell_size * (8 - i) + cell_size / 2; })
                    .attr("y", 7.2 * cell_size + cell_size / 2.25)
                    .attr("width", cell_size)
                    .attr("height", cell_size)
                    .style("text-anchor", "middle")
                    .style("alignment-baseline", "central")
                    .text(function (d, i) { return Math.floor(d); });

        var dayLabels = svg.selectAll(".dayLabel")
            .data(DAYS)
            .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * cell_size; })
            .style("text-anchor", "end")
            .attr("transform", "translate(6," + cell_size / 1.5 + ")")
            .attr("class", "dayLabel");

        var monthLabels = svg.selectAll(".monthLabel")
            .data(d3.time.months(MIN_T, MAX_T))
            .enter().append("text")
            .text(function (d) { return MONTHS[d.getMonth()]; })
            .attr("x", function(d, i) { return d3.time.weeks(MIN_T, d).length * cell_size ; })
            .attr("y", 0)
            .style("text-anchor", "start")
            .attr("transform", "translate(1, -6)")
            .attr("class", "monthLabel");

        rect.attr("class", function (d) { return "day " + color(data[d]); });

        rect.on("mouseover", function (d) {
                heatmapTooltip.text((data[d]) ? WEEKDAY[format.parse(d).getDay()] + " " + d + ": " + data[d] : WEEKDAY[format.parse(d).getDay()] + " " + d + ": 0")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 16) + "px");
                heatmapTooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
            })
            .on("mouseout", function (d) {
                heatmapTooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition(700);

    };

    window.renderLanguagesTable = function(elem, data, lang_select) {
        var value_sorted_keys,
            l = 0,
            lang = '',
            langlist = '',
            MAX_kiB = 0;

        // Remove existing table if need be
        $(elem).children().remove();

        // Sort languages from largest language
        value_sorted_keys = Object.keys(data).sort(function (a, b) {return data[a] - data[b]; });
        value_sorted_keys.reverse();

        // Default to display all languages
        lang_select = (lang_select) ? lang_select : value_sorted_keys;

        // Filter languages if need be and get max size for percentages
        var i = 0, key = '', temp = {};
        if (lang_select) {
            for (i in lang_select) {
                key = lang_select[i];
                if (data.hasOwnProperty(key)) {
                    temp[key] = data[key];
                }
            }
        }
        MAX_kiB = Math.floor(d3.sum(d3.values(temp)) / 10.24) / 100;

        // Create table of languages with infor about size
        for (l = 0; l < value_sorted_keys.length; l += 1) {
            lang = value_sorted_keys[l];
            // Only display info for selected languages
            if ($.inArray(lang, lang_select) > -1) {
                langlist += '<tr><td><lable><input checked="" type="checkbox" name="{0}" class="lang-check"><code>{1}</code></label></td><td>{2}</td><td>{3}%</td></tr>'.format(lang, lang, Math.floor(data[lang] / 10.24) / 100, Math.round(10000.0 * Math.floor(data[lang] / 10.24) / 100 / MAX_kiB) / 100);
            } else {
                langlist += '<tr><td><lable><input type="checkbox" name="{0}" class="lang-check"><code>{1}</code></label></td><td>{2}</td><td>{3}%</td></tr>'.format(lang, lang, 0, 0);
            }
        }
        $(elem).html(langlist);
    }

    window.renderUser = function (user, errors) {

        function reRenderLang(e, langData) {
            // Gather which langs to include
            var langs = [];
            $('#language-list input:checked').each(function () {
                langs.push($(this).attr('name'));
            });
            // Rerender the language plot based on language table change
            renderLanguages('#languages', langData, langs);
            renderLanguagesTable('#language-list', langData, langs);
            $('#language-list input').change(function (e) {
                reRenderLang(e, langData);
            });
        }

        function reRender(e) {

            var repos = [],
                langData;
            // Gather which repos to include
            $('.repo-list input:checked').each(function () {
                repos.push($(this).attr('name'));
            });

            renderPunchCard('#punchcard', aggregitor.agg_punch_card(aggregitor.process_punch_card(user), repos));
            renderParticipation('#participation', aggregitor.agg_participation(aggregitor.process_participation(user), repos));
            renderHeatmap('#heatmap', aggregitor.agg_commit_activity(aggregitor.process_commit_activity(user), repos));
            langData = aggregitor.agg_languages(aggregitor.process_languages(user), repos);
            renderLanguages('#languages', langData);
            renderLanguagesTable('#language-list', langData);
            $('#language-list input').change(function (e) {
                reRenderLang(e, langData);
            });

        }

        updateBar(100, 100, '100%');
        setTimeout(function () {

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
                var REPO_CHECKLIST_TEMPLATE = '<li class="checkbox"><label><input {1} type="checkbox" name="{0}" class="{3}">{2}<code>{0}</code></label></li>',
                    repoChecklist = [],
                    key = '',
                    repo = {},
                    check = '',
                    fork = '',
                    forkClass = '',
                    repos = [],
                    langData;

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
                        if (!repo.fork) {
                            repos.push(key);
                        }
                        check = (repo.fork) ? '' : 'checked=""';
                        fork = (repo.fork) ? '<i class="fa fa-code-fork text-info"></i> ' : '';
                        forkClass = (repo.fork) ? 'fork' : '';
                        repoChecklist.push(REPO_CHECKLIST_TEMPLATE.format(repo.name, check, fork, forkClass));
                    }
                }

                // Render Repo selector
                $('#repo-list-inline').html(repoChecklist.join(''));
                $('#user-select-inline').addClass('show');

                // Draw punchcard, participation/commit_activity and languages
                renderPunchCard('#punchcard', aggregitor.agg_punch_card(aggregitor.process_punch_card(user), repos));
                renderParticipation('#participation', aggregitor.agg_participation(aggregitor.process_participation(user), repos));
                renderHeatmap('#heatmap', aggregitor.agg_commit_activity(aggregitor.process_commit_activity(user), repos));
                langData = aggregitor.agg_languages(aggregitor.process_languages(user), repos);
                renderLanguages('#languages', langData);
                renderLanguagesTable('#language-list', langData);

                // Update Languages when clicked
                $('#language-list input').change(function (e) {
                    reRenderLang(e, langData);
                });

                // Update when clicked
                $('.repo-list input').change(function (e) {
                    $('input[name="repo-all-none"]').parent().removeClass('active').children().removeAttr('checked');
                    // rerender the plots
                    reRender();
                });

                // Toggle all/none when clicked
                $('input[name="repo-all-none"]').change(function (e) {
                    var allnone = (this.id === 'repo-all') ? 'all' : 'none';
                    $(this).parent().addClass('active').siblings().removeClass('active');
                    $(this).attr('checked', 'checked').parent().siblings().children().removeAttr('checked');
                    // Update repo list checkboxes
                    $('.repo-list input').each(function () {
                        if (allnone === 'all' && !$(this).hasClass('fork')) {
                            this.checked = true;
                        } else {
                            this.checked = false;
                        }
                    });
                    // rerender the plots
                    reRender();
                });

                // Rerender plots on window size change
                $(window).resize(reRender);
            }
        }, RENDER_DELAY);
    };
}());
