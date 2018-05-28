/*
 * StackExchangeNotifications 1.2.0
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    var link,
        added = true,
        addedRegExp = /\bsen-added\b/g,
        removeMsg = "Do you really want to remove this room?",
        browser = w.chrome||w.browser;

    function toggleClass(add)
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
            data.url = String(w.location.href).replace(/(#|\?)[\s\S]+$/, "");
            browser.runtime.sendMessage(data, callback);
        }
    }

    function pinchat(pinned)
    {
        if (pinned) {
            var roomIco = d.querySelector(".small-site-logo"),
                roomName = d.getElementById("roomname");

            bgData({
                "chat": 1,
                "icon": roomIco ? roomIco.src : "",
                "title": roomName ? roomName.textContent : ""
            }, function (response) {
                if (response) {
                    toggleClass(true);
                }
            });
        } else if (w.confirm(removeMsg)) {
            bgData({ "chat": 2 }, function (response) {
                if (response) {
                    toggleClass(false);
                }
            });
        }
    }

    function createLink(el)
    {
        if (el.getElementsByClassName(".inroom-heart-icon").length) {
            return;
        }

        link = d.createElement("a");

        var icon = d.createElement("i"),
            division = d.createTextNode("|"),
            space = d.createTextNode(" ");

        link.href = "javascript:void(0);";
        link.className = "sen-btn-pin";

        if (added) {
            link.className += " sen-added";
        }

        link.onclick = function (e) {
            e.preventDefault();
            pinchat(!addedRegExp.test(link.className));
        };

        icon.className = "sen-inroom-heart-icon";

        link.appendChild(icon);

        el.appendChild(division);
        el.appendChild(space);
        el.appendChild(link);
    }

    function appendLinks()
    {
        var els = d.querySelectorAll(".roomcard, [id^=room-], #sidebar-menu");

        for (var i = els.length - 1; i >= 0; i--) {
            if (els[i].id === "sidebar-menu") {
                createLink(els[i]);
                break;
            }
        }
    }

    function bootPinChat()
    {
        StackExchangeNotifications.utils.resourceStyle("pinchat");

        bgData({ "chat": 3 }, function (response) {
            added = (response && response.added);
            appendLinks();
        });
    }

    StackExchangeNotifications.utils.ready(bootPinChat);
})(window, document);
