/*globals $,console,d3,cookieJar */
/*!
 * common.js
 *
 * Copyright 2015 Timothy Davenport; Licensed MIT
 */

// Common Utility functions used across files
// -------------------------------------------------------------------------------------
// check if variable is object
function isObject(a) {
    "use strict";
    return (!!a) && (a.constructor === Object);
}
// Copies elements in B iff they are also already in A
function copyBIfInA(a, b) {
    "use strict";
    var key;
    a = $.extend(true, {}, a);
    for (key in a) {
        if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
            if (isObject(a[key]) && isObject(b[key])) {
                a[key] = copyBIfInA(a[key], b[key]);
            } else {
                a[key] = b[key];
            }
        }
    }
    return a;
}
// clean url to use a key
function unurl(url) {
    "use strict";
    return url.replace(/\//ig, '_');
}
// add string formatting
if (!String.prototype.format) {
    String.prototype.format = function (a) {
        "use strict";
        var str = this.toString(),
            args,
            arg;
        if (!arguments.length) {
            return str;
        }
        args = typeof a;
        args = ("string" === args || "number" === args) ? arguments : a;
        for (arg in args) {
            if (args.hasOwnProperty(arg)) {
                str = str.replace(new RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
            }
        }
        return str;
    };
}
// Custom Date formater
function formatDate(d) {
    "use strict";
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep Oct', 'Nov', 'Dec'];
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

// Inverse of $.param, parses string for url parameters
function deparam(string) {
    "use strict";
    var params = {},
        pair,
        i;
    // Remove url portion of string
    string = string.substring(string.indexOf('?') + 1).split('&');
    // Parse
    for (i = 0; i < string.length; i += 1) {
        pair = string[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return params;
}
