var cookieJar = {
    get: function (key) {
        if (!key) {
            return null;
        } else {
            return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
        }
    },
    set: function (key, value, end, path, domain, secure) {
        if (!key || /^(?:expires|max\-age|path|domain|secure)$/i.test(key)) {
            return false;
        } else {
            var expires = "",
                cookie;
            if (end) {
                expires = (end === Infinity) ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + end;
            }
            cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + expires + (domain ? "; domain=" + domain : "") + (path ? "; path=" + path : "") + (secure ? "; secure" : "");
            document.cookie = cookie;
            return true;
        }
    },
    remove: function (key, path, domain) {
        if (!this.has(key)) {
            return false;
        } else {
            document.cookie = encodeURIComponent(key) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (domain ? "; domain=" + domain : "") + (path ? "; path=" + path : "");
            return true;
        }
    },
    has: function (key) {
        if (!key) {
            return false;
        } else {
            return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
        }
    },
    cookies: function () {
        var keys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/),
            i = 0;
        for (i = 0; i < keys.length; i += 1) {
            keys[i] = decodeURIComponent(keys[i]);
        }
        return keys;
    }
};