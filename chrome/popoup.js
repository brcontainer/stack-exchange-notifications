/*
 * StackExchangeNotifications 0.0.2
 * Copyright (c) 2015 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

function FF() {
    return false;
}

function setActionAnchor(el) {
    if (el && el.href && el.href.indexOf("http") === 0) {
        el.onclick = function() {
            chrome.tabs.create({ "url": el.href });
        };
        el.ondragstart = FF;
    }
}

function getAllAnchors(target) {
    var els = target.getElementsByTagName("a"), i = 0;
    for (j = els.length; i < j; i++) {
        setActionAnchor(els[i]);
    }
}

function main() {
    "use strict";

    var
        inboxButton         = document.getElementById("inbox-button"),
        inboxContent        = document.getElementById("inbox-content"),
        inboxData           = inboxButton.querySelector("span.data"),
        inboxXhr            = null,
        inboxActive         = false,

        achievementsButton  = document.getElementById("achievements-button"),
        achievementsContent = document.getElementById("achievements-content"),
        achievementsData    = achievementsButton.querySelector("span.data"),
        achievementsXhr     = null,
        achievementsActive  = false,

        aboutButton         = document.getElementById("about-button"),
        aboutContent        = document.getElementById("about-content"),

        backgroundEngine    = chrome.extension.getBackgroundPage()
    ;

    document.oncontextmenu = FF;

    inboxButton.ondragstart = FF;
    achievementsButton.ondragstart = FF;

    getAllAnchors(document.getElementById("about-content"));

    var showInButtons = function() {
        var inbox = backgroundEngine.StackExchangeNotifications.getInbox();
        var score = backgroundEngine.StackExchangeNotifications.getScore();

        if (inbox > 0) {
            inboxData.className = "data";
            inboxData.innerHTML = inbox;
        } else {
            inboxData.className = "data hide";
        }

        if (score !== 0) {
            achievementsData.className = "data";
            achievementsData.innerHTML = score;
        } else {
            achievementsData.className = "data hide";
        }
    };

    backgroundEngine.detectUpdate(showInButtons);

    showInButtons();

    aboutButton.onclick = function() {
        if (inboxXhr) {
            inboxXhr.abort();
            inboxActive = false;
        }

        if (achievementsXhr) {
            achievementsXhr.abort();
            achievementsActive = false;
        }

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "") + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "") + " hide";

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "");
    };

    inboxButton.onclick = function() {
        if (achievementsXhr) {
            achievementsXhr.abort();
            achievementsActive = false;
        }

        if (inboxActive) {
            return false;
        }

        aboutContent.className += " hide";

        inboxActive = true;

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "") + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "") + " tab-load";

        inboxContent.innerHTML = "";

        inboxXhr = StackExchangeNotifications.inbox(function(data) {
            if (typeof data.error !== "undefined") {
                inboxContent.innerHTML = '<span class="sen-error">Error (http) ' + data.error + '</span>';
            } else if (data.indexOf("<") !== -1) {
                backgroundEngine.resetInbox();

                inboxContent.innerHTML = data;
                getAllAnchors(inboxContent);
            } else {
                inboxContent.innerHTML = [
                    "Response error:<br>",
                    "to use this extension you need to be logged by the",
                    "For use go to <a href=\"http://stackexchange.com\">http://stackexchange.com</a>"
                ].join("");
                getAllAnchors(inboxContent);
            }

            inboxContent.className =
                inboxContent.className.replace(/hide|tab\-load/g, "");
        });
    };

    achievementsButton.onclick = function() {
        if (inboxXhr) {
            inboxXhr.abort();
            inboxActive = false;
        }

        if (achievementsActive) {
            return false;
        }

        aboutContent.className += " hide";

        achievementsActive = true;

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "") + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "") + " tab-load";

        achievementsContent.innerHTML = "";

        achievementsXhr = StackExchangeNotifications.achievements(function(data) {
            if (typeof data.error !== "undefined") {
                achievementsContent.innerHTML = '<span class="sen-error">Error (http) ' + data.error + '</span>';
            } else if (data.indexOf("<") !== -1) {
                backgroundEngine.resetScore();

                achievementsContent.innerHTML = data;
                getAllAnchors(achievementsContent);
            } else {
                achievementsContent.innerHTML = [
                    "Response error:<br>",
                    "to use this extension you need to be logged by the",
                    "For use go to <a href=\"http://stackexchange.com\">http://stackexchange.com</a>"
                ].join("");
                getAllAnchors(achievementsContent);
            }

            achievementsContent.className =
                achievementsContent.className.replace(/hide|tab\-load/g, "");
        });
    };
};

window.onload = main;
