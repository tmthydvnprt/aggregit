/*globals $,console,d3,cookieJar,isObject,copyBIfInA */
/*!
 * common.js
 *
 * Copyright 2015 Timothy Davenport; Licensed MIT
 */

// Common Utility functions used across files
// -------------------------------------------------------------------------------------
(function () {
    'use strict';
    // Add string formatting
    if (!String.prototype.format) {
        String.prototype.format = function (a) {
            var str = this.toString(),
                args = null,
                arg = null;
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
    // Check if variable is object
    window.isObject = function (a) {
        return (!!a) && (a.constructor === Object);
    };
    // Copies elements in B iff they are also already in A
    window.copyBIfInA = function (a, b) {
        var key = '';
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
    };
    // Parses a header string as returned by xhr.getAllResponseHeaders()
    window.parse_headers = function (header_string) {
        var lines = header_string.trim().split('\n'),
            headers = {},
            i = 0,
            keyval = [],
            key = '',
            val = '',
            number = null,
            date = null;

        // Loop thru header lines
        for (i = 0; i < lines.length; i += 1) {
            // Split line on first `:` for key:val par
            keyval = lines[i].split(/:([\s\w]*)/);
            key = keyval[0].trim();
            val = keyval[1].trim();
            // Try to parse value as null
            if (val === "") {
                val = null;
            } else {
                // Try to parse as number
                number = parseInt(val, 10);
                if (!isNaN(number)) {
                    val = number;
                } else {
                    // Try to parse as number
                    date = new Date(val);
                    if (!isNaN(date.getTime())) {
                        val = date;
                    }
                    // Leave as string
                }
            }
            // Place in object
            headers[key] = val;
        }
        return headers;
    };
    // Clean url to use a key
    window.unurl = function (url) {
        return url.replace(/\//ig, '_');
    };
    // Custom Date formater
    window.formatDate = function (d) {
        var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '{0} {1}, {2}'.format(MONTHS[d.getMonth()], d.getDate(), d.getFullYear());
    };
    // Convert date into YYYY-MM-DD string
    window.date2str = function (d) {
        return '{0}-{1}-{2}'.format(d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2));
    };
    // Inverse of $.param, parses string for url parameters
    window.deparam = function (string) {
        var params = {},
            pair = [],
            i = 0;
        // Remove url portion of string
        string = string.substring(string.indexOf('?') + 1).split('&');
        // Parse
        for (i = 0; i < string.length; i += 1) {
            pair = string[i].split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return params;
    };
}());
