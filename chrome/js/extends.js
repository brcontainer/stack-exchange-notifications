/*
 * StackExchangeNotifications 1.0.7
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d, browser) {
    var readyRegExp = /^(interactive|complete)$/;

    if (!w.StackExchangeNotifications) {
        w.StackExchangeNotifications = { "utils": {} };
    }

    w.StackExchangeNotifications.utils.eventDay = function (date) {
        var t = date ? new Date(date) : new Date;

        return (t.getDate() == 31 && t.getMonth() == 9) ||
               (t.getDate() == 13 && t.getDay() == 5)
    };

    w.StackExchangeNotifications.utils.resource = function (url, callback) {
        var
            xhr = new XMLHttpRequest(),
            url = browser.extension.getURL(url)
        ;

        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                callback(xhr.responseText + "");
                xhr = null;
            }
        };

        xhr.send(null);
    };

    w.StackExchangeNotifications.utils.resourceStyle = function (url) {
        var style = d.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = browser.extension.getURL("/css/" + url + ".css");

        d.body.appendChild(style);
    };

    w.StackExchangeNotifications.utils.ready = function (callback) {
        var started = false;

        function trigger() {
            if (started) {
                return;
            }

            started = true;

            callback();
        };

        if (readyRegExp.test(d.readyState)) {
            trigger();
        } else {
            d.addEventListener("DOMContentLoaded", trigger);
            w.addEventListener("load", trigger);
        }
    };
})(window, document, chrome||browser);
