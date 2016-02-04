
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
