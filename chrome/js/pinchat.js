/*
 * StackExchangeNotifications 1.0.0
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(doc, browser) {
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
        var style = doc.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = browser.extension.getURL("/css/" + url);

        doc.body.appendChild(style);
    }

    function createLink(el)
    {
        if (el.querySelectorAll(".inroom-heart-icon").length) {
            return;
        }

        var
            link = document.createElement("a"),
            icon = document.createElement("i"),
            text = document.createTextNode("save room"),
            division = document.createTextNode("|"),
            space1 = document.createTextNode(" "),
            space2 = document.createTextNode(" ")
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
        var els = document.querySelectorAll(".roomcard, [id^=room-], #sidebar-menu");

        for (var i = els.length - 1; i >= 0; i--) {
            if (els[i].id === "sidebar-menu") {
                createLink(els[i]);
            }
        }
    }

    function bootPinChat()
    {
        loadCss("pinchat.css");

        appendLinks();
    }

    if (/^(interactive|complete)$/i.test(doc.readyState)) {
        bootPinChat();
    } else {
        doc.addEventListener("DOMContentLoaded", bootPinChat);
        window.addEventListener("load", bootPinChat);
    }
})(document, chrome||browser);
