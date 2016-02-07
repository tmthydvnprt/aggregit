/*globals $,console,d3,cookieJar */

/*!
 * github.js
 *
 * Copyright 2016 Timothy Davenport; Licensed MIT
 */

 /*
GitHub API Reference: https://api.github.com
{
  "current_user_url": "https://api.github.com/user",
  "current_user_authorizations_html_url": "https://github.com/settings/connections/applications{/client_id}",
  "authorizations_url": "https://api.github.com/authorizations",
  "code_search_url": "https://api.github.com/search/code?q={query}{&page,per_page,sort,order}",
  "emails_url": "https://api.github.com/user/emails",
  "emojis_url": "https://api.github.com/emojis",
  "events_url": "https://api.github.com/events",
  "feeds_url": "https://api.github.com/feeds",
  "followers_url": "https://api.github.com/user/followers",
  "following_url": "https://api.github.com/user/following{/target}",
  "gists_url": "https://api.github.com/gists{/gist_id}",
  "hub_url": "https://api.github.com/hub",
  "issue_search_url": "https://api.github.com/search/issues?q={query}{&page,per_page,sort,order}",
  "issues_url": "https://api.github.com/issues",
  "keys_url": "https://api.github.com/user/keys",
  "notifications_url": "https://api.github.com/notifications",
  "organization_repositories_url": "https://api.github.com/orgs/{org}/repos{?type,page,per_page,sort}",
  "organization_url": "https://api.github.com/orgs/{org}",
  "public_gists_url": "https://api.github.com/gists/public",
  "rate_limit_url": "https://api.github.com/rate_limit",
  "repository_url": "https://api.github.com/repos/{owner}/{repo}",
  "repository_search_url": "https://api.github.com/search/repositories?q={query}{&page,per_page,sort,order}",
  "current_user_repositories_url": "https://api.github.com/user/repos{?type,page,per_page,sort}",
  "starred_url": "https://api.github.com/user/starred{/owner}{/repo}",
  "starred_gists_url": "https://api.github.com/gists/starred",
  "team_url": "https://api.github.com/teams",
  "user_url": "https://api.github.com/users/{user}",
  "user_organizations_url": "https://api.github.com/user/orgs",
  "user_repositories_url": "https://api.github.com/users/{user}/repos{?type,page,per_page,sort}",
  "user_search_url": "https://api.github.com/search/users?q={query}{&page,per_page,sort,order}"
}
*/

var API_URL = 'https://api.github.com',
    REPO_STATS_URLS = ['contributors', 'commit_activity', 'code_frequency', 'participation', 'punch_card'],
    HOUR_IN_MS = 60 * 60 * 1000;

function getRateLimit(access_token) {
    /*
    Check rate limits for user
    If access_token is valid API returns:
    {
        "resources": {
            "core": {
                "limit": 5000,
                "remaining": 4983,
                "reset": 1454771069
            },
            "search": {
                "limit": 30,
                "remaining": 30,
                "reset": 1454767529
            }
        },
        "rate": {
            "limit": 5000,
            "remaining": 4983,
            "reset": 1454771069
        }
    }
    If the access_token is invalid the API returns:
    {
        "message": "Bad credentials",
        "documentation_url": "https://developer.github.com/v3"
    }
    */
    // Build url
    var rate_limit_url  = [API_URL, 'rate_limit'].join('/') + access_token;
    return $.getJSON(rate_limit_url);
}

function check_authentication(callback) {
    /* Uses the rate_limit API to check if user authorization is still valid */
    console.log('Checking GitHub Authorization');
    // Check for token
    var token = cookieJar.has('access_token') ? '?access_token=' + cookieJar.get('access_token') : '';

    // If token exists, user authenticated at one point... check if still valid
    if (token) {
        console.log('Has Access Token, check if still valid');

        // Check rate
        $.when(getRateLimit(token)).done(function (rate_limit) {
            console.log('Rate Limit request done');
            if (rate_limit["message"] === "Bad credentials") {
                console.log('Token is not valid');
                cookieJar.set('valid_auth', false);
                callback(false);
            } else {
                console.log('Token is still valid');
                cookieJar.set('valid_auth', true);
                cookieJar.set('auth_time', (new Date()).toISOString());
                callback(true);
            }
        }).fail(function (response) {
            console.log('Rate Limit request failed');
            console.log('Assume Token is not valid');
            cookieJar.set('valid_auth', false);
            callback(false);
        });

    } else {
        console.log('No Access Token');
        cookieJar.set('valid_auth', false);
        callback(false);
    }
}

function getGitHubUser(username, callback) {
    var TOKEN = cookieJar.has('access_token') ? '?access_token=' + cookieJar.get('access_token') : '',
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
            return $.getJSON([API_URL, 'users', username].join('/') + TOKEN);
        }
    }

    function getRepos(username) {
        var reposCookie = null,
            reposData = null,
            dfRepos =  null,
            blank =  null,
            repos_url = [API_URL, 'users', username, 'repos'].join('/') + TOKEN;

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
                repos_url = [API_URL, 'users', username, 'repos'].join('/') + TOKEN,
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
                    repo_url = [API_URL, 'repos', username, repoData.name].join('/');

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
                cookieJar.cookies().forEach(function (name) {
                    var cookie = cookieJar.get(name);
                    console.log('    {0}: {1}'.format(name, cookie));
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
