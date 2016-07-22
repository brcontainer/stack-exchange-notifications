/*
 * StackExchangeNotifications 0.1.3
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function() {
    "use strict";

    var caller = null;

    StackExchangeNotifications.boot();

    var restoreMessages = StackExchangeNotifications.restoreState("notificationbackup", true);

    if (restoreMessages) {
        restoreMessages = restoreMessages.reverse();

        for (var i = restoreMessages.length - 1; i >= 0; i--) {
            StackExchangeNotifications.notify(
                restoreMessages[i].id,
                restoreMessages[i].title,
                restoreMessages[i].message
            );
        }
    }

    window.detectUpdate = function(callback) {
        if (typeof callback === "function" || callback === null) {
            caller = callback;
        }
    };

    var idMessages = [];

    var GetMessages = function()
    {
        if (!StackExchangeNotifications.enableNotifications()) {
            return;
        }

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
                    els = tmpParseDom.querySelectorAll("li.unread-item a")
                ;

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
                                "location": location.textContent.trim()
                            });
                        }
                    }
                }

                relist = relist.reverse();

                for (var i = relist.length - 1; i >= 0; i--) {
                    var obj = relist[i];

                    StackExchangeNotifications.notify(
                        obj.id,
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

    setTimeout(function() {

    StackExchangeNotifications.pushs(function(response) {
        if (caller) {
            caller();
        }

        var updates = (response.achievements !== 0 ? 1 : 0) + response.inbox;

        if (response.inbox > 0 && StackExchangeNotifications.enableNotifications()) {
            setTimeout(GetMessages, 200);
        }

        chrome.browserAction.setBadgeText({
            "text": StackExchangeNotifications.utils.convertResult(updates)
        });
    });

    }, 10000);

    chrome.notifications.onClicked.addListener(function(id, byUser) {
        if (/^(http|https):\/\//.test(id)) {
            setTimeout(function() {
                chrome.tabs.create({ "url": id });
            }, 1);
        }

        chrome.notifications.clear(id);
    });

    chrome.notifications.onClosed.addListener(function(id, byUser) {
        chrome.notifications.clear(id);
    });

    chrome.windows.onFocusChanged.addListener(function(windowId) {
        if (windowId === -1) {
            StackExchangeNotifications.enableSleepMode(true);
        } else {
            chrome.windows.get(windowId, function(chromeWindow) {
                StackExchangeNotifications.enableSleepMode(chromeWindow.state === "minimized");
            });
        }
    });

    var updateChanges = function(request) {
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
    };

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request === "editor") {
                sendResponse({
                    "available": StackExchangeNotifications.enableEditor(),
                    "preview": StackExchangeNotifications.enablePreferPreview(),
                    "spaceindentation": StackExchangeNotifications.enableReplaceTabsBySpaces()
                });
        } else if (request) {
            if (request.data && request.clear) {
                updateChanges(request);
            } else if (typeof request.sleepMode === "boolean") {
                StackExchangeNotifications.enableSleepMode(request.sleepMode);
            }
        }
    });
})();
