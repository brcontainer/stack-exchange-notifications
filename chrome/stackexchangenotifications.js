/*
 * StackExchangeNotifications 0.0.1
 * Copyright (c) 2015 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function() {
    "use strict";

    var delay = 60; //In seconds

    var unreadCountsURI = "http://stackexchange.com/topbar/get-unread-counts",
        achievementsURI = "http://stackexchange.com/topbar/achievements",
        inboxURI        = "http://stackexchange.com/topbar/inbox";

    var inbox = 0,
        score = 0;

    var isRunning = false,
        timer = null,
        senCallback;

    var noCacheURI = function(uri) {
        return [ uri, "?_=", new Date().getTime() ].join("");
    };

    var quickXHR = function(uri, callback) {
        var xhr       = new XMLHttpRequest(),
            completed = false;

        uri = noCacheURI(uri);

        xhr.open("GET", uri, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                callback(xhr.status === 200 ? xhr.responseText : { "error": xhr.status });
            }
        };

        xhr.send(null);

        return {
            "abort": function() {
                if (completed === false)
                    try {
                        xhr.abort();
                    } catch (ee) {}
            }
        };
    };

    var retrieveData = function() {
        quickXHR(unreadCountsURI, trigger);
        //trigger('{"UnreadRepCount": 10, "UnreadInboxCount": 100}');
    };

    var getResult = function(target) {
        var el, result = 0;

        if (target.length > 0) {
            el = target[0];
            if (el.display !== "none") {
                result = parseInt(el.innerHTML);
            }
        }

        return isNaN(result) ? 0 : result;
    };

    var trigger = function(response) {
        if (typeof response === "string") {
            var data = JSON.parse(response);
            if (typeof data.UnreadRepCount !== "undefined") {

                score = data.UnreadRepCount;
                inbox = data.UnreadInboxCount;

                senCallback({
                    "score": score,
                    "inbox": inbox
                });
            }
        }

        timer = setTimeout(retrieveData, 1000 * delay);
    };

    window.StackExchangeNotifications = {
        "pushs": function(callback) {
            if (false === isRunning && typeof callback === "function") {
                isRunning   = true;
                senCallback = callback;
                retrieveData();
            }
        },
        "achievements": function(callback) {
            if (typeof callback === "function") {
                return quickXHR(achievementsURI, callback);
            }
            return null;
        },
        "inbox": function(callback) {
            if (typeof callback === "function") {
                return quickXHR(inboxURI, callback);
            }
            return null;
        },
        "setScore": function(size) {
            if (size % 1 === 0) {
                score = size;
            }
        },
        "setInbox": function(size) {
            if (size > 0 && size % 1 === 0) {
                inbox = size;
            }
        },
        "getScore": function() {
            return score;
        },
        "getInbox": function() {
            return inbox;
        },
        "update": function(reload) {
            if (false === isRunning) {
                return;
            }

            if (reload === true) {
                if (timer !== false) {
                    clearTimeout(timer);
                }

                setTimeout(retrieveData, 1);
            } else {
                senCallback({
                    "score": score,
                    "inbox": inbox
                });
            }
        }
    };
}());
