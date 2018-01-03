/*
 * StackExchangeNotifications 1.0.7
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d, browser) {
    "use strict";

    var running = false,
        unreadRegExp       = /(^|\s)(js-unread-count|unread-count)(\s|$)/,
        inboxRegExp        = /(^|\s)(js-inbox-button|icon-inbox)(\s|$)/,
        achievementsRegExp = /(^|\s)(js-achievements-button|icon-achievements)(\s|$)/
    ;

    function isHide(elem)
    {
        var prop = w.getComputedStyle(elem, null);

        return prop.getPropertyValue("display") === "none" ||
                prop.getPropertyValue("visibility") === "hidden";
    }

    function sendNotification(type, el, fromload)
    {
        if (type && el && browser && browser.runtime && browser.runtime.sendMessage) {
            var data = isHide(el) ? 0 : (el.textContent ? parseInt(el.textContent) : 0);

            if (fromload && data < 1) {
                return;
            }

            browser.runtime.sendMessage({
                "data": data,
                "type": type
            }, function (response) {});
        }
    }

    function updateStates(mutations)
    {
        mutations.forEach(function (mutation) {
            var type, checkTab, el = mutation.target;

            if (unreadRegExp.test(el.className)) {
                if (achievementsRegExp.test(el.parentNode.className)) {
                    type = "achievements";
                } else if (inboxRegExp.test(el.parentNode.className)) {
                    type = "inbox";
                }

                sendNotification(type, el, false);
            }
        });
    }

    function applyEvents()
    {
        if (running) {
            return;
        }

        var networkSE = d.querySelector(".network-items, body > header .secondary-nav");

        if (!networkSE) {
            setTimeout(applyEvents, 1000);
            return;
        }

        running = true;

        var inboxUnred = ".js-inbox-button > .js-unread-count," +
                         ".icon-inbox > .js-unread-count," +
                         ".js-inbox-button > .unread-count," +
                         ".icon-inbox > .unread-count";

        var achievementsUnred = ".js-achievements-button > .js-unread-count," +
                                ".icon-achievements > .js-unread-count," +
                                ".js-achievements-button > .unread-count," +
                                ".icon-achievements > .unread-count";

        sendNotification("inbox", networkSE.querySelector(inboxUnred), true);
        sendNotification("achievements", networkSE.querySelector(achievementsUnred), true);

        var observer = new MutationObserver(updateStates);

        observer.observe(networkSE, {
            "subtree": true,
            "childList": true,
            "attributes": true
        });

        browser.runtime.sendMessage("changebydom", function (response) {});
    }

    StackExchangeNotifications.utils.ready(applyEvents);
})(window, document, chrome||browser);
