/*
 * StackExchangeNotifications 1.0.3
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(browser) {
    "use strict";

    var caller = null;

    StackExchangeNotifications.boot();

    /*
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
    */

    window.detectUpdate = function(callback) {
        if (typeof callback === "function" || callback === null) {
            caller = callback;
        }
    };

    /*
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
    */

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
        } else if (response.score !== 0 && StackExchangeNotifications.switchEnable("score")) {
            ++updates;
        }

        /*if (response.inbox > 0 &&
              StackExchangeNotifications.switchEnable("desktop_notification")
        ) {
            setTimeout(getMessages, 200);
        }*/

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

                if (value !== achievements.score || value !== achievements.acquired) {
                    StackExchangeNotifications.setAchievements(value);
                }
            break;
        }

        StackExchangeNotifications.update();
    }

    browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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
                "theme":     StackExchangeNotifications.switchEnable("black_theme") ?
                                                                            "black" : null
            });
        } else if (request === "extras") {
            sendResponse({
                "copycode": StackExchangeNotifications.switchEnable("copy_code")
            });
        } else if (request === "changebydom") {
            StackExchangeNotifications.detectDOM(true);
        } else if (request.type) {
            updateChanges(request.type, request.data);
        } else if (request.hasOwnProperty("storeimages")) {
            if (request.storeimages === true) {
                var cssbg = StackExchangeNotifications.restoreState("cssbg", false);

                if (cssbg) {
                    sendResponse(cssbg);
                    cssbg = null;
                }
            } else {
                StackExchangeNotifications.utils.generateCssImages(request.storeimages, function(data) {
                    StackExchangeNotifications.saveState("cssbg", data, false);
                    sendResponse(data);
                });

                return true;
            }
        }
    });
})(chrome||browser);
