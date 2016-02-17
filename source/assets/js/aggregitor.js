/*globals $,console,d3,cookieJar,formatDate,github,opr,InstallTrigger,Blob */
/*!
 * aggregitor.js
 *
 * Copyright 2016 Timothy Davenport; Licensed MIT
 */
var DAYS_IN_WEEK = 7,
    HOURS_IN_DAY = 24;

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
                            punch_card[i][2] += repo.stats.punch_card[i][2];
                        }
                    } else {
                        console.log('    ' + repo.name + ' ! could not aggregate');
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

        },
        process_contributors : function () {

        },
        process_participation : function () {

        }
    };
}());
