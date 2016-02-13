/*globals $,console,d3,cookieJar */

/*!
 * github.js
 *
 * Copyright 2016 Timothy Davenport; Licensed MIT
 */

function parse_headers(header_string) {
    /* Parses a header string as returned by xhr.getAllResponseHeaders()
    Example Header:
        X-OAuth-Scopes:
        X-RateLimit-Remaining: 4878
        X-Accepted-OAuth-Scopes:
        Last-Modified: Sat, 24 Oct 2015 21:02:27 GMT
        ETag: W/"bc440d9ad7a60bc67bbf7f3513528724"
        Content-Type: application/json; charset=utf-8
        Cache-Control: private, max-age=60, s-maxage=60
        X-RateLimit-Reset: 1455024495
        X-RateLimit-Limit: 5000
    */
    var lines = header_string.trim().split('\n');
        headers = {},
        line = '',
        key = '',
        val = '',
        number = null;
    // loop thru header lines
    for (line in lines) {
        // split line on first `:` for key:val par
        keyval = lines[line].split(/:(.*)/);
        key = keyval[0].trim();
        val = keyval[1].trim();
        // try to parse value as null
        if (val === "") {
            val = null;
        } else {
            // try to parse as number
            number = parseInt(val);
            if (!isNaN(number)) {
                val = number;
            } else {
                // try to parse as number
                date = new Date(val);
                if (!isNaN(date.getTime())) {
                    val = date;
                }
                // leave as string
            }
        }
        // Place in object
        headers[key] = val;
    }
    return headers;
}

var github = {
    // API Defaults and Constants
    //--------------------------------------------------------------------------------------------------------------------------
    api_url : 'https://api.github.com',
    client_id : '85bd6112f2a60a7edd66',
    oauth_url : 'https://github.com/login/oauth/authorize?',
    client_redirect : 'http://aggregit.com/#!/authenticate',
    oauth_proxy_url : 'http://aggregit-proxy-576273.appspot.com/?',
    auth_scope : '',
    repo_stats : ['contributors', 'commit_activity', 'code_frequency', 'participation', 'punch_card'],
    user_keys : {
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
    repo_keys : {
        "name": "",
        "owner": {"login": ""},
        "html_url": "",
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

    // API Access
    //--------------------------------------------------------------------------------------------------------------------------
    state : cookieJar.has('state') ? cookieJar.get('state') : null,
    access_token : cookieJar.has('access_token') ? cookieJar.get('access_token') : null,
    rate_limit : 60,
    remaining_calls : 60,
    rate_limit_reset : 0,

    // API Data
    //--------------------------------------------------------------------------------------------------------------------------
    data : {},

    // Authorize and Authenticate
    //--------------------------------------------------------------------------------------------------------------------------
    authorize : function() {
        var url = '';
        this.state = Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8)
        // store state in cookie for later
        cookieJar.set('state', this.state);
        // Create url to access GitHub authentication
        url = this.oauth_url + $.param({
            'client_id' : this.client_id,
            'redirect_url' : this.client_redirect,
            'scope' : this.auth_scope,
            'state' : this.state
        });
        // Request authorization
        console.log('Getting GitHub Authorization');
        console.log(url);
        location.href = url;
    },
    authenticate : function() {
        console.log('Getting GitHub Authentication');
        // Get GitHub authentication from redirected url
        var auth = deparam(window.location.search),
            url = '',
            username = '';
        // Check that state is valid
        if (cookieJar.get('state') === auth['state'] ) {
            console.log('state is good');
            // Turn authorization code into access token
            url = this.oauth_proxy_url + $.param(auth);
            $.getJSON(url, function(access) {
                if (access.hasOwnProperty('access_token')) {
                    console.log('token is good');
                    console.log('authenticated');
                    github.access_token = access['access_token'];
                    cookieJar.set('access_token', access['access_token']);
                    cookieJar.set('valid_auth', true);
                    cookieJar.set('auth_time', (new Date()).toISOString());
                    username = cookieJar.has('searchUser') ? cookieJar.get('searchUser') : '';
                    location.href = location.href.replace(location.search, '').replace(location.hash, '') + '#!/user=' + username;
                } else {
                    console.log('error: no token');
                    location.href = location.href.replace(location.search, '').replace(location.hash, '') + '#!/home';
                }
            });
        } else {
            console.log('state is bad');
            console.log('did not authenticate');
            location.href = location.href.replace(location.search, '').replace(location.hash, '') + '#!/home';
        }
    },
    check_authentication : function(callback) {
        // Uses the rate_limit API to check if user authorization is still valid
        console.log('Checking GitHub Authorization');

        // If token exists, user authenticated at one point... check if still valid
        if (this.access_token) {
            console.log('Has Access Token, check if still valid');

            // Check rate
            $.when(this.request_handler('rate_limit')).always(function (data, status, xhr) {

                // If error, move things around because github errors still contain useful data
                if (status === 'error') {
                    xhr = $.extend(true, {}, data);
                    data = $.extend(true, {}, data.responseJSON);
                }

                console.log('Rate Limit request done');
                if (status === 'error' && data["message"] === "Bad credentials") {
                    console.log('Token is not valid');
                    console.log(data);
                    cookieJar.set('valid_auth', false);
                    callback(false);
                } else {
                    console.log('Token is still valid');
                    cookieJar.set('valid_auth', true);
                    cookieJar.set('auth_time', (new Date()).toISOString());
                    callback(true);
                }
            });

        } else {
            console.log('No Access Token');
            cookieJar.set('valid_auth', false);
            callback(false);
        }
    },

    // API Access
    //--------------------------------------------------------------------------------------------------------------------------
    // Request Handler
    request_handler : function(request) {
        // Split of argument object into array for arguments after request
        var args = Array.prototype.splice.call(arguments, 1),
        // Pass argument array into requesting url function
            url = this.urls[request].apply(this, args);
        // Make sure there are enough API call available
        if (this.remaining_calls > 0) {
            console.log('({0}) Making API call: {1}'.format((this.rate_limit - this.remaining_calls), url));
            return $.ajax({
                dataType: "json",
                url: url
            })
        } else {
            console.log('Not enough API calls left. Reset at {0}'.format(new Date(this.rate_limit_reset * 1000)));
            return false;
        }
    },
    // Response Handler
    response_handler : function(data, status, xhr) {

        // If error, move things around because github errors still contain useful data
        if (status === 'error') {
            xhr = $.extend(true, {}, data);
            data = $.extend(true, {}, data.responseJSON);
        }

        // parse out header info and original url
        var headers = parse_headers(xhr.getAllResponseHeaders()),
            request_url = this.url;

        // store rate limits
        github.rate_limit = headers['X-RateLimit-Limit'];
        github.remaining_calls = headers['X-RateLimit-Remaining'];
        github.rate_limit_reset = headers['X-RateLimit-Reset'];

        // check Response Status
        console.log(xhr.status);
        // response was successful, continue processing
        if (xhr.status === 200) {
            console.log('Response was successful');
            console.log(data);

            // Response Routing
            if (data.hasOwnProperty('rate')) {
                console.log('Response is a Rate Limit');

            } else if (data.url.match('https://api.github.com/user/') ||
                       data.url.match('https://api.github.com/users/')) {
                console.log('Response is a User');

            } else if (data.url.match('https://api.github.com/repos/') ||
                       data.url.match('https://api.github.com/user/repos') ||
                       data.url.match('https://api.github.com/users/.*/repos')) {
                console.log('Response is a Repo');

            } else {
                console.log('Response data has unknown type');

            }

        // response was accepted, background processing needed, try again
        } else if (xhr.status === 202) {
            console.log('Response was accepted, background processing needed, try again');
            console.log(data);

        // response has a redirect
        } else if (xhr.status === 301 || xhr.status === 302 || xhr.status === 307) {
            console.log('Response has a redirect');
            console.log(data);

        // response has a client error
        } else if (xhr.status === 400 || xhr.status === 422) {
            console.log('Response has a client error');
            console.log(data);

        // response is unauthorized
        } else if (xhr.status === 401) {
            console.log('Response is unauthorized');
            console.log(data);

        // response is forbidden or not found
        } else if (xhr.status === 404 || xhr.status === 403) {
            console.log('Response is forbidden or no found');
            console.log(data);

        } else {
            console.log('Response has unknown status');
            console.log(data);
        }

    },

    // API request urls
    //--------------------------------------------------------------------------------------------------------------------------
    // build params, starts with access_token if it exists then extends with other_params if neccesary
    build_params : function(other_params) {
        var params = {};
        // add access_token to params if it exists
        if (this.access_token !== '') {
            params['access_token'] = this.access_token;
        }
        // extend params
        $.extend(params, other_params);
        // stringify as url params
        params = $.param(params);
        // prepend param identifier if paramas exist
        if (params) {
            params = '?' + params;
        }
        return params;
    },
    urls : {
        current_user : function () {
            // https://api.github.com/user
            var url = [this.api_url, 'user'].join('/') + this.build_params();
            return url;
        },
        current_user_repositories : function (type, page, per_page, sort) {
            // https://api.github.com/user/repos{?type,page,per_page,sort}
            var url = '',
            params = {};
            if (type) { params['type'] = type; }
            if (page) { params['page'] = page; }
            if (per_page) { params['per_page'] = per_page; }
            if (sort) { params['sort'] = sort; }
            url = [this.api_url, 'user', 'repos'].join('/') + this.build_params();
            return url;
        },
        user : function (user) {
            // https://api.github.com/users/{user}
            var url = [this.api_url, 'users', user].join('/') + this.build_params();
            return url;
        },
        user_repositories : function (user, type, page, per_page, sort) {
            // https://api.github.com/users/{user}/repos{?type,page,per_page,sort}
            var url = '',
            params = {};
            if (type) { params['type'] = type; }
            if (page) { params['page'] = page; }
            if (per_page) { params['per_page'] = per_page; }
            if (sort) { params['sort'] = sort; }
            url = [this.api_url, 'users', user, 'repos'].join('/') + this.build_params();
            return url;
        },
        emojis : function () {
            // https://api.github.com/emojis
            var url = [this.api_url, 'emojis'].join('/') + this.build_params();
            return url;
        },
        followers : function (user) {
            // https://api.github.com/users/{user}/followers
            var url = [this.api_url, 'users', user, 'followers'].join('/') + this.build_params();
            return url;
        },
        following : function (user) {
            // https://api.github.com/users/{user}/following
            var url = [this.api_url, 'users', user, 'following'].join('/') + this.build_params();
            return url;
        },
        gists : function (user) {
            // https://api.github.com/users/{user}/gists
            var url = [this.api_url, 'users', user, 'gists'].join('/') + this.build_params();
            return url;
        },
        rate_limit : function () {
            // https://api.github.com/rate_limit
            var url = [this.api_url, 'rate_limit'].join('/') + this.build_params();
            return url;
        },
        repository : function (owner, repo) {
            // https://api.github.com/repos/{owner}/{repo}
            var url = [this.api_url, 'repos', owner, repo].join('/') + this.build_params();
            return url;
        },
        repository_stats : function (owner, repo, stat) {
            // https://api.github.com/repos/{owner}/{repo}/stats/{stat}
            var url = [this.api_url, 'repos', owner, repo, 'stats', stat].join('/') + this.build_params();
            return url;
        },
        repository_languages : function (owner, repo) {
            // https://api.github.com/repos/{owner}/{repo}/languages
            var url = [this.api_url, 'repos', owner, repo, 'languages'].join('/') + this.build_params();
            return url;
        },
        starred : function () {
            // https://api.github.com/user/starred
            var url = [this.api_url, 'user', 'starred'].join('/') + this.build_params();
            return url;
        },
        starred_gists : function () {
            // https://api.github.com/gists/starred
            var url = [this.api_url, 'gists', 'starred'].join('/') + this.build_params();
            return url;
        },
    },

    // API requests
    //--------------------------------------------------------------------------------------------------------------------------
    get_user : function(user) {
        $.when(this.request_handler('user', unurl(user))).always(this.response_handler).always(function(data) {
            console.log('Got to a second always function');
            console.log(data);
        });
    },
    get_repo : function(owner, repo) {
        $.when(this.request_handler('repository', owner, repo)).always(this.response_handler);
    }
};

var API_URL = 'https://api.github.com',
    REPO_STATS_URLS = ['contributors', 'commit_activity', 'code_frequency', 'participation', 'punch_card'],
    HOUR_IN_MS = 60 * 60 * 1000;

function getGitHubUser(username, callback) {
    var token = cookieJar.has('access_token') && cookieJar.get('valid_auth') ? '?access_token=' + cookieJar.get('access_token') : '',
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
            "html_url": "",
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
            userCookie = cookieJar.get(userKey);
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
            return $.getJSON([API_URL, 'users', username].join('/') + token);
        }
    }

    function getRepos(username) {
        var reposCookie = null,
            reposData = null,
            dfRepos =  null,
            blank =  null,
            repos_url = [API_URL, 'users', username, 'repos'].join('/') + token;

        // check if cookies exists for username
        if (cookieJar.has(repos_url)) {
            reposCookie = cookieJar.get(repos_url);
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
            storeResponse = cookieJar.set(user.login, userCookie);
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
                repos_url = [API_URL, 'users', username, 'repos'].join('/') + token,
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
                storeResponse = cookieJar.set(repos_url, reposCookie);
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
                getJsonArray.push(getRepoLangs([repo_url, 'languages'].join('/') + token, i));
                REPO_STATS_URLS.forEach(function (stat) {
                    statsHash[i] = {};
                    getJsonArray.push(getRepoStats([repo_url, 'stats', stat].join('/') + token, i, stat));
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
