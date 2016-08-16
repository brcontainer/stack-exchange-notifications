/*
 * StackExchangeNotifications 1.0.0
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(browser) {
    "use strict";

    var DELAY = 5;

    var timer;

    function userIsActive(type)
    {
        if (browser && browser.runtime && browser.runtime.sendMessage) {
            browser.runtime.sendMessage({ "sleepMode": !type }, function(response) {});
            return;
        }

        //Try sending again if the browser.runtime is not available
        if (type === false) {
            triggerInactive();
        }
    }

    function triggerInactive()
    {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(function() {
            userIsActive(false);
        }, DELAY * 1000);
    }

    function detectUserActivity(evt)
    {
        userIsActive(true);
        triggerInactive();
    }

    if (browser && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage("desktopnotification", function(response) {
            if (response && response.available) {
                document.addEventListener("mousemove", detectUserActivity, true);
                document.addEventListener("keydown",   detectUserActivity, true);
            }
        });
    }
})(chrome||browser);
