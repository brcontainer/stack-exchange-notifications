/*
 * StackExchangeNotifications 1.1.0
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d, u) {
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

        //notificationSwitch  = d.getElementById("notification-switch"),

        editorSwitch        = d.getElementById("editor-switch"),
        editorSwitchTabs    = d.getElementById("editor-switch-tabs"),
        editorSwitchInvert  = d.getElementById("editor-switch-invert"),
        editorSwitchPreview = d.getElementById("editor-switch-preview"),

        bgLoaderRegExp      = /\b(hide|sen-bg-loader)\b/g,
        hideRegExp          = /\bhide\b/g,
        isHttpRegExp        = /^https?\:\/\/[^/]/i,
        imgExtensionRegexp  = /url\(("|'|)([\s\S]+?\.(png|jpg|jpeg|gif)(\?|\?[\s\S]+?|))("|'|)\)/i,

        cssLoaded           = false,

        headDOM             = d.head,

        browser             = w.chrome||w.browser;

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

    function removeQuerystringAndHash(url)
    {
        return url.replace(/(\?|#)[\s\S]+$/, "");
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

    StackExchangeNotifications.boot(w, d);

    var manifestData = StackExchangeNotifications.meta();

    d.getElementById("about-title").textContent = manifestData.appname + " " + manifestData.version;

    function showButtonPushs(i, a)
    {
        var total = 0,
            inbox = i !== u ? i : StackExchangeNotifications.getInbox(),
            achievements = a !== u ? a : StackExchangeNotifications.getAchievements();

        if (achievements.acquired > 0) {
            total += achievements.acquired;
        }

        if (achievements.score !== 0) {
            total += achievements.score;
        }

        if (inbox > 0) {
            inboxData.className = "push";
            inboxData.textContent = StackExchangeNotifications.utils.convertResult(inbox);
        } else {
            inboxData.className = "push hide";
        }

        if (total !== 0) {
            achievementsData.className = "push";
            achievementsData.textContent = StackExchangeNotifications.utils.convertResult(total);
        } else {
            achievementsData.className = "push hide";
        }
    }

    showButtonPushs();

    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.updatecounts) {
            showButtonPushs(request.updatecounts.inbox, {
                "acquired": request.updatecounts.acquired,
                "score": request.updatecounts.score
            });
        }
    });

    function actionCheckRead(current, box)
    {
        var target = box === "inbox" ? inboxContent : achievementsContent;

        current.addEventListener("click", function () {
            current.className = current.className.replace(/\bunread-item\b/g, " ").trim();

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

        var i, j, rules, image, imgUrl,
            allRulesBg = [], styles = d.styleSheets;

        for (var i = styles.length - 1; i >= 0; i--) {
            if (false === isHttpRegExp.test(styles[i].href)) {
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
                    (image = rules[j].style.backgroundImage.match(imgExtensionRegexp))
                ) {
                    imgUrl = image[2];

                    if (!isHttpRegExp.test(imgUrl)) {
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
            } else if (data.indexOf("<") !== -1) {
                setTimeout(function () {
                    StackExchangeNotifications.setInbox(0);
                    StackExchangeNotifications.update();
                }, 500);

                inboxContent.innerHTML = StackExchangeNotifications.utils.clearDomString(data);

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

                        dateContent.textContent = hour + ":" + min;
                    }
                }

                saveStateDetect("achievements");
            }

            setTimeout(bgCss, 500);

            achievementsContent.className =
                achievementsContent.className.replace(bgLoaderRegExp, "").trim();
        });
    };

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
})(window, document);
