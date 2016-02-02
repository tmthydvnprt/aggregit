/*globals $,console,cookieJar */
/*!
 * oauth.js
 *
 * Copyright 2015 Timothy Davenport; Licensed MIT
 */
$(document).ready(function () {
    'use strict';

    var github_oauth_url = 'https://github.com/login/oauth/authorize?',
        github_id = '85bd6112f2a60a7edd66',
        github_callback = 'http://aggregit.com/a',
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

    function authorize() {
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

    function authenticate() {
        // Get GitHub authentication from redirected url
        var auth = deparam(window.location.search),
            url = '';
        // Check that state is valid
        if (cookieJar.get('state') === auth['state'] ) {
            console.log('state is good');
            // Turn authorization code into access token
            url = oauth_proxy_url + $.param(auth);
            $.getJSON(url, function(access) {
                console.log(access);
                if (access.hasOwnProperty('access_token')) {
                    cookieJar.set('access_token', access['access_token']);
                } else {
                    console.log('no token: proxy error');
                }
            });
        } else {
            console.log('state is bad');
            // should abort
        }

    }

    $('#authorize').click(function (e) {
        authorize();
    });

    $('#authenticate').click(function (e) {
        authenticate();
    });

});
