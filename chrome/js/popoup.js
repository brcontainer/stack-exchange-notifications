/*
 * StackExchangeNotifications 1.0.7
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d, browser) {
    "use strict";

    var lastTab,
        navgation           = d.querySelector(".nav"),

        inboxButton         = d.getElementById("inbox-button"),
        inboxContent        = d.getElementById("inbox-content"),
        inboxData           = inboxButton.querySelector("span.push"),
        inboxXhr            = null,

        achievementsButton  = d.getElementById("achievements-button"),
        achievementsContent = d.getElementById("achievements-content"),
        achievementsData    = achievementsButton.querySelector("span.push"),
        achievementsXhr     = null,

        aboutButton         = d.getElementById("about-button"),
        aboutContent        = d.getElementById("about-content"),

        chatButton          = d.getElementById("chat-button"),
        chatContent         = d.getElementById("chat-content"),
        chatRooms           = d.querySelector(".rooms"),
        chatNotice          = chatRooms.querySelector(".rooms > .notice"),
        chatActived         = false,

        setupButton         = d.getElementById("setup-button"),
        setupContent        = d.getElementById("setup-content"),

        switchs             = d.querySelectorAll("a[data-switch]"),

        //notificationSwitch  = d.getElementById("notification-switch"),

        editorSwitch        = d.getElementById("editor-switch"),
        editorSwitchTabs    = d.getElementById("editor-switch-tabs"),
        editorSwitchInvert  = d.getElementById("editor-switch-invert"),
        editorSwitchPreview = d.getElementById("editor-switch-preview"),

        btns                = d.querySelectorAll(".btn"),

        clearCache          = d.getElementById("clear-cache"),
        clearAllData        = d.getElementById("clear-all-data"),

        bgLoaderRegExp      = /(^|\s)(hide|sen-bg-loader)(\s|$)/g,
        hideRegExp          = /(^|\s)hide(\s|$)/g,

        cssLoaded           = false,

        headDOM             = d.head,

        backgroundEngine    = browser.extension.getBackgroundPage();

    var debugMode = !(
        "update_url" in browser.runtime.getManifest() ||
        browser.runtime.id === "stackexchangenotifications@mozilla.org"
    );

    function adjustPopup(m)
    {
        if (m === true) {
            d.body.classList.remove("fix-popup");
            w.scrollTo(0, 0);
        } else {
            d.body.classList.add("fix-popup");
            setTimeout(adjustPopup, 10, true);
        }
    }

    function disableEvent(e)
    {
        if (!debugMode) {
            e.preventDefault();
            return false;
        }
    }

    function linkPrevent(el)
    {
        el.addEventListener("click", function (e) {
            (e || w.event).preventDefault();
        });
    }

    function removeQuerystringAndHash(url)
    {
        return url.replace(/(\?|#)[\s\S]+$/, "");
    }

    function setActionAnchor(el)
    {
        if (el && el.senLink !== true && el.href && /^(http|https)\:\/\//.test(el.href)) {
            el.senLink = true;

            var cUrl = el.href;

            el.onclick = function (e) {
                e.preventDefault();

                setTimeout(function () {
                    if (!StackExchangeNotifications.switchEnable("prevent_duplicate")) {
                        browser.tabs.create({ "url": cUrl });
                        return;
                    }

                    browser.tabs.query({ "url": "https://*/*" }, function (tabs) {
                        var tabId, checkUrl = removeQuerystringAndHash(cUrl);

                        for (var i = 0, j = tabs.length; i < j; i++) {
                            if (removeQuerystringAndHash(tabs[i].url) === checkUrl) {
                                tabId = tabs[i].id;
                                break;
                            }
                        }

                        if (tabId) {
                            browser.tabs.update(tabId, { "active": true }, function () {});
                            //browser.tabs.executeScript(tabId, { "code": "foobar" });
                        } else {
                            browser.tabs.create({ "url": cUrl });
                        }
                    });
                }, 1);
            };
        }

        linkPrevent(el);
    }

    function setDomEvents(target)
    {
        var els, j, i = 0;

        target = target || d;

        els = target.getElementsByTagName("a");

        for (j = els.length; i < j; i++) {
            setActionAnchor(els[i]);
        }
    }

    function createRoom(url, data)
    {
        var el = d.createElement("div");

        if (!data.icon) {
            data.icon = "../images/chat.svg";
        }

        el.innerHTML = '<div class="room">' +
            '<a class="lnk" href="' + url + '">' +
            '<div class="icon"><img src="' + data.icon + '"></div>' +
            '<div class="content">' +
            '<p>' + data.title + '</p>' +
            '</div></a>' +
            '<div class="close"><a class="icon" href="#"></a></div>' +
            '</div>';

        setActionAnchor(el.querySelector(".lnk"));

        el.querySelector(".close > a").onclick = function () {
            StackExchangeNotifications.utils.dialog.confirm("Do you really want to remove?", function (ok) {
                if (!ok) {
                    return;
                }

                browser.runtime.sendMessage({ "chat": 2, "url": url }, function (response) {
                    if (!response) {
                        return;
                    }

                    el.parentNode.removeChild(el);

                    if (!chatRooms.querySelector(".room")) {
                        showNoticeRoom(true);
                    }
                });
            });
        }

        chatRooms.appendChild(el);
    }

    function showNoticeRoom(show)
    {
        if (show) {
            chatNotice.className = chatNotice.className.replace(hideRegExp, "").trim();
        } else if (!hideRegExp.test(chatNotice.className)) {
            chatNotice.className += " hide";
        }
    }

    w.StackExchangeNotifications = backgroundEngine.StackExchangeNotifications;

    d.oncontextmenu = disableEvent;

    d.ondragstart = disableEvent;

    setDomEvents();

    StackExchangeNotifications.boot();

    var manifestData = StackExchangeNotifications.meta();

    d.getElementById("about-title").innerHTML = manifestData.appname + " " + manifestData.version;

    function checkEvent()
    {
        var lc = StackExchangeNotifications.restoreState("lastcheck");

        if (StackExchangeNotifications.utils.eventDay(lc)) {
            d.body.className += " horror";
        }
    }

    var theme;

    function changeTheme()
    {
        if (StackExchangeNotifications.switchEnable("dark_theme")) {
            if (!theme) {
                theme = d.createElement("link");

                theme.href = "/css/themes/dark/popup.css";
                theme.type = "text/css";
                theme.rel  = "stylesheet";

                d.body.appendChild(theme);
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

        current.addEventListener("click", function () {
            current.className = current.className.replace(/(^|\s)unread-item(\s|$)/g, " ").trim();

            var data = StackExchangeNotifications.restoreState(box);

            if (data.length === 3) {
                data[0] = target.innerHTML;

                StackExchangeNotifications.saveState(box, data);
            }
        });
    }

    function saveStateDetect(box)
    {
        var j, i = 0, els, current,
            target = box === "inbox" ? inboxContent : achievementsContent;

        els = target.querySelectorAll("li");

        for (j = els.length; i < j; i++) {
            actionCheckRead(els[i], box);
        }

        setTimeout(adjustPopup, 1);
    }

    function switchEngine(el)
    {
        var val, key = el.getAttribute("data-switch");

        if (key) {
            val = StackExchangeNotifications.switchEnable(key);

            if (val === true) {
                el.setAttribute("data-switch-value", "on");
            }
        }

        el.addEventListener("click", function () {
            var nval = el.getAttribute("data-switch-value") === "on";

            el.setAttribute("data-switch-value", nval ? "off" : "on");

            if (key) {
                StackExchangeNotifications.switchEnable(key, !nval);
            }
        });
    }

    function isCurrentTab(type)
    {
        if (lastTab === type) {
            return true;
        }

        lastTab = type;

        StackExchangeNotifications.saveState("lastTab", type);

        adjustPopup();

        return false;
    }

    for (var i = 0, j = switchs.length; i < j; i++) {
        switchEngine(switchs[i]);
    }

    function setStyle(cssText)
    {
        if (cssLoaded) {
            return;
        }

        cssLoaded = true;
        var style = d.createElement("style");
        style.textContent = cssText;
        d.head.appendChild(style);
    }

    function bgCss()
    {
        if (cssLoaded) {
            /*browser.runtime.sendMessage({ "storeimages": true }, function (response) {
                if (response) {
                    setStyle(response);
                }
            });*/

            return;
        }

        var i, j, rules, image, imgUrl, allRulesBg = [],
            isHttp = /^(http|https)\:\/\/[^/]/i,
            reImg  = /url\(("|'|)([\s\S]+?\.(png|jpg|jpeg|gif)(\?|\?[\s\S]+?|))("|'|)\)/i,
            styles = d.styleSheets;

        for (var i = styles.length - 1; i >= 0; i--) {
            if (false === isHttp.test(styles[i].href)) {
                continue;
            }

            rules = styles[i].rules;

            if (!rules) {
                continue;
            }

            for (j = rules.length - 1; j >= 0; j--) {
                if (
                    rules[j].style &&
                    rules[j].style.backgroundImage &&
                    (image = rules[j].style.backgroundImage.match(reImg))
                ) {
                    imgUrl = image[2];

                    if (!isHttp.test(imgUrl)) {
                        imgUrl = styles[i].href.replace(/\/[^\/]+?$/, "/") + imgUrl;
                    }

                    allRulesBg.push({
                        "selector": rules[j].selectorText,
                        "url": imgUrl
                    });
                }
            }
        }

        if (allRulesBg.length) {
            browser.runtime.sendMessage({ "storeimages": allRulesBg }, function (response) {
                if (response) {
                    setStyle(response);
                }
            });
        } else {
            browser.runtime.sendMessage({ "storeimages": true }, function (response) {
                if (response) {
                    setStyle(response);
                }
            });
        }
    }

    setupButton.onclick = function ()
    {
        if (isCurrentTab("setup")) {
            return false;
        }

        if (inboxXhr) {
            inboxXhr.abort();
        }

        if (achievementsXhr) {
            achievementsXhr.abort();
        }

        achievementsContent.className =
            achievementsContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        aboutContent.className =
            aboutContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        chatContent.className =
            chatContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        setupContent.className =
            aboutContent.className.replace(hideRegExp, "").trim();
    };

    chatButton.onclick = function ()
    {
        if (isCurrentTab("chat")) {
            return false;
        }

        if (inboxXhr) {
            inboxXhr.abort();
        }

        if (achievementsXhr) {
            achievementsXhr.abort();
        }

        achievementsContent.className =
            achievementsContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        aboutContent.className =
            aboutContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        chatContent.className =
            chatContent.className.replace(hideRegExp, "").trim();

        if (chatActived) {
            return;
        }

        chatActived = true;

        var has = false,
            savedRooms = StackExchangeNotifications.restoreState("saved_rooms", true);

        for (var k in savedRooms) {
            createRoom(k, savedRooms[k]);
            has = true;
        }

        showNoticeRoom(!has);
    };

    aboutButton.onclick = function ()
    {
        if (isCurrentTab("about")) {
            return false;
        }

        if (inboxXhr) {
            inboxXhr.abort();
        }

        if (achievementsXhr) {
            achievementsXhr.abort();
        }

        achievementsContent.className =
            achievementsContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        chatContent.className =
            chatContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        aboutContent.className =
            aboutContent.className.replace(hideRegExp, "").trim();
    };

    inboxButton.onclick = function ()
    {
        if (isCurrentTab("inbox") && StackExchangeNotifications.hasCache("inbox")) {
            return false;
        }

        if (achievementsXhr) {
            achievementsXhr.abort();
        }

        aboutContent.className =
            aboutContent.className.replace(hideRegExp, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(bgLoaderRegExp, "").trim() + " sen-bg-loader";

        chatContent.className =
            chatContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        inboxContent.innerHTML = "";

        inboxXhr = StackExchangeNotifications.inbox(function (data, code) {
            if (code !== 200 && code !== -1) {
                inboxContent.innerHTML =
                    '<div class="sen-error notice">HTTP error - status: ' + code + '</div>';

            } else if (code === -1) {
                inboxContent.innerHTML = [
                    '<div class="sen-error notice">',
                    'Response error:<br>',
                    'You must be logged in to <br>',
                    '<a href="https://stackexchange.com/">https://stackexchange.com</a>',
                    '</div>'
                ].join("");

                setDomEvents(inboxContent);
            } else if (data.indexOf("<") !== -1) {
                StackExchangeNotifications.setInbox(0);

                setTimeout(function () {
                    StackExchangeNotifications.update();
                }, 1500);

                inboxContent.innerHTML = StackExchangeNotifications.utils.clearDomString(data);

                setDomEvents(inboxContent);
                saveStateDetect("inbox");
            }

            setTimeout(bgCss, 500);

            inboxContent.className =
                inboxContent.className.replace(bgLoaderRegExp, "").trim();
        });
    };

    achievementsButton.onclick = function ()
    {
        if (isCurrentTab("achievements") && StackExchangeNotifications.hasCache("achievements")) {
            return false;
        }

        if (inboxXhr) {
            inboxXhr.abort();
        }

        aboutContent.className =
            aboutContent.className.replace(hideRegExp, "").trim() + " hide";

        inboxContent.className =
            inboxContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        setupContent.className =
            setupContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        achievementsContent.className =
            achievementsContent.className.replace(bgLoaderRegExp, "").trim() + " sen-bg-loader";

        chatContent.className =
            chatContent.className.replace(bgLoaderRegExp, "").trim() + " hide";

        achievementsContent.innerHTML = "";

        achievementsXhr = StackExchangeNotifications.achievements(function (data, code, headers) {
            var dateContent, date, hour, min;

            if (code !== 200 && code !== -1) {
                achievementsContent.innerHTML =
                    '<div class="sen-error notice">HTTP error - status: ' +
                        code + '</div>';

            }  else if (code === -1) {
                achievementsContent.innerHTML = [
                    '<div class="sen-error notice">',
                    'Response error:<br>',
                    'You must be logged in to <br>',
                    '<a href="https://stackexchange.com/">https://stackexchange.com</a>',
                    '</div>'
                ].join("");

                setDomEvents(achievementsContent);
            } else if (data.indexOf("<") !== -1) {
                setTimeout(function () {
                    StackExchangeNotifications.setAchievements(0, 0);
                    StackExchangeNotifications.update();
                }, 500);

                achievementsContent.innerHTML =
                    StackExchangeNotifications.utils.clearDomString(data);

                if (headers.date) {
                    dateContent = d.querySelector(".js-utc-time")

                    if (dateContent) {
                        date = new Date(headers.date);
                        hour = date.getUTCHours();
                        min  = date.getUTCMinutes();

                        hour = hour > 9 ? hour : ("0" + hour);
                        min  = min > 9 ? min : ("0" + min);

                        dateContent.innerHTML = hour + ":" + min;
                    }
                }

                setDomEvents(achievementsContent);
                saveStateDetect("achievements");
            }

            setTimeout(bgCss, 500);

            achievementsContent.className =
                achievementsContent.className.replace(bgLoaderRegExp, "").trim();
        });
    };

    clearCache.onclick = function ()
    {
        StackExchangeNotifications.clearCache();
    };

    clearAllData.onclick = function ()
    {
        StackExchangeNotifications.utils.dialog.confirm("Do you really want to remove?", function (ok) {
            if (ok) {
                localStorage.clear();
                w.location.reload();
            }
        });
    };

    d.querySelector("a[data-switch='dark_theme']").addEventListener("click", changeTheme);

    changeTheme();

    for (var i = btns.length - 1; i >= 0; i--) {
        btns[i].addEventListener("click", function () {
            setTimeout(function (s) { s.blur(); }, 300, this);
        });
    }

    switch (StackExchangeNotifications.restoreState("lastTab")) {
        case "setup":
            setupButton.onclick();
        break;
        case "chat":
            chatButton.onclick();
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
})(window, document, chrome||browser);
