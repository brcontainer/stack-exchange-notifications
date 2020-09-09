/*
 * StackExchangeNotifications
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w) {
    "use strict";

    var sn = StackExchangeNotifications;

    sn.boot();
    sn.background();

    sn.pushs(function (response) {
        var updates = 0;

        if (response.inbox > 0 && sn.switchEnable("inbox")) {
            updates = response.inbox;
        }

        if (response.acquired > 0 && sn.switchEnable("acquired")) {
            ++updates;
        }

        if (response.score !== 0 && sn.switchEnable("score")) {
            ++updates;
        }

        browser.browserAction.setBadgeText({
            "text": sn.utils.convertResult(updates)
        });
    });

    function updateChanges(type, value)
    {
        if (type === "achievements") {
            var data = sn.getAchievements();

            if (value !== data.score + data.acquired) {
                sn.setAchievements(value);
            }
        } else if (type === "inbox" && value !== sn.getInbox()) {
            sn.setInbox(value);
        }

        sn.update();
    }

    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request === "gallery") {
            sendResponse({
                "available": sn.switchEnable("gallery_box")
            });
        } else if (request === "editor") {
            sendResponse({
                "lastcheck": sn.restoreState("lastcheck"),
                "available": sn.switchEnable("editor_actived"),
                "preview":   sn.switchEnable("editor_preview"),
                "inverted":  sn.switchEnable("editor_inverted"),
                "italic":    sn.switchEnable("editor_italic"),
                "scroll":    sn.switchEnable("editor_sync_scroll"),
                "indent":    sn.switchEnable("editor_tabs_by_spaces"),
                "full":      sn.switchEnable("editor_auto_fs"),
                "theme":     sn.switchEnable("dark_theme") ? "dark" : null
            });
        } else if (request === "extras") {
            sendResponse({
                "copycode": sn.switchEnable("copy_code")
            });
        } else if (request === "update") {
            sn.update();
        } else if (request === "changebydom") {
            sn.detectDOM(true);
        } else if (request.type) {
            updateChanges(request.type, request.data);
        } else if (request.chat) {
            var url = request.url,
                type = request.chat,
                rooms = sn.restoreState("saved_rooms", true) || {};

            if (type === 1) {
                delete request.url;
                rooms[url] = request;
            } else if (type === 2) {
                delete rooms[url];
            } else if (type === 3) {
                var update = false, adjust = {};

                for (var room in rooms) {
                    //Fix urls in from old version
                    if (/^https?:/i.test(room)) {
                        var newName = room.replace(/^https?:\/\//i, "").replace(/\/(\d+)\/.*(\?[\s\S]+)?([#][\s\S]+)?$/, "/$1");
                        adjust[newName] = rooms[room];
                        update = true;
                    } else {
                        adjust[room] = rooms[room];
                    }
                }

                if (update) {
                    rooms = adjust;
                    sn.saveState("saved_rooms", adjust, true);
                }

                sendResponse({ "rooms": rooms });

                adjust = null;
            }

            if (type > 0 && type < 3) {
                sn.saveState("saved_rooms", rooms, true);
                sendResponse(true);
            }

            rooms = null;
        } else if (request.hasOwnProperty("storeimages")) {
            if (request.storeimages === true) {
                var cssbg = sn.restoreState("cssbg");

                if (cssbg) {
                    sendResponse(cssbg);
                    cssbg = null;
                }
            } else {
                sn.utils.generateCssImages(request.storeimages, function (data) {
                    sn.saveState("cssbg", data);
                    sendResponse(data);
                });

                return true;
            }
        }
    });
})(window);
