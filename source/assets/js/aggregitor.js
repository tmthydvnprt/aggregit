/*globals $,console,d3,cookieJar,formatDate,date2str,github,opr,InstallTrigger,Blob */
/*!
 * aggregitor.js
 *
 * Copyright 2016 Timothy Davenport; Licensed MIT
 */
var DAYS_IN_WEEK = 7,
    HOURS_IN_DAY = 24,
    WEEKS_IN_YEAR = 52,
    S_IN_M = 60,
    M_IN_H = 60,
    MS_IN_S = 1000,
    PC_COMMIT_INDEX = 2,
    CF_WEEK_INDEX = 0,
    CF_A_INDEX = 1,
    CF_D_INDEX = 2,
    MS_IN_DAY = HOURS_IN_DAY * M_IN_H * S_IN_M * MS_IN_S;

(function () {
    'use strict';
    window.aggregitor = {
        process_contributors : function (user) {
            /* Takes contributors from repo/stats and puts them in packaged form of
            {repo0: contributors0, repo1: contributors1}.
            each contributoris an object with 'Y-m-d' keys and weekly addition/deletion commit values.
            */
            var repo_contributors = {},
                contributor = {},
                contributions = {},
                c = 0,
                w = 0,
                author = 'unknown',
                weekdate = null,
                date_str = '',
                key = '',
                repo = {},
                mindates = {},
                maxdates = {};

            // Aggregate contributors data
            console.log('Processing Contributors:');
            for (key in user.repos) {
                if (user.repos.hasOwnProperty(key)) {
                    repo = user.repos[key];

                    // Fill empty contributor
                    contributor = {};
                    contributions = {};
                    author = 'unknown';
                    weekdate = null;
                    mindates[key] = Infinity;
                    maxdates[key] = 0;


                    // If there is contributors for this repo, get it.
                    if (repo.hasOwnProperty('stats') && repo.stats.hasOwnProperty('contributors') && !$.isEmptyObject(repo.stats.contributors)) {
                        console.log('    ' + repo.name);
                        // Loop thru each contributors
                        for (c = 0; c < repo.stats.contributors.length; c += 1) {
                            if (repo.stats.contributors[c].hasOwnProperty('author') && repo.stats.contributors[c].author.hasOwnProperty('login')) {
                                author = repo.stats.contributors[c].author.login;
                                if (repo.stats.contributors[c].hasOwnProperty('weeks')) {

                                    // Set min/max
                                    mindates[key] = Math.min(mindates[key], new Date(repo.stats.contributors[c].weeks[0].w * MS_IN_S));
                                    maxdates[key] = Math.max(maxdates[key], new Date(repo.stats.contributors[c].weeks[repo.stats.contributors[c].weeks.length - 1].w * MS_IN_S));
                                    // Loop thru each contributors
                                    for (w = 0; w < repo.stats.contributors[c].weeks.length; w += 1) {
                                        // Get date for this week
                                        weekdate = new Date(repo.stats.contributors[c].weeks[w].w * MS_IN_S);
                                        // Convert date into YYYY-MM-DD string
                                        date_str = date2str(weekdate);
                                        // Add that week's additions and deletions
                                        contributions[date_str] = {
                                            'a' : repo.stats.contributors[c].weeks[w].a,
                                            'd' : repo.stats.contributors[c].weeks[w].d,
                                            'c' : repo.stats.contributors[c].weeks[w].c
                                        };
                                    }
                                }
                                contributor[author] = contributions;
                            }
                        }
                    } else {
                        console.log('    ' + repo.name + ' ! could not process repo.stats.contributors');
                    }
                    repo_contributors[key] = contributor;
                }
            }

            // Once all commit_activities are converted to date list, ensure all dates exist for each repo

            return repo_contributors;
        },
        process_commit_activity : function (user) {
            /* Takes commit activity from repo/stats and puts them in packaged form of
            {repo0: commit_activity0, repo1: commit_activity1}.
            each commit activity is an object with 'Y-m-d' keys and number of commit values.
             */
            var repo_commit_activity = {},
                commit_activity = {},
                d = 0,
                w = 0,
                weekdate = null,
                date = null,
                date_str = '',
                key = '',
                repo = {},
                mindates = {},
                maxdates = {};

            console.log('Processing Commit Activity:');
            for (key in user.repos) {
                if (user.repos.hasOwnProperty(key)) {
                    repo = user.repos[key];

                    // Fill empty commit_activity for this repo
                    commit_activity = {};

                    // If there is commit activity for this repo, get it.
                    if (repo.hasOwnProperty('stats') && repo.stats.hasOwnProperty('commit_activity') && !$.isEmptyObject(repo.stats.commit_activity)) {
                        console.log('    ' + repo.name);

                        // Set min/max
                        mindates[key] = new Date(repo.stats.commit_activity[0].week * MS_IN_S);
                        maxdates[key] = new Date(repo.stats.commit_activity[WEEKS_IN_YEAR - 1].week * MS_IN_S);
                        // Loop thru 52 weeks
                        for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                            // Get date for this week
                            weekdate = new Date(repo.stats.commit_activity[w].week * MS_IN_S);
                            // Loop thru days of each week
                            for (d = 0; d < DAYS_IN_WEEK; d += 1) {
                                // Get date of that day based on offset from week start date
                                date = new Date(weekdate.getTime() + d * MS_IN_DAY);
                                // Convert date into YYYY-MM-DD string
                                date_str = date2str(date);
                                // Add that day's commits
                                if (commit_activity.hasOwnProperty(date_str)) {
                                    commit_activity[date_str] += repo.stats.commit_activity[w].days[d];
                                } else {
                                    commit_activity[date_str] = repo.stats.commit_activity[w].days[d];
                                }
                            }
                        }
                    } else {
                        console.log('    ' + repo.name + ' ! could not process commit_activity');
                    }
                    repo_commit_activity[key] = commit_activity;
                }
            }

            // Once all commit_activities are converted to date list, ensure all dates exist for each repo

            return repo_commit_activity;
        },
        process_code_frequency : function (user) {
            /* Takes code frequency from repo/stats and puts them in packaged form of
            {repo0: code_frequency0, repo1: code_frequency1}.
            each code frequency is an array of [w, a, d], where w = week, a = number of additions, and d = number of
            deletions. ode frequencies are pre filled with 0 so that empty or unavailable repos will be aggregated gracefully
            later.
            */
            var repo_code_frequency = {},
                code_frequency = {},
                w = 0,
                weekdate = null,
                date_str = '',
                key = '',
                repo = {},
                mindates = {},
                maxdates = {};

            console.log('Processing Code Frequency:');
            for (key in user.repos) {
                if (user.repos.hasOwnProperty(key)) {
                    repo = user.repos[key];

                    // Fill empty code_frequency for this repo
                    code_frequency = {};

                    // If there is code frequency for this repo, get it.
                    if (repo.hasOwnProperty('stats') && repo.stats.hasOwnProperty('code_frequency') && !$.isEmptyObject(repo.stats.code_frequency)) {
                        console.log('    ' + repo.name);

                        // Set min/max
                        mindates[key] = new Date(repo.stats.code_frequency[0].week * MS_IN_S);
                        maxdates[key] = new Date(repo.stats.code_frequency[repo.stats.code_frequency.length - 1].week * MS_IN_S);
                        // Loop thru ? weeks
                        for (w = 0; w < repo.stats.code_frequency.length; w += 1) {
                            // Get date for this week
                            weekdate = new Date(repo.stats.code_frequency[w][CF_WEEK_INDEX] * MS_IN_S);
                            // Convert date into YYYY-MM-DD string
                            date_str = date2str(weekdate);
                            // Add that week's additions and deletions
                            code_frequency[date_str] = {
                                'a' : repo.stats.code_frequency[w][CF_A_INDEX],
                                'd' : repo.stats.code_frequency[w][CF_D_INDEX]
                            };
                        }

                    } else {
                        console.log('    ' + repo.name + ' ! could not process code_frequency');
                    }
                    // add to code_frequencies
                    repo_code_frequency[key] = code_frequency;
                }
            }

            // Once all commit_activities are converted to date list, ensure all dates exist for each repo

            return repo_code_frequency;
        },
        process_participation : function (user) {
            /* Takes participation from repo/stats and puts them in packaged form of
            {repo0: participation0, repo1: participation1}.
            each participation is an object with 'owner' and 'all' arrays of weekly partication commit numbers. participation
            arrays are pre filled with 0 so that empty or unavailable repos will be aggregated gracefully later.
            */
            var repo_participation = {},
                participation = [],
                w = 0,
                key = '',
                repo = {};

            // Aggregate participation data
            console.log('Processing Participation:');
            for (key in user.repos) {
                if (user.repos.hasOwnProperty(key)) {
                    repo = user.repos[key];

                    // Fill empty participation
                    participation = [];
                    for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                        participation.push({owner: 0, all: 0});
                    }

                    // If there is commit activity for this repo, get it.
                    if (repo.hasOwnProperty('stats') && repo.stats.hasOwnProperty('participation') && !$.isEmptyObject(repo.stats.participation)) {
                        console.log('    ' + repo.name);
                        // Loop thru each week
                        for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                            // Add owner and all particiation for the week
                            participation[w].owner += repo.stats.participation.owner[w];
                            participation[w].all += repo.stats.participation.all[w];
                        }
                    } else {
                        console.log('    ' + repo.name + ' ! could not process participation');
                    }
                    repo_participation[key] = participation;
                }
            }
            return repo_participation;
        },
        process_punch_card : function (user) {
            /* Takes punch cards from repo/stats and puts them in packaged form of {repo0: punch_card0, repo1: punch_card1}.
            each punch card is an array of [d, h, c], where d = weekday, h = 24 hour, and c = number of commits. punch cards
            are pre filled with 0 so that empty or unavailable repos will be aggregated gracefully later.
            */
            var repo_punch_card = {},
                punch_card = [],
                h = 0,
                d = 0,
                i = 0,
                key = '',
                repo = {};

            // Aggregate punch card data
            console.log('Processing Punch Card:');
            // Loop thru repos
            for (key in user.repos) {
                if (user.repos.hasOwnProperty(key)) {
                    repo = user.repos[key];

                    // Fill empty punchcard for this repo
                    punch_card = [];
                    for (d = 0; d < DAYS_IN_WEEK; d += 1) {
                        for (h = 0; h < HOURS_IN_DAY; h += 1) {
                            punch_card.push([d, h, 0]);
                        }
                    }
                    // If there is a punch card for this repo, get it.
                    if (repo.hasOwnProperty('stats') && repo.stats.hasOwnProperty('punch_card') && !$.isEmptyObject(repo.stats.punch_card)) {
                        console.log('    ' + repo.name);
                        for (i = 0; i < repo.stats.punch_card.length; i += 1) {
                            punch_card[i][PC_COMMIT_INDEX] += repo.stats.punch_card[i][PC_COMMIT_INDEX];
                        }
                    } else {
                        console.log('    ' + repo.name + ' ! could not process punch_card');
                    }
                    // add to punch_cards
                    repo_punch_card[key] = punch_card;
                }
            }
            return repo_punch_card;
        },
        process_languages : function (user) {
            /* Takes languages from repo and puts them in packaged form of {repo0: languages0, repo1: languages1}.
            */
            var repo_languages = {},
                key = '',
                repo = {};

            // Aggregate punch card data
            console.log('Processing Languages:');
            // Loop thru repos
            for (key in user.repos) {
                if (user.repos.hasOwnProperty(key)) {
                    repo = user.repos[key];

                    // If there is a punch card for this repo, get it.
                    if (repo.hasOwnProperty('languages') && !$.isEmptyObject(repo.languages)) {
                        console.log('    ' + repo.name);
                        repo_languages[key] = repo.languages;
                    } else {
                        console.log('    ' + repo.name + ' ! could not process languages');
                    }
                }
            }
            return repo_languages;
        },
        agg_contributors : function (repo_contributors, repos) {
            /* Aggregate contributors across provided repos */
            var contributors = {},
                r = 0,
                author = 0,
                date = '',
                repo = '';

            // Aggregate contributors data
            console.log('Aggregating Contributors:');
            // Loop thru requested repos and aggregate
            for (r = 0; r < repos.length; r += 1) {
                repo = repos[r];
                if (repo_contributors.hasOwnProperty(repo)) {
                    console.log('    ' + repo);
                    for (author in repo_contributors[repo]) {
                        if (repo_contributors[repo].hasOwnProperty(author)) {
                            if (!contributors.hasOwnProperty(author)) {
                                contributors[author] = {};
                            }
                            for (date in repo_contributors[repo][author]) {
                                if (repo_contributors[repo][author].hasOwnProperty(date)) {
                                    if (contributors[author].hasOwnProperty(date)) {
                                        contributors[author][date].a += repo_contributors[repo][author][date].a;
                                        contributors[author][date].d += repo_contributors[repo][author][date].d;
                                        contributors[author][date].c += repo_contributors[repo][author][date].c;
                                    } else {
                                        contributors[author][date].a = repo_contributors[repo][author][date].a;
                                        contributors[author][date].d = repo_contributors[repo][author][date].d;
                                        contributors[author][date].c = repo_contributors[repo][author][date].c;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    console.log('    ' + repo + ' ! could not aggregate contributors');
                }
            }

            return contributors;
        },
        agg_commit_activity : function (repo_commit_activitiy, repos) {
            /* Aggregate commit_activity across provided repos */
            var commit_activity = {},
                r = 0,
                date = '',
                repo = '';

            // Aggregate commit activity data
            console.log('Aggregating Commit Activity:');
            // Loop thru requested repos and aggregate
            for (r = 0; r < repos.length; r += 1) {
                repo = repos[r];
                if (repo_commit_activitiy.hasOwnProperty(repo)) {
                    console.log('    ' + repo);
                    for (date in repo_commit_activitiy[repo]) {
                        if (repo_commit_activitiy[repo].hasOwnProperty(date)) {
                            if (commit_activity.hasOwnProperty(date)) {
                                commit_activity[date] += repo_commit_activitiy[repo][date];
                            } else {
                                commit_activity[date] = repo_commit_activitiy[repo][date];
                            }
                        }
                    }
                } else {
                    console.log('    ' + repo + ' ! could not aggregate commit_activity');
                }
            }

            return commit_activity;
        },
        agg_code_frequency : function (repo_code_frequency, repos) {
            /* Aggregate code_frequency across provided repos */
            var code_frequency = {},
                r = 0,
                date = '',
                repo = '';

            // Aggregate code_frequency data
            console.log('Aggregating Code Frequency:');
            // Loop thru requested repos and aggregate
            for (r = 0; r < repos.length; r += 1) {
                repo = repos[r];
                if (repo_code_frequency.hasOwnProperty(repo)) {
                    console.log('    ' + repo);
                    for (date in repo_code_frequency[repo]) {
                        if (repo_code_frequency[repo].hasOwnProperty(date)) {
                            if (code_frequency.hasOwnProperty(date)) {
                                code_frequency[date].a += repo_code_frequency[repo][date].a;
                                code_frequency[date].d += repo_code_frequency[repo][date].d;
                            } else {
                                code_frequency[date].a = repo_code_frequency[repo][date].a;
                                code_frequency[date].d = repo_code_frequency[repo][date].d;
                            }
                        }
                    }
                } else {
                    console.log('    ' + repo + ' ! could not aggregate code_frequency');
                }
            }
            return code_frequency;
        },
        agg_participation : function (repo_participation, repos) {
            /* Aggregate participation across provided repos */
            var participation = [],
                r = 0,
                repo = '',
                w = 0;

            // Fill empty participation
            for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                participation.push({owner: 0, all: 0});
            }

            // Aggregate participation data
            console.log('Aggregating Participation:');
            // Loop thru requested repos and aggregate
            for (r = 0; r < repos.length; r += 1) {
                repo = repos[r];
                if (repo_participation.hasOwnProperty(repo)) {
                    console.log('    ' + repo);
                    // Loop thru each week
                    for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                        // Add owner and all particiation for the week
                        participation[w].owner += repo_participation[repo][w].owner;
                        participation[w].all += repo_participation[repo][w].all;
                    }
                } else {
                    console.log('    ' + repo + ' ! could not aggregate participation');
                }
            }

            return participation;
        },
        agg_punch_card : function (repo_punch_card, repos) {
            /* Aggregate punch_card across provided repos */

            var punch_card = [],
                r = 0,
                repo = '',
                d = 0,
                h = 0,
                i = 0;

            // Fill empty punchcard
            for (d = 0; d < DAYS_IN_WEEK; d += 1) {
                for (h = 0; h < HOURS_IN_DAY; h += 1) {
                    punch_card.push([d, h, 0]);
                }
            }

            // Aggregate punch card data
            console.log('Aggregating Punch Card:');
            // Loop thru requested repos and aggregate
            for (r = 0; r < repos.length; r += 1) {
                repo = repos[r];
                if (repo_punch_card.hasOwnProperty(repo)) {
                    console.log('    ' + repo);
                    for (i = 0; i < repo_punch_card[repo].length; i += 1) {
                        punch_card[i][PC_COMMIT_INDEX] += repo_punch_card[repo][i][PC_COMMIT_INDEX];
                    }
                } else {
                    console.log('    ' + repo + ' ! could not aggregate punch_card');
                }
            }

            return punch_card;
        },
        agg_languages : function (repo_languages, repos) {
            /* Aggregate punch_card across provided repos */

            var languages = [],
                r = 0,
                repo = '',
                lang = 0;

            // Aggregate punch card data
            console.log('Aggregating Languages:');
            // Loop thru requested repos and aggregate
            for (r = 0; r < repos.length; r += 1) {
                repo = repos[r];
                if (repo_languages.hasOwnProperty(repo)) {
                    console.log('    ' + repo);

                    for (lang in repo_languages[repo]) {
                        if (repo_languages[repo].hasOwnProperty(lang)) {
                            if (languages.hasOwnProperty(lang)) {
                                languages[lang] += repo_languages[repo][lang];
                            } else {
                                languages[lang] = repo_languages[repo][lang];
                            }
                        }
                    }

                } else {
                    console.log('    ' + repo + ' ! could not aggregate languages');
                }
            }
            return languages;
        }
    };
}());
