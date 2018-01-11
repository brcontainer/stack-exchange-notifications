/*
 * StackExchangeNotifications 1.1.0
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w) {
    "use strict";

    var browser = w.chrome||w.browser, caller = null, callerTheme = [];

    StackExchangeNotifications.boot();

    w.detectUpdate = function (callback) {
        if (typeof callback === "function" || callback === null) {
            caller = callback;
        }
    };

    StackExchangeNotifications.pushs(function (response) {
        if (caller) {
            caller();
        }

        var updates = 0;

        if (response.inbox > 0 && StackExchangeNotifications.switchEnable("inbox")) {
            updates = response.inbox;
        }

        if (response.acquired > 0 && StackExchangeNotifications.switchEnable("acquired")) {
            ++updates;
        }

        if (response.score !== 0 && StackExchangeNotifications.switchEnable("score")) {
            ++updates;
        }

        browser.browserAction.setBadgeText({
            "text": StackExchangeNotifications.utils.convertResult(updates)
        });
    });

    function updateChanges(type, value)
    {
        switch (type) {
            case "inbox":
                if (value !== StackExchangeNotifications.getInbox()) {
                    StackExchangeNotifications.setInbox(value);
                }
            break;

            case "achievements":
                var achievements = StackExchangeNotifications.getAchievements();

                if (value !== achievements.score + achievements.acquired) {
                    StackExchangeNotifications.setAchievements(value);
                }
            break;
        }

        StackExchangeNotifications.update();
    }

    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request === "desktopnotification") {
            sendResponse({
                "available": StackExchangeNotifications.switchEnable("desktop_notification")
            });
        } else if (request === "gallery") {
            sendResponse({
                "available": StackExchangeNotifications.switchEnable("gallery_box")
            });
        } else if (request === "editor") {
            sendResponse({
                "lastcheck": StackExchangeNotifications.restoreState("lastcheck"),
                "available": StackExchangeNotifications.switchEnable("editor_actived"),
                "preview":   StackExchangeNotifications.switchEnable("editor_preview"),
                "inverted":  StackExchangeNotifications.switchEnable("editor_inverted"),
                "italic":    StackExchangeNotifications.switchEnable("editor_italic"),
                "scroll":    StackExchangeNotifications.switchEnable("editor_sync_scroll"),
                "indent":    StackExchangeNotifications.switchEnable("editor_tabs_by_spaces"),
                "full":      StackExchangeNotifications.switchEnable("editor_auto_fs"),
                "theme":     StackExchangeNotifications.switchEnable("dark_theme") ?
                                                                            "dark" : null
            });
        } else if (request === "extras") {
            sendResponse({
                "copycode": StackExchangeNotifications.switchEnable("copy_code")
            });
        } else if (request === "changebydom") {
            StackExchangeNotifications.detectDOM(true);
        } else if (request.type) {
            updateChanges(request.type, request.data);
        } else if (request.chat) {
            var url = request.url,
                type = request.chat,
                rooms = StackExchangeNotifications.restoreState("saved_rooms", true) || {};

            if (type === 1) {
                delete request.url;
                rooms[url] = request;
            } else if (type === 2) {
                delete rooms[url];
            } else if (type === 3) {
                sendResponse({ "added": !!rooms[url] });
            }

            if (type > 0 && type < 3) {
                StackExchangeNotifications.saveState("saved_rooms", rooms, true);
                sendResponse(true);
            }
        } else if (request.hasOwnProperty("storeimages")) {
            if (request.storeimages === true) {
                var cssbg = StackExchangeNotifications.restoreState("cssbg");

                if (cssbg) {
                    sendResponse(cssbg);
                    cssbg = null;
                }
            } else {
                StackExchangeNotifications.utils.generateCssImages(request.storeimages, function (data) {
                    StackExchangeNotifications.saveState("cssbg", data);
                    sendResponse(data);
                });

                return true;
            }
        }
    });
})(window);
