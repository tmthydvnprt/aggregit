/*globals $,console,d3,cookieJar,formatDate,github,opr,InstallTrigger,Blob */
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
    MS_IN_DAY = HOURS_IN_DAY * M_IN_H * S_IN_M * MS_IN_S;

(function () {
    'use strict';
    window.aggregitor = {
        process_punch_cards : function (user) {
            /* Takes punch cards from repo/stats and puts them in packaged form of {repo0: punch_card0, repo1: punch_card1}.
            each punch card is an array of [d, h, c], where d = weekday, h = 24 hour, and c = number of commits. punch cards
            are pre filled with 0 so that empty or unavailable repos will be aggregated gracefully later.
             */
            var punch_cards = {}
                punch_card = [],
                h = 0,
                d = 0,
                i = 0,
                key = '',
                repo = {};

            // Aggregate punch card data
            console.log('Aggregating Punch Card:');
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
                    if (repo.hasOwnProperty('stats') &&
                        repo.stats.hasOwnProperty('punch_card') &&
                        !$.isEmptyObject(repo.stats.punch_card)) {
                        console.log('    ' + repo.name);
                        for (i = 0; i < repo.stats.punch_card.length; i += 1) {
                            punch_card[i][PC_COMMIT_INDEX] += repo.stats.punch_card[i][PC_COMMIT_INDEX];
                        }
                    } else {
                        console.log('    ' + repo.name + ' ! could not aggregate punch_card');
                    }
                    // add to punch_cards
                    punch_cards[key] = punch_card;
                }
            }
            return punch_cards;
        },
        process_code_frequency : function () {

        },
        process_commit_activity : function () {
            /* Takes commit activity from repo/stats and puts them in packaged form of
            {repo0: commit_activity0, repo1: commit_activity1}.
            each commit activity is an object with 'Y-m-d' keys and number of commit values.
             */
            var commit_activities = {},
                commit_activity = {},
                d = 0,
                w = 0,
                weekdate = null,
                date = null,
                date_str = '',
                key = '',
                repo = {};

            console.log('Aggregating Code Activity:');
            for (key in user.repos) {
                if (user.repos.hasOwnProperty(key)) {
                    repo = user.repos[key];

                    // If there is commit activity for this repo, get it.
                    if (repo.hasOwnProperty('stats') &&
                        repo.stats.hasOwnProperty('commit_activity') &&
                        !$.isEmptyObject(repo.stats.commit_activity)) {
                        console.log('    ' + repo.name);
                        // Loop thru 52 weeks
                        for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                            // Get date for this week
                            weekdate = new Date(repo.stats.commit_activity[w].week * MS);
                            // Loop thru days of each week
                            for (d = 0; d < DAYS_IN_WEEK; d += 1) {
                                // Get date of that day based on offset from week start date
                                date = new Date(weekdate.getTime() + d * MS_IN_DAY);
                                // Convert date into YYYY-MM-DD string
                                date_str = '{0}-{1}-{2}'.format(
                                    date.getFullYear(),
                                    ('0' + (date.getMonth() + 1)).slice(-2),
                                    ('0' + date.getDate()).slice(-2)
                                );
                                // Add that day's commits
                                commit_activity[date_str] += repo.stats.commit_activity[w].days[d];
                            }
                        }
                    } else {
                        console.log('    ' + repo.name + ' ! could not aggregate commit_activity');
                    }
                }
                commit_activities[key] = commit_activity;
            }

            // Once all commit_activities are converted to date list, ensure all dates exist for each repo
            // TBD

            return commit_activities;
        },
        process_contributors : function () {

        },
        process_participation : function () {
            /* Takes participation from repo/stats and puts them in packaged form of
            {repo0: participation0, repo1: participation1}.
            each participation is an object with 'owner' and 'all' arrays of weekly partication commit numbers. participation
            arrays are pre filled with 0 so that empty or unavailable repos will be aggregated gracefully later.
             */
            var participations = {},
                participation = {},
                w = 0,
                z = 0,
                key = '',
                repo = {};

            // Aggregate participation data
            console.log('Aggregating Participation:');
            for (key in user.repos) {
                if (user.repos.hasOwnProperty(key)) {
                    repo = user.repos[key];participation

                    // Fill empty participation
                    participation = {owner: [], all: []};
                    for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                        participation.owner.push(0);
                        participation.all.push(0);
                    }

                    // If there is commit activity for this repo, get it.
                    if (repo.hasOwnProperty('stats') &&
                        repo.stats.hasOwnProperty('participation') &&
                        !$.isEmptyObject(repo.stats.participation)) {
                        console.log('    ' + repo.name);
                        // Loop thru each week
                        for (w = 0; w < WEEKS_IN_YEAR; w += 1) {
                            // Add owner and all particiation for the week
                            participation.owner[w] += repo.stats.participation.owner[w];
                            participation.all[w] += repo.stats.participation.all[w];
                        }
                    } else {
                        console.log('    ' + repo.name + ' ! could not aggregate participation');
                    }
                }
                participations[key] = particiation;
            }
            return participations;
        }
    };
}());
