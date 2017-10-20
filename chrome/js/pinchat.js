/*
 * StackExchangeNotifications 1.0.3
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(d, browser) {
    "use strict";

    return;

    var inprogress = false;

    function bgData(data, callback)
    {
        if (browser && browser.runtime && browser.runtime.sendMessage) {
            browser.runtime.sendMessage(data, callback);
        }
    }

    function pinchat(add)
    {
        if (add) {
            bgData({
                "id": "xxxxx",
                "name": "xxxxx",
                "append": true
            }, callback);
        } else {
        }
    }

    function loadCss(url)
    {
        var style = d.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = browser.extension.getURL("/css/" + url);

        d.body.appendChild(style);
    }

    function createLink(el)
    {
        if (el.getElementsByClassName(".inroom-heart-icon").length) {
            return;
        }

        var
            link = d.createElement("a"),
            icon = d.createElement("i"),
            text = d.createTextNode("save room"),
            division = d.createTextNode("|"),
            space1 = d.createTextNode(" "),
            space2 = d.createTextNode(" ")
        ;

        link.href = "javascript:void(0);";
        link.className = "btn-pin";

        link.onclick = function() {
            alert("Not available");
        };

        icon.className = "inroom-heart-icon";

        link.appendChild(icon);
        link.appendChild(space1);
        link.appendChild(text);

        el.appendChild(division);
        el.appendChild(space2);
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
        loadCss("pinchat.css");

        appendLinks();
    }

    if (/^(interactive|complete)$/i.test(d.readyState)) {
        bootPinChat();
    } else {
        d.addEventListener("DOMContentLoaded", bootPinChat);
        window.addEventListener("load", bootPinChat);
    }
})(document, chrome||browser);
