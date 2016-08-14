/*
 * StackExchangeNotifications 0.2.0
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (doc) {
    "use strict";

    var running = false;

    function isHide(elem)
    {
        if (window.getComputedStyle(elem, null).getPropertyValue("visibility") === "hidden") {
            return true;
        }

        if (window.getComputedStyle(elem, null).getPropertyValue("display") === "none") {
            return true;
        }

        return false;
    }

    function updateStates(mutations)
    {
        mutations.forEach(function (mutation) {
            var type, checkTab, el = mutation.target;

            if (/(^|\s)unread\-count($|\s)/.test(el.className)) {
                if (/(^|\s)icon\-achievements($|\s)/.test(el.parentNode.className)) {
                    type = "achievements";
                } else if (/(^|\s)icon\-inbox($|\s)/.test(el.parentNode.className)) {
                    type = "inbox";
                }

                var data = isHide(el) ? 0 : parseInt(el.textContent);

                if (type && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({
                        "data": data,
                        "clear": type
                    }, function(response) {});
                }
            }
        });
    }

    function applyEvents()
    {
        if (running) {
            return;
        }

        var networkSE = doc.querySelector(".network-items");

        if (!networkSE) {
            return;
        }

        running = true;

        var observer = new MutationObserver(updateStates);

        observer.observe(networkSE, {
            "subtree": true,
            "childList": true,
            "attributes": true
        });
    }

    if (/interactive|complete/i.test(doc.readyState)) {
        applyEvents();
    } else {
        doc.addEventListener("DOMContentLoaded", applyEvents);
        window.addEventListener("onload", applyEvents);
    }
})(document);
