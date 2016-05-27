/*
 * StackExchangeNotifications 0.0.5
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
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

            setTimeout(function()
            {
                chrome.tabs.create({ "url": el.href });
            }, 1);
        };
    }
    el.ondragstart = FF;
}

function setDomEvents(target) {
    var els, j, i = 0;

    target = target||document;

    els = target.getElementsByTagName("a");

    for (j = els.length; i < j; i++) {
        setActionAnchor(els[i]);
    }
}

function getNotificationId() {
    var id = Math.floor(Math.random() * 9007199254740992) + 1;
    return id.toString();
}

function main() {
    "use strict";

    var
        inboxButton         = document.getElementById("inbox-button"),
        inboxContent        = document.getElementById("inbox-content"),
        inboxData           = inboxButton.querySelector("span.push"),
        inboxXhr            = null,
        inboxActive         = false,

        achievementsButton  = document.getElementById("achievements-button"),
        achievementsContent = document.getElementById("achievements-content"),
        achievementsData    = achievementsButton.querySelector("span.push"),
        achievementsXhr     = null,
        achievementsActive  = false,

        aboutButton         = document.getElementById("about-button"),
        aboutContent        = document.getElementById("about-content"),

        setupButton         = document.getElementById("setup-button"),
        setupContent        = document.getElementById("setup-content"),

        notificationSwitch = document.getElementById("notification-switch"),

        backgroundEngine    = chrome.extension.getBackgroundPage()
    ;

    /*
    notificationSwitch.onclick = function() {
        chrome.notifications.create(getNotificationId(), {
            title: 'SEN Notification',
            iconUrl: 'images/icon-128px.png',
            type: 'basic',
            message: "xxxx"
        }, function() {});
    };
    */

    document.oncontextmenu = FF;

    setDomEvents();

    var manifestData = StackExchangeNotifications.utils.meta();

    document.getElementById("about-title").innerHTML =
                                            manifestData.appname + " " + manifestData.version;

    var showInButtons = function()
    {
        var inbox = backgroundEngine.StackExchangeNotifications.getInbox();
        var score = backgroundEngine.StackExchangeNotifications.getScore();

        if (inbox > 0) {
            inboxData.className = "push";
            inboxData.innerHTML = StackExchangeNotifications.utils.convertResult(inbox);
        } else {
            inboxData.className = "push hide";
        }

        if (score !== 0) {
            achievementsData.className = "push";
            achievementsData.innerHTML = StackExchangeNotifications.utils.convertResult(score);
        } else {
            achievementsData.className = "push hide";
        }
    };

    backgroundEngine.detectUpdate(showInButtons);
    showInButtons();

    var actionCheckRead = function(current, box) {
        var target = box === "inbox" ? inboxContent : achievementsContent;

        current.addEventListener("click", function()
        {
            current.className = current.className.replace(/unread\-item/g, "");
            StackExchangeNotifications.saveState(box, target.innerHTML);
        });
    };

    var saveStateDetect = function(box) {
        var
            j,
            i = 0,
            els,
            current,
            target = box === "inbox" ? inboxContent : achievementsContent;

        els = target.querySelectorAll("li");

        for (j = els.length; i < j; i++) {
            actionCheckRead(els[i], box);
        }
    };

    var headDOM = document.head;

    StackExchangeNotifications.style(function(stylesheet) {
        var cssDom = document.createElement("link");

        cssDom.href = stylesheet;
        cssDom.type = "text/css";
        cssDom.rel  = "stylesheet";

        headDOM.appendChild(cssDom);
    });

    setupButton.onclick = function()
    {
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
            aboutContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        setupContent.className =
            aboutContent.className.replace(/hide/g, "").trim();
    };

    aboutButton.onclick = function()
    {
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

        setupContent.className =
            setupContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "").trim();
    };

    inboxButton.onclick = function()
    {
        if (achievementsXhr) {
            achievementsXhr.abort();
            achievementsActive = false;
        }

        if (inboxActive) {
            return false;
        }

        inboxActive = true;

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "").trim() + " tab-load";

        inboxContent.innerHTML = "";

        inboxXhr = StackExchangeNotifications.inbox(function(data) {
            if (typeof data.error !== "undefined") {
                inboxContent.innerHTML =
                    '<span class="sen-error notice">HTTP error - status: ' +
                        data.error + '</span>';

            } else if (data.indexOf("<") !== -1) {
                backgroundEngine.resetInbox();

                inboxContent.innerHTML = StackExchangeNotifications.utils.cleanDomString(data);

                setDomEvents(inboxContent);
                saveStateDetect("inbox");
            } else {
                inboxContent.innerHTML = [
                    '<span class="sen-error notice">',
                    "Response error:<br>",
                    "Is needed logon in <br>",
                    "<a href=\"http://stackexchange.com\">http://stackexchange.com</a>",
                    '</span>'
                ].join("");

                setDomEvents(inboxContent);
            }

            inboxContent.className =
                inboxContent.className.replace(/hide|tab\-load/g, "").trim();
        });
    };

    achievementsButton.onclick = function()
    {
        if (inboxXhr) {
            inboxXhr.abort();
            inboxActive = false;
        }

        if (achievementsActive) {
            return false;
        }

        achievementsActive = true;

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "").trim() + " tab-load";

        achievementsContent.innerHTML = "";

        achievementsXhr = StackExchangeNotifications.achievements(function(data, headers) {
            var dateContent, date, hour, min;

            if (typeof data.error !== "undefined") {
                achievementsContent.innerHTML =
                    '<span class="sen-error notice">HTTP error - status: ' +
                        data.error + '</span>';

            } else if (data.indexOf("<") !== -1) {
                backgroundEngine.resetScore();

                achievementsContent.innerHTML =
                    StackExchangeNotifications.utils.cleanDomString(data);

                if (headers.Date) {
                    dateContent = document.querySelector(".js-utc-time")

                    if (dateContent) {
                        date = new Date(headers.Date);
                        hour = date.getUTCHours();
                        min  = date.getUTCMinutes();

                        hour = hour > 9 ? hour : ("0" + "" + hour);
                        min  = min  > 9 ? min  : ("0" + "" + min );

                        dateContent.innerHTML = hour + ":" + min
                    }
                } else {
                    dateContent = document.querySelector(".utc-clock");
                    if (dateContent) {
                        dateContent.className += " hide";
                    }
                }

                setDomEvents(achievementsContent);
                saveStateDetect("achievements");
            } else {
                achievementsContent.innerHTML = [
                    '<span class="sen-error notice">',
                    "Response error:<br>",
                    "Is needed logon in <br>",
                    "<a href=\"http://stackexchange.com\">http://stackexchange.com</a>",
                    '</span>'
                ].join("");

                setDomEvents(achievementsContent);
            }

            achievementsContent.className =
                achievementsContent.className.replace(/hide|tab\-load/g, "").trim();
        });
    };
};

window.onload = main;
