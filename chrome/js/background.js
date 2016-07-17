/*
 * StackExchangeNotifications 0.0.12
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

    var idMessages = [];

    var GetMessages = function()
    {
        StackExchangeNotifications.clearCache("inbox");

        StackExchangeNotifications.inbox(function(data, code) {
            if (code == 200 && data.indexOf("<") !== -1) {
                var tmpParseDom = document.createElement("div");

                tmpParseDom.innerHTML = StackExchangeNotifications.utils.cleanDomString(data);

                var
                    type,
                    summary,
                    location,
                    currentEl,
                    relist = [],
                    els = tmpParseDom.querySelectorAll("li.unread-item a");

                for (var i = els.length - 1; i >= 0; i--) {
                    currentEl = els[i];

                    if (idMessages.indexOf(currentEl.href) === -1) {
                        idMessages.push(currentEl.href);

                        type     = currentEl.querySelector(".item-type");
                        summary  = currentEl.querySelector(".item-summary");
                        location = currentEl.querySelector(".item-location");

                        if (type && summary && location) {
                            relist.push({
                                "id":       currentEl.href,
                                "type":     type.textContent.trim(),
                                "summary":  summary.textContent.trim(),
                                "location": location.textContent.trim(),
                            });
                        }
                    }
                }

                relist = relist.reverse();

                for (var i = relist.length - 1; i >= 0; i--) {
                    var obj = relist[i];

                    StackExchangeNotifications.notify(
                        obj.href,
                        obj.type + " in " + obj.location,
                        obj.summary
                    );
                }

                obj =
                els =
                type =
                relist =
                summary =
                location =
                currentEl = null;
            }
        });
    };

    StackExchangeNotifications.pushs(function(response) {
        if (caller) {
            caller();
        }

        var updates = (response.achievements !== 0 ? 1 : 0) + response.inbox;

        if (response.inbox > 0) {
            setTimeout(GetMessages, 200);
        }

        chrome.browserAction.setBadgeText({
            "text": StackExchangeNotifications.utils.convertResult(updates)
        });
    });

    chrome.notifications.onClicked.addListener(function(notificationId, byUser) {
        if (/^(http|https):\/\//.test(notificationId)) {
            setTimeout(function() {
                chrome.tabs.create({ "url": notificationId });
            }, 1);
        }

        chrome.notifications.clear(notificationId);
    });

    chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
        if (notificationId === "inboxDesktopNotification") {
            lastInboxCounter = 0;
        }
    });

    function updateChanges(request) {
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
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.data && request.clear) {
            updateChanges(resquest);
        } else if (request === "editorAvailable") {
            sendResponse(StackExchangeNotifications.enableEditor());
        }
    });
})();
