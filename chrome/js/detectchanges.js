/*
 * StackExchangeNotifications 1.0.1
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(w, d, browser) {
    "use strict";

    var running = false;

    function isHide(elem)
    {
        var prop = w.getComputedStyle(elem, null);

        return prop.getPropertyValue("display") === "none" ||
                prop.getPropertyValue("visibility") === "hidden";
    }

    function updateStates(mutations)
    {
        mutations.forEach(function (mutation) {
            var type, checkTab, el = mutation.target;

            if (/(^|\s)unread-count($|\s)/.test(el.className)) {
                if (/(^|\s)icon-achievements($|\s)/.test(el.parentNode.className)) {
                    type = "achievements";
                } else if (/(^|\s)icon-inbox($|\s)/.test(el.parentNode.className)) {
                    type = "inbox";
                }

                if (type && browser && browser.runtime && browser.runtime.sendMessage) {
                    var data = isHide(el) ? 0 : parseInt(el.textContent);

                    browser.runtime.sendMessage({
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

        var networkSE = d.querySelector(".network-items");

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

    if (/interactive|complete/i.test(d.readyState)) {
        applyEvents();
    } else {
        d.addEventListener("DOMContentLoaded", applyEvents);
        w.addEventListener("onload", applyEvents);
    }
})(window, document, chrome||browser);
