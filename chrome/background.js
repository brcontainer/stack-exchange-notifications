/*
 * StackExchangeNotifications 0.0.8
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

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
            "text": StackExchangeNotifications.utils.convertResult(response.score + response.inbox)
        });
    });
})();
