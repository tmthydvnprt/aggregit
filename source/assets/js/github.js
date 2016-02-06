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
// GitHub App Config
var github_oauth_url = 'https://github.com/login/oauth/authorize?',
    github_id = '85bd6112f2a60a7edd66',
    github_callback = 'http://aggregit.com/#!/authenticate',
    github_scope = '',
    oauth_proxy_url = 'http://aggregit-proxy-576273.appspot.com/?';

function deparam(string) {
    var params = {},
        pair,
        i;
    // Remove url portion of string
    string = string.substring(string.indexOf('?') + 1).split('&');
    // Parse
    for (i = string.length; i > 0;) {
        pair = string[--i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return params;
}

function github_authorize() {
    console.log('Getting GitHub Authorization');

    var url = '',
        state = Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8);

    // store state in cookie for later
    cookieJar.set('state', state);

    // Create url to access GitHub authentication
    url = github_oauth_url + $.param({
        'client_id' : github_id,
        'redirect_url' : github_callback,
        'scope' : github_scope,
        'state' : state
    });

    // Request authorization
    console.log(url);
    location.href = url;
}

function github_authenticate() {
    console.log('Getting GitHub Authentication');

    // Get GitHub authentication from redirected url
    var auth = deparam(window.location.search),
        url = '';

    // Check that state is valid
    if (cookieJar.get('state') === auth['state'] ) {
        console.log('state is good');
        // Turn authorization code into access token
        url = oauth_proxy_url + $.param(auth);

        $.getJSON(url, function(access) {
            if (access.hasOwnProperty('access_token')) {
                console.log('token is good');
                console.log('authenticated');
                cookieJar.set('access_token', access['access_token']);
                location.href = location.href.replace(location.search, '').replace(location.hash, '') + '#!/home';
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
}
