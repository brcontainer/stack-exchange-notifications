/*
 * StackExchangeNotifications 0.0.10
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function() {
    var caller = null;

    window.detectUpdate = function(callback) {
        if (typeof callback === "function" || callback === null) {
            caller = callback;
        }
    };

    StackExchangeNotifications.pushs(function(response) {
        if (caller) {
            caller();
        }

        var updates = (response.achievements !== 0 ? 1 : 0) + response.inbox;

        chrome.browserAction.setBadgeText({
            "text": StackExchangeNotifications.utils.convertResult(updates)
        });
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        var data = request.data;

        switch (request.clear) {
            case "inbox":
                if (data !== StackExchangeNotifications.getInbox()) {
                    StackExchangeNotifications.setInbox(data);
                }

                StackExchangeNotifications.update();
            break;

            case "achievements":
                if (data !== StackExchangeNotifications.getAchievements()) {
                    StackExchangeNotifications.setAchievements(data);
                }

                StackExchangeNotifications.update();
            break;
        }
    });
})();
