(function() {
    "use strict";

    var DELAY = 5;

    var timer,
        userIsActive,
        triggerInactive;

    userIsActive = function(type) {
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ "sleepMode": !type }, function(response) {});
            return;
        }

        //Try sending again if the chrome.runtime is not available
        if (type === false) {
            triggerInactive();
        }
    };

    triggerInactive = function() {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(function() {
            userIsActive(false);
        }, DELAY * 1000);
    };

    if (chrome && chrome.windows) {
        chrome.windows.onFocusChanged.addListener(function(windowId) {
            if (windowId === -1) {
                userIsActive(false);
            } else {
                chrome.windows.get(windowId, function(chromeWindow) {
                    userIsActive(chromeWindow.state !== "minimized");
                });
            }
        });
    }

    document.addEventListener("mousemove", function(evt) {
        userIsActive(true);
        triggerInactive();
    }, true);
})();
