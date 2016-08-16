/*
 * StackExchangeNotifications 1.0.0
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(doc, browser) {
    "use strict";

    var
        debugMode,
        navgation           = doc.querySelector(".nav"),

        inboxButton         = doc.getElementById("inbox-button"),
        inboxContent        = doc.getElementById("inbox-content"),
        inboxData           = inboxButton.querySelector("span.push"),
        inboxXhr            = null,
        inboxActive         = false,

        achievementsButton  = doc.getElementById("achievements-button"),
        achievementsContent = doc.getElementById("achievements-content"),
        achievementsData    = achievementsButton.querySelector("span.push"),
        achievementsXhr     = null,
        achievementsActive  = false,

        aboutButton         = doc.getElementById("about-button"),
        aboutContent        = doc.getElementById("about-content"),

        setupButton         = doc.getElementById("setup-button"),
        setupContent        = doc.getElementById("setup-content"),

        switchs             = doc.querySelectorAll("a[data-switch]"),

        notificationSwitch  = doc.getElementById("notification-switch"),

        editorSwitch        = doc.getElementById("editor-switch"),
        editorSwitchTabs    = doc.getElementById("editor-switch-tabs"),
        editorSwitchInvert  = doc.getElementById("editor-switch-invert"),
        editorSwitchPreview = doc.getElementById("editor-switch-preview"),

        btns                = doc.querySelectorAll(".btn"),

        clearCache          = doc.getElementById("clear-cache"),
        clearAllData        = doc.getElementById("clear-all-data"),

        headDOM             = doc.head,

        backgroundEngine    = browser.extension.getBackgroundPage()
    ;

    if ("update_url" in browser.runtime.getManifest()) {
        debugMode = false;
    }

    function disableEvent()
    {
        return debugMode;
    }

    function linkPrevent(el)
    {
        el.addEventListener("click", function(evt) {
            (evt || window.event).preventDefault();
        });
    }

    function setActionAnchor(el)
    {
        if (el && el.senLink !== true && el.href && /^(http|https)\:\/\//.test(el.href)) {
            el.senLink = true;

            el.onclick = function(evt) {
                setTimeout(function() {
                    var id = StackExchangeNotifications.notificationsSession() + el.href;

                    browser.notifications.clear(id);

                    StackExchangeNotifications.removeNotificationFromCache(el.href);

                    browser.tabs.create({ "url": el.href });
                }, 1);
            };
        }

        linkPrevent(el);

        el.ondragstart = disableEvent;
    }

    function setDomEvents(target)
    {
        var els, j, i = 0;

        target = target||doc;

        els = target.getElementsByTagName("a");

        for (j = els.length; i < j; i++) {
            setActionAnchor(els[i]);
        }
    }

    window.StackExchangeNotifications = backgroundEngine.StackExchangeNotifications;

    doc.oncontextmenu = disableEvent;

    setDomEvents();

    StackExchangeNotifications.boot();

    var manifestData = StackExchangeNotifications.meta();

    doc.getElementById("about-title").innerHTML =
                                            manifestData.appname + " " + manifestData.version;

    function checkEvent()
    {
        var lastCheck = StackExchangeNotifications.restoreState("lastCheck");

        if (lastCheck) {
            var d = new Date(lastCheck);

            if (d.getDate() == 31 && d.getMonth() == 9) {
                doc.body.className += " halloween";
            }
        }
    }

    var theme;

    function changeTheme()
    {
        if (StackExchangeNotifications.switchEnable("black_theme")) {
            if (!theme) {
                theme = doc.createElement("link");

                theme.href = "/css/themes/black/popup.css";
                theme.type = "text/css";
                theme.rel  = "stylesheet";

                doc.body.appendChild(theme);
            } else {
                theme.disabled = false;
            }

            checkEvent();
        } else if (theme) {
            theme.disabled = true;
        }
    }

    function showInButtons()
    {
        var inbox = StackExchangeNotifications.getInbox();
        var achievements = StackExchangeNotifications.getAchievements();
        var total = 0;

        if (achievements.acquired > 0) {
            total += achievements.acquired;
        }

        if (total.score !== 0) {
            total += achievements.score;
        }

        if (inbox > 0) {
            inboxData.className = "push";
            inboxData.innerHTML = StackExchangeNotifications.utils.convertResult(inbox);
        } else {
            inboxData.className = "push hide";
        }

        if (total !== 0) {
            achievementsData.className = "push";
            achievementsData.innerHTML = StackExchangeNotifications.utils.convertResult(total);
        } else {
            achievementsData.className = "push hide";
        }
    }

    showInButtons();

    backgroundEngine.detectUpdate(showInButtons);

    function actionCheckRead(current, box)
    {
        var target = box === "inbox" ? inboxContent : achievementsContent;

        current.addEventListener("click", function() {
            current.className = current.className
                                    .replace(/(^|\s)unread\-item($|\s)/g, " ").trim();

            var data = StackExchangeNotifications.restoreState(box);

            if (data.length === 3) {
                data[0] = target.innerHTML;

                StackExchangeNotifications.saveState(box, data);
            }
        });
    }

    function saveStateDetect(box)
    {
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
    }

    function switchEngine(el)
    {
        var
            val,
            key = el.getAttribute("data-switch");

        if (key) {

            val = StackExchangeNotifications.switchEnable(key);

            if (val === true) {
                el.setAttribute("data-switch-value", "on");
            }
        }

        el.addEventListener("click", function() {
            var nval;

            if (el.getAttribute("data-switch-value") === "on") {
                nval = "off";
            } else {
                nval = "on";
            }

            el.setAttribute("data-switch-value", nval);

            if (key) {
                StackExchangeNotifications.switchEnable(key, nval === "on");
            }
        });
    }

    for (var i = 0, j = switchs.length; i < j; i++) {
        switchEngine(switchs[i]);
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

        window.scrollTo(0, 0);

        StackExchangeNotifications.saveState("lastTab", "setup");

        achievementsContent.className =
            achievementsContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

        aboutContent.className =
            aboutContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

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

        window.scrollTo(0, 0);

        StackExchangeNotifications.saveState("lastTab", "about");

        achievementsContent.className =
            achievementsContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

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

        StackExchangeNotifications.saveState("lastTab", "inbox");

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " sen-bg-loader";

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
                inboxContent.className.replace(/hide|sen\-bg\-loader/g, "").trim();
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

        StackExchangeNotifications.saveState("lastTab", "achievements");

        aboutContent.className =
            aboutContent.className.replace(/hide/g, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(/hide|sen\-bg\-loader/g, "").trim() + " sen-bg-loader";

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
                    StackExchangeNotifications.setAchievements(0, 0);
                    StackExchangeNotifications.update();
                }, 500);

                achievementsContent.innerHTML =
                    StackExchangeNotifications.utils.cleanDomString(data);

                if (headers.Date) {
                    dateContent = doc.querySelector(".js-utc-time")

                    if (dateContent) {
                        date = new Date(headers.Date);
                        hour = date.getUTCHours();
                        min  = date.getUTCMinutes();

                        hour = hour > 9 ? hour : ("0" + "" + hour);
                        min  = min  > 9 ? min  : ("0" + "" + min );

                        dateContent.innerHTML = hour + ":" + min
                    }
                } else {
                    dateContent = doc.querySelector(".utc-clock");
                    if (dateContent) {
                        dateContent.className += " hide";
                    }
                }

                setDomEvents(achievementsContent);
                saveStateDetect("achievements");
            }

            achievementsContent.className =
                achievementsContent.className.replace(/hide|sen\-bg\-loader/g, "").trim();
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

    doc.querySelector("a[data-switch='black_theme']").addEventListener("click", changeTheme);

    changeTheme();

    for (var i = btns.length - 1; i >= 0; i--) {
        btns[i].addEventListener("click", function() {
            var s = this;

            setTimeout(function() {
                s.blur();
            }, 300);
        });
    }

    switch (StackExchangeNotifications.restoreState("lastTab"))
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
})(document, chrome||browser);
