/*
 * StackExchangeNotifications 0.0.4
 * Copyright (c) 2015 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

function FF() {
    return false;
}

function setActionAnchor(el) {
    if (el && el.senLink !== true && el.href && el.href.indexOf("http") === 0) {
        el.senLink = true;
        el.onclick = function(evt) {
            evt = evt || window.event;

            if (evt.preventDefault) {
                evt.preventDefault();
            }

            chrome.tabs.create({ "url": el.href });
        };
    }
    el.ondragstart = FF;
}

function setDomEvents(target) {
    var els = (target||document).querySelectorAll("a,img"), i = 0;
    for (j = els.length; i < j; i++) {
        setActionAnchor(els[i]);
    }
}

function main() {
    "use strict";

    var
        intro               = document.getElementById("intro"),
        introIsVisible      = true,

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

    setDomEvents();

    var hideIntro = function() {
        if (introIsVisible) {
            introIsVisible = false;
            intro.className = "hide";
        }
    };

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

    var headDOM = document.head;

    StackExchangeNotifications.style(function(stylesheet) {
        var cssDom = document.createElement("link");

        cssDom.href = stylesheet;
        cssDom.type = "text/css";
        cssDom.rel  = "stylesheet";

        headDOM.appendChild(cssDom);
    });

    aboutButton.onclick = function() {
        hideIntro();

        if (inboxXhr) {
            inboxXhr.abort();
            inboxActive = false;
        }

        if (achievementsXhr) {
            achievementsXhr.abort();
            achievementsActive = false;
        }

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "").trim();
    };

    inboxButton.onclick = function() {
        hideIntro();

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
            achievementsContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "").trim() + " tab-load";

        inboxContent.innerHTML = "";

        inboxXhr = StackExchangeNotifications.inbox(function(data) {
            if (typeof data.error !== "undefined") {
                inboxContent.innerHTML = '<span class="sen-error notice">Error (http) ' + data.error + '</span>';
            } else if (data.indexOf("<") !== -1) {
                backgroundEngine.resetInbox();

                inboxContent.innerHTML = StackExchangeNotifications.utils.cleanDomString(data);
                setDomEvents(inboxContent);
            } else {
                inboxContent.innerHTML = [
                    "Response error:<br>",
                    "to use this extension you need to be logged by the",
                    "For use go to <a href=\"http://stackexchange.com\">http://stackexchange.com</a>"
                ].join("");
                setDomEvents(inboxContent);
            }

            inboxContent.className =
                inboxContent.className.replace(/hide|tab\-load/g, "").trim();
        });
    };

    achievementsButton.onclick = function() {
        hideIntro();

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
            inboxContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "").trim() + " tab-load";

        achievementsContent.innerHTML = "";

        achievementsXhr = StackExchangeNotifications.achievements(function(data) {
            if (typeof data.error !== "undefined") {
                achievementsContent.innerHTML = '<span class="sen-error notice">Error (http) ' + data.error + '</span>';
            } else if (data.indexOf("<") !== -1) {
                backgroundEngine.resetScore();

                achievementsContent.innerHTML = StackExchangeNotifications.utils.cleanDomString(data);
                setDomEvents(achievementsContent);
            } else {
                achievementsContent.innerHTML = [
                    "Response error:<br>",
                    "to use this extension you need to be logged by the",
                    "For use go to <a href=\"http://stackexchange.com\">http://stackexchange.com</a>"
                ].join("");
                setDomEvents(achievementsContent);
            }

            achievementsContent.className =
                achievementsContent.className.replace(/hide|tab\-load/g, "").trim();
        });
    };
};

window.onload = main;
