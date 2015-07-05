/*
 * StackExchangeNotifications 0.0.2
 * Copyright (c) 2015 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

function convertResult(size) {
    if (size === 0) {
        return "";
    } else if (size < 1000) {
        return String(size);
    }

    return "+1000";
}

(function() {
    var caller = null;

    window.detectUpdate = function(callback) {
        if (typeof callback === "function") {
            caller = callback;
        }
    };

    window.resetScore = function() {
        StackExchangeNotifications.setScore(0);
        StackExchangeNotifications.update();
    };

    window.resetInbox = function() {
        StackExchangeNotifications.setInbox(0);
        StackExchangeNotifications.update();
    };

    StackExchangeNotifications.pushs(function(response) {
        if (caller) {
            caller();
        }

        chrome.browserAction.setBadgeText({
            "text": convertResult(response.score + response.inbox)
        });
    });
})();
