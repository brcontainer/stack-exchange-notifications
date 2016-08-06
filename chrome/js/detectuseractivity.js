/*
 * StackExchangeNotifications 0.1.3
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function() {
    "use strict";

    var DELAY = 5;

    var timer;

    function userIsActive(type)
    {
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ "sleepMode": !type }, function(response) {});
            return;
        }

        //Try sending again if the chrome.runtime is not available
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

    document.addEventListener("mousemove", detectUserActivity, true);
    document.addEventListener("keydown",   detectUserActivity, true);
})();
