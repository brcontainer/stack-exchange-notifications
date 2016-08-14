/*
 * StackExchangeNotifications 0.2.0
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
            if (restoreMessages[i] !== true) {
                StackExchangeNotifications.notify(
                    restoreMessages[i].id,
                    restoreMessages[i].title,
                    restoreMessages[i].message
                );
            }
        }
    }

    window.detectUpdate = function(callback) {
        if (typeof callback === "function" || callback === null) {
            caller = callback;
        }
    };

    var idMessages = [];

    function getMessages()
    {
        if (!StackExchangeNotifications.switchEnable("desktop_notification")) {
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
    }

    StackExchangeNotifications.pushs(function(response) {
        if (caller) {
            caller();
        }

        var updates = 0;

        if (response.inbox > 0 && StackExchangeNotifications.switchEnable("inbox")) {
            updates = response.inbox;
        }

        if (response.acquired > 0 && StackExchangeNotifications.switchEnable("acquired")) {
            ++updates;
        } else if (response.score > 0 && StackExchangeNotifications.switchEnable("score")) {
            ++updates;
        }

        if (response.inbox > 0 &&
              StackExchangeNotifications.switchEnable("desktop_notification")
        ) {
            setTimeout(getMessages, 200);
        }

        chrome.browserAction.setBadgeText({
            "text": StackExchangeNotifications.utils.convertResult(updates)
        });
    });

    chrome.notifications.onClicked.addListener(function(id, byUser) {
        var tryUri = id.substr(StackExchangeNotifications.notificationsSession().length);

        if (/^(http|https):\/\//.test(tryUri)) {
            setTimeout(function() {
                chrome.tabs.create({ "url": tryUri });
            }, 1);
        }

        chrome.notifications.clear(id);
        StackExchangeNotifications.removeNotificationFromCache(tryUri);
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

    function updateChanges(request)
    {
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
        if (request === "gallery") {
                sendResponse({
                    "available": StackExchangeNotifications.switchEnable("gallery_box")
                });
        } else if (request === "editor") {
                sendResponse({
                    "available": StackExchangeNotifications.switchEnable("editor_actived"),
                    "preview":   StackExchangeNotifications.switchEnable("editor_preview"),
                    "inverted":  StackExchangeNotifications.switchEnable("editor_inverted"),
                    "italic":    StackExchangeNotifications.switchEnable("editor_italic"),
                    "scroll":    StackExchangeNotifications.switchEnable("editor_sync_scroll"),
                    "indent":    StackExchangeNotifications.switchEnable("editor_tabs_by_spaces"),
                    "theme":     StackExchangeNotifications.switchEnable("black_theme") ?
                                                                                "black" : null,
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
