/*
 * StackExchangeNotifications 1.2.2
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    var unreadRegExp       = /\b(js-unread-count|unread-count)\b/,
        inboxRegExp        = /\b(js-inbox-button|icon-inbox)\b/,
        achievementsRegExp = /\b(js-achievements-button|icon-achievements)\b/;

    function sendNotification(type, el, fromload)
    {
        if (type && el && browser && browser.runtime && browser.runtime.sendMessage) {
            var data = StackExchangeNotifications.utils.isHide(el) ? 0 : (el.textContent ? parseInt(el.textContent) : 0);

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
        var networkSE = d.querySelector(".network-items, body > header .secondary-nav");

        if (!networkSE) {
            setTimeout(applyEvents, 1000);
            return;
        }

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
})(window, document);
