/*
 * StackExchangeNotifications 1.1.0
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    var browser = w.chrome||w.browser,
        hideRegExp = /\bsen-tools-hide\b/g,
        readyRegExp = /^(interactive|complete)$/,
        notification,
        hideTimer;

    if (!w.StackExchangeNotifications) {
        w.StackExchangeNotifications = {};
    }

    if (!w.StackExchangeNotifications.utils) {
        w.StackExchangeNotifications.utils = {};
    }

    var Utils = w.StackExchangeNotifications.utils;

    Utils.showLabelNotification = function (label, timeout, callback) {
        if (!notification) {
            notification = d.createElement("div");
            notification.className = "sen-tools-popup sen-tools-hide";

            d.body.appendChild(notification);
        }

        if (hideTimer) {
            clearTimeout(hideTimer);
        }

        notification.textContent = label;
        notification.className =
            notification.className
                .replace(hideRegExp, " ")
                    .replace(/\s\s/g, " ")
                        .trim();

        hideTimer = setTimeout(function () {
            notification.className += " sen-tools-hide";
            callback && callback();
        }, timeout ? timeout : 2000);
    };

    Utils.convertResult = function (size) {
        if (size === 0) {
            return "";
        } else if (size < 1000) {
            return String(size);
        }

        return "+1k";
    };

    Utils.isHide = function (elem) {
        if (elem.offsetParent) {
            return false;
        }

        var prop = w.getComputedStyle(elem, null);
        return prop.display === "none" || prop.visibility === "hidden";
    };

    Utils.eventDay = function (date) {
        var t = date ? new Date(date) : new Date;

        return (t.getDate() == 31 && t.getMonth() == 9) ||
               (t.getDate() == 13 && t.getDay() == 5)
    };

    Utils.resource = function (url, callback) {
        var xhr = new XMLHttpRequest,
            url = browser.extension.getURL(url);

        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                callback(xhr.responseText + "");
                xhr = null;
            }
        };

        xhr.send(null);
    };

    Utils.resourceStyle = function (url) {
        var style = d.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = browser.extension.getURL("/css/" + url + ".css");

        d.body.appendChild(style);
        return style;
    };

    Utils.ready = function (callback) {
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
})(window, document);
