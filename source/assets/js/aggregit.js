/*globals $,console*/
/*!
 * aggregit.js
 * 
 * Copyright 2015 Timothy Davenport; Licensed MIT
 */

$(document).ready(function () {
    'use strict';
    
    var isObject = function (a) {
        return (!!a) && (a.constructor === Object);
    },
        copyBIfInA = function (A, B) {
            var key;
            A = $.extend(true, {}, A);
            for (key in A) {
                if (A.hasOwnProperty(key) && B.hasOwnProperty(key)) {
                    if (isObject(A[key]) && isObject(B[key])) {
                        A[key] = copyBIfInA(A[key], B[key]);
                    } else {
                        A[key] = B[key];
                    }
                }
            }
            return A;
        };

    function renderUser(user, errors) {
        // update the DOM
        if (errors) {
            $('title').text('aggregit: error');
            $('#username').text('Error');
            $('#user').html(errors.responseJSON.message);
        } else {
            $('title').text('aggregit: ' + user.login);
            $('#username').text(user.login);
            $('#user').html(JSON.stringify(user));
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

    // aggregit is all
    function aggregit() {
        var username = location.hash.slice(1) || 'tmthydvnprt',
			hardcode = true;
		
		if (hardcode) {
            $.getJSON('data/user.json', function (user) {
                renderUser(user, '');
            });
		} else {
            alert('are you sure');
			getGitHubUser(username, renderUser);
		}

    }
    
    // aggregit on load
    $(window).on('load', aggregit);
});