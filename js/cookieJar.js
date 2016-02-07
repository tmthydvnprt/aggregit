var cookieJar = {
    get: function (key) {
        if (!key) {
            return null;
        } else {
            return JSON.parse(localStorage.getItem(key));
        }
    },
    set: function (key, value) {
        if (!key) {
            return false;
        } else {
            return localStorage.setItem(key, JSON.stringify(value));
        }
    },
    remove: function (key) {
        if (!this.has(key)) {
            return false;
        } else {
            return localStorage.removeItem(key);
        }
    },
    removeAll: function () {
        var key;
        for (key in localStorage) {
            localStorage.removeItem(key)l
        }
        return null;
    },
    has: function (key) {
        if (!key) {
            return false;
        } else {
            return $.inArray(key, this.cookies()) > -1;
        }
    },
    cookies: function () {
        var keys = [],
            key;
        for (key in localStorage) {
            keys.push(key);
        }
        return keys;
    }
};
