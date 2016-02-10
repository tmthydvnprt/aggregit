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
    return (!!a) && (a.constructor === Object);
}
// Copies elements in B iff they are also already in A
function copyBIfInA(a, b) {
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
    return url.replace(/\//ig, '_');
}
// add string formatting
if (!String.prototype.format) {
    String.prototype.format = function () {
        var str = this.toString(),
            args,
            arg;
        if (!arguments.length) {
            return str;
        }
        args = typeof arguments[0];
        args = ("string" === args || "number" === args) ? arguments : arguments[0];
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
    var MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}
