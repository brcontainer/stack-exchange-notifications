/*
 * StackExchangeNotifications 1.2.2
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    var link,
        rooms = {},
        addedRegExp = /\bsen-added\b/g,
        removeMsg = "Do you really want to remove this room?";

    function parseUrl(url)
    {
        return String(url).replace(/^https?:\/\//i, "").replace(/\/(\d+)\/.*(\?[\s\S]+)?([#][\s\S]+)?$/, "/$1");
    }

    function toggleClass(link, add)
    {
        if (!link) {
            return;
        }

        link.className = link.className.replace(addedRegExp, "").trim();

        if (add) {
            link.className += " sen-added";
        }
    }

    function bgData(data, callback)
    {
        if (browser && browser.runtime && browser.runtime.sendMessage) {
            data.url = parseUrl(data.url);
            browser.runtime.sendMessage(data, callback);
        }
    }

    function togglePinchat(pinned, room, link)
    {
        if (pinned) {
            var url, roomName, roomIco = room.querySelector(".small-site-logo");

            if (room !== d) {
                url = room.querySelector(".room-name a[href^='/']").href;
                var el = room.querySelector(".room-name, .roomname");

                if (el) {
                    roomName = el.title;
                }
            } else {
                url = w.location.href;
                var el = room.getElementById("roomname");

                if (el) {
                    roomName = el.textContent;
                }
            }

            bgData({
                "chat": 1,
                "icon": roomIco ? roomIco.src : "",
                "title": roomName,
                "url": url
            }, function (response) {
                if (response) {
                    toggleClass(link, true);
                }
            });
        } else if (w.confirm(removeMsg)) {
            bgData({ "chat": 2, "url": url }, function (response) {
                if (response) {
                    toggleClass(link, false);
                }
            });
        }
    }

    function createLink(el, rc)
    {
        if (el.getElementsByClassName("sen-btn-pin").length) {
            return;
        }

        var icon = d.createElement("i"),
            link = d.createElement("a"),
            division,
            space,
            url;

        if (!rc) {
            division = d.createTextNode("|");
            space = d.createTextNode(" ");
            url = w.location.href;
        } else {
            url = el.querySelector(".room-name a[href^='/']").href;
        }

        url = parseUrl(url);

        link.href = "javascript:void(0);";
        link.className = "sen-btn-pin";

        if (rooms[url]) {
            link.className += " sen-added";
        }

        link.onclick = function (e) {
            e.preventDefault();
            togglePinchat(!addedRegExp.test(link.className), rc ? el : d, link);
        };

        icon.className = "sen-inroom-heart-icon";

        link.appendChild(icon);

        if (!rc) {
            el.appendChild(division);
            el.appendChild(space);
            el.appendChild(link);
        } else {
            el.insertBefore(link, el.firstElementChild);
        }
    }

    function appendLinks()
    {
        var els, mainChat = d.getElementById("sidebar-menu");

        if (mainChat) {
            els = [mainChat];
        } else {
            els = d.querySelectorAll(".roomcard, [id^=room-]");
        }

        for (var i = els.length - 1; i >= 0; i--) {
            if (els[i].id === "sidebar-menu") {
                createLink(els[i], false);
                break;
            } else if (els[i].matches(".roomcard, [id^=room-]")) {
                createLink(els[i], true);
            }
        }
    }

    function observerPinChat()
    {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.target.matches("#roomlist, .roomcard, * .roomcard")) {
                    appendLinks();
                    return;
                }
            });
        });

        observer.observe(d.body, {
            "subtree": true,
            "childList": true,
            "attributes": false
        });
    }

    function bootPinChat()
    {
        StackExchangeNotifications.utils.resourceStyle("pinchat");

        bgData({ "chat": 3 }, function (response) {
            if (response.rooms) {
                rooms = response.rooms;
            }

            appendLinks();
            observerPinChat();
        });
    }

    StackExchangeNotifications.utils.ready(bootPinChat);
})(window, document);
