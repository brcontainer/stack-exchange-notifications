/*
 * StackExchangeNotifications 0.1.2
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
                chrome.notifications.clear(el.href);
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

        switchs             = document.getElementsByClassName("switch"),

        notificationSwitch  = document.getElementById("notification-switch"),

        editorSwitch        = document.getElementById("editor-switch"),
        editorSwitchPreview = document.getElementById("editor-switch-preview"),
        editorSwitchTabs    = document.getElementById("editor-switch-tabs"),

        clearCache          = document.getElementById("clear-cache"),
        clearAllData        = document.getElementById("clear-all-data"),

        backgroundEngine    = chrome.extension.getBackgroundPage()
    ;

    window.StackExchangeNotifications = backgroundEngine.StackExchangeNotifications;

    StackExchangeNotifications.boot();

    document.oncontextmenu = FF;

    setDomEvents();

    var manifestData = StackExchangeNotifications.utils.meta();

    document.getElementById("about-title").innerHTML =
                                            manifestData.appname + " " + manifestData.version;

    var showInButtons = function()
    {
        var inbox = StackExchangeNotifications.getInbox();
        var achievements = StackExchangeNotifications.getAchievements();

        if (inbox > 0) {
            inboxData.className = "push";
            inboxData.innerHTML = StackExchangeNotifications.utils.convertResult(inbox);
        } else {
            inboxData.className = "push hide";
        }

        if (achievements !== 0) {
            achievementsData.className = "push";
            achievementsData.innerHTML = StackExchangeNotifications.utils.convertResult(achievements);
        } else {
            achievementsData.className = "push hide";
        }
    };

    showInButtons();
    backgroundEngine.detectUpdate(showInButtons);

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

    StackExchangeNotifications.clearStyleList();

    StackExchangeNotifications.style(function(stylesheet) {
        var cssDom = document.createElement("link");

        cssDom.href = stylesheet;
        cssDom.type = "text/css";
        cssDom.rel  = "stylesheet";

        headDOM.appendChild(cssDom);
    });

    var changeSwitchEvent = document.createEvent("Event");
        changeSwitchEvent.initEvent("changeswitch", true, true);

    var switchsREOn  = /(^|\s)switch\-on($|\s)/;
    var switchsREOff = /(^|\s)switch\-off($|\s)/;

    for (var i = 0, j = switchs.length; i < j; i++) {
        switchs[i].addEventListener("click", function()
        {
            var sre, nv;

            if (switchsREOn.test(this.className)) {
                sre = switchsREOn;
                this.value = "off";
                nv = " switch-off";
            } else {
                sre = switchsREOff;
                this.value = "on";
                nv = " switch-on";
            }

            this.className = this.className.replace(sre, "").trim() + nv;

            this.dispatchEvent(changeSwitchEvent);
        });
    }

    setupButton.onclick = function()
    {
        if (inboxXhr) {
            inboxXhr.abort();
        }

        if (achievementsXhr) {
            achievementsXhr.abort();
        }

        inboxActive = false;
        achievementsActive = false;

        localStorage.setItem("lastTab", "setup");

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
        }

        if (achievementsXhr) {
            achievementsXhr.abort();
        }

        inboxActive = false;
        achievementsActive = false;

        localStorage.setItem("lastTab", "about");

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
        }

        achievementsActive = false;

        window.scrollTo(0, 0);

        if (inboxActive && StackExchangeNotifications.hasCache("inbox")) {
            return false;
        }

        inboxActive = true;

        localStorage.setItem("lastTab", "inbox");

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "").trim() + " tab-load";

        inboxContent.innerHTML = "";

        inboxXhr = StackExchangeNotifications.inbox(function(data, code) {
            if (code !== 200 && code !== -1) {
                inboxContent.innerHTML =
                    '<span class="sen-error notice">HTTP error - status: ' +
                        code + '</span>';

            } else if (code === -1) {
                inboxContent.innerHTML = [
                    '<span class="sen-error notice">',
                    "Response error:<br>",
                    "You must be logged in to <br>",
                    "<a href=\"http://stackexchange.com\">http://stackexchange.com</a>",
                    '</span>'
                ].join("");

                setDomEvents(inboxContent);
            } else if (data.indexOf("<") !== -1) {
                setTimeout(function () {
                    StackExchangeNotifications.setInbox(0);
                    StackExchangeNotifications.update();
                }, 500);

                inboxContent.innerHTML = StackExchangeNotifications.utils.cleanDomString(data);

                setDomEvents(inboxContent);
                saveStateDetect("inbox");
            }

            inboxContent.className =
                inboxContent.className.replace(/hide|tab\-load/g, "").trim();
        });
    };

    achievementsButton.onclick = function()
    {
        if (inboxXhr) {
            inboxXhr.abort();
        }

        inboxActive = false;

        window.scrollTo(0, 0);

        if (achievementsActive && StackExchangeNotifications.hasCache("achievements")) {
            return false;
        }

        achievementsActive = true;

        localStorage.setItem("lastTab", "achievements");

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(/hide|tab\-load/g, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(/hide|tab\-load/g, "").trim() + " tab-load";

        achievementsContent.innerHTML = "";

        achievementsXhr = StackExchangeNotifications.achievements(function(data, code, headers) {
            var dateContent, date, hour, min;

            if (code !== 200 && code !== -1) {
                achievementsContent.innerHTML =
                    '<span class="sen-error notice">HTTP error - status: ' +
                        code + '</span>';

            }  else if (code === -1) {
                achievementsContent.innerHTML = [
                    '<span class="sen-error notice">',
                    "Response error:<br>",
                    "You must be logged in to <br>",
                    "<a href=\"http://stackexchange.com\">http://stackexchange.com</a>",
                    '</span>'
                ].join("");

                setDomEvents(achievementsContent);
            } else if (data.indexOf("<") !== -1) {
                setTimeout(function () {
                    StackExchangeNotifications.setAchievements(0);
                    StackExchangeNotifications.update();
                }, 500);

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
            }

            achievementsContent.className =
                achievementsContent.className.replace(/hide|tab\-load/g, "").trim();
        });
    };

    clearCache.onclick = function()
    {
        StackExchangeNotifications.clearCache();
    };

    clearAllData.onclick = function()
    {
        if (window.confirm("Realy? Delete all data?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    var evt = new MouseEvent("click", {
        "view": window,
        "bubbles": true,
        "cancelable": true
    });

    if (StackExchangeNotifications.enableNotifications()) {
        notificationSwitch.dispatchEvent(evt);
    }

    if (StackExchangeNotifications.enableEditor()) {
        editorSwitch.dispatchEvent(evt);
    }

    if (StackExchangeNotifications.enablePreferPreview()) {
        editorSwitchPreview.dispatchEvent(evt);
    }

    if (StackExchangeNotifications.enableReplaceTabsBySpaces()) {
        editorSwitchTabs.dispatchEvent(evt);
    }

    notificationSwitch.addEventListener("changeswitch", function() {
        StackExchangeNotifications.enableNotifications(this.value === "on");
    });

    editorSwitch.addEventListener("changeswitch", function() {
        StackExchangeNotifications.enableEditor(this.value === "on");
    });

    editorSwitchPreview.addEventListener("changeswitch", function() {
        StackExchangeNotifications.enablePreferPreview(this.value === "on");
    });

    editorSwitchTabs.addEventListener("changeswitch", function() {
        StackExchangeNotifications.enableReplaceTabsBySpaces(this.value === "on");
    });

    switch (localStorage.getItem("lastTab"))
    {
        case "setup":
            setupButton.onclick();
        break;
        case "about":
            aboutButton.onclick();
        break;
        case "inbox":
            inboxButton.onclick();
        break;
        case "achievements":
            achievementsButton.onclick();
        break;
    }
};

window.onload = main;
