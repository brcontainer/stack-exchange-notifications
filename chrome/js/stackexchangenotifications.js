/*
 * StackExchangeNotifications
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d, u) {
    "use strict";

    if (typeof browser === "undefined") {
        w.browser = chrome;
    } else if (!w.browser) {
        w.browser = browser;
    }

    var delay = 60, //In seconds
        initiateDelay = 5000; //Milliseconds

    var unreadCountsURI = "https://stackexchange.com/topbar/get-unread-counts",
        achievementsURI = "https://stackexchange.com/topbar/achievements",
        inboxURI        = "https://stackexchange.com/topbar/inbox";

    var doneCallback = null,
        isRunning = false,
        timer = null,
        noNeedRequestXhr = false,
        isBackground = false;

    var isHttpRegExp = /^https?\:\/\/[^/]/i,
        dateRegExp = /last\s+?(\d+)\s+?days|(\w{3}) (\d{1,2}) at (\d{1,2}:\d{1,2})/i,
        lastDaysRegExp = /last\s+?(\d+)\s+?days/i,
        tmpDom = d.createElement("div"),
        allowedAttrs = [ "class", "id", "href" ],
        allowedTags = [
            "link",
            "h1", "h2", "h3", "h4", "a",
            "div", "span", "article", "aside", "details",
            "footer", "header", "main", "mark", "nav",
            "section", "summary", "time",
            "i", "s", "u", "strong", "em",
            "ul", "ol", "li"
        ];

    var notSelector = ":not(" + allowedTags.join("):not(") + ")";

    var tmpCanvas, canvasContext;

    function img2base64(img)
    {
        if (!tmpCanvas) {
            tmpCanvas = d.createElement("canvas");
            canvasContext = tmpCanvas.getContext("2d");
        }

        canvasContext.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);

        tmpCanvas.width  = img.naturalWidth;
        tmpCanvas.height = img.naturalHeight;

        canvasContext.drawImage(img, 0, 0);

        return tmpCanvas.toDataURL();
    }

    function getMatches(value)
    {
        if (browser && browser.runtime && browser.runtime.getManifest) {
            var data = browser.runtime.getManifest();

            return data.content_scripts[value].matches;
        }
    }

    var sitesRE = new RegExp("^(" + getMatches(0).join("|")
                                    .replace(/(\.|\/)/g, "\\$1")
                                        .replace(/\*/g, ".*?") + ")$", "i");

    function metaData()
    {
        if (browser && browser.runtime && browser.runtime.getManifest) {
            var meta = browser.runtime.getManifest();

            return {
                "appname": meta.name,
                "version": meta.version
            };
        }

        return { "appname": u, "version": u }
    };

    function noCacheURI(uri)
    {
        return [ uri, "?_=", new Date().getTime() ].join("");
    }

    function headersXhrJson(xhr)
    {
        var headersStr = String(xhr.getAllResponseHeaders()).trim(),
            headersLines = headersStr.split(/\n+/),
            re = /^([\w\-]+)[:]\s?([\s\S]+)$/i,
            headers = {}, current;

        for (var i = headersLines.length - 1; i >= 0; i--) {
            current = re.exec(headersLines[i]);

            if (current) headers[ current[1] ] = current[2];
        }

        return headers;
    }

    function quickXhr(uri, callback)
    {
        var headers,
            completed = false,
            isAborted = false,
            xhr       = new XMLHttpRequest;

        xhr.open("GET", noCacheURI(uri), true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && isAborted === false) {

                completed = true;

                headers = headersXhrJson(xhr);

                if (xhr.status === 0) {
                    setTimeout(callback, 200, "", 0, headers);
                } else {
                    var status = xhr.responseText === "" && xhr.status === 200 ? -1 : xhr.status;

                    callback(xhr.responseText, status, headers);
                }

                setTimeout(function () {
                    xhr = callback = null;
                }, 1000);
            }
        };

        xhr.send(null);

        return {
            "abort": function () {
                if (completed === false) {
                    isAborted = true;

                    try {
                        xhr.abort();
                    } catch (ee) {}
                }
            }
        };
    }

    var switchFieldTimeouts = {};

    function switchFieldClass(key, enable)
    {
        if (switchFieldTimeouts[key]) clearTimeout(switchFieldTimeouts[key]);

        switchFieldTimeouts[key] = setTimeout(function () {
            var input = d.querySelector("input[type='checkbox'][id='" + key + "']");

            if (input) {
                var field = input.closest(".field");

                field.classList.add(key);
                field.classList.toggle("active", enable);
            } else {
                setTimeout(switchFieldClass, 50, key, enable);
            }
        }, 50);
    }

    var tokenCache = String(metaData().version) + "_cache";

    var SimpleCache = {
        "set": function (key, data, noToken) {
            var keyData = key + (noToken ? "" : ("_" + tokenCache));

            if (data !== null) {
                localStorage.setItem(keyData, JSON.stringify([data]));
            } else {
                localStorage.removeItem(keyData);
            }
        },
        "get": function (key, noToken) {
            var change  = false,
                keyData = key + (noToken ? "" : ("_" + tokenCache)),
                data = localStorage.getItem(keyData);

            if (data) {
                if (key === "inbox") {
                    change = StackExchangeNotifications.getInbox() !== 0;
                } else if (key === "achievements") {
                    var ach = StackExchangeNotifications.getAchievements();
                    change = ach.score !== 0 || ach.acquired !== 0;
                }

                if (change) {
                    data = null;
                    SimpleCache.set(key, null);
                }

                if (data) {
                    try {
                        data = JSON.parse(data);
                        data = data[0];
                    } catch (ee) {
                        data = null;
                    }
                }

                return data;
            }
        }
    }

    function retrieveData()
    {
        var total = 0;

        //If updateByInjected = true retest if closed
        browser.tabs.query({ url: "https://*/*" }, function (tabs) {
            for (var i = tabs.length - 1; i >= 0; i--) {
                if (sitesRE.test(tabs[i].url)) {
                    total++;
                    break;
                }
            }

            if (total === 0) {
                /*
                 * Disable StackExchangeNotifications.detectDOM if there are
                 * no more tabs of sites in the SE network
                 */
                noNeedRequestXhr = false;
            }

            if (noNeedRequestXhr) {
                timer = setTimeout(retrieveData, 1000);
            } else {
                quickXhr(unreadCountsURI, triggerEvt);
            }
        });
    }

    function getResult(target)
    {
        var el, result = 0;

        if (target.length > 0) {
            el = target[0];

            if (el.display !== "none") result = parseInt(el.textContent);
        }

        return isNaN(result) ? 0 : result;
    }

    function triggerEvt(response, code, headers)
    {
        var currentDelay = 1000 * delay;

        if (code !== 200) {
            //If the internet access fails uses a smaller delay
            currentDelay = 1000;
        } else if (typeof response === "string") {
            var data;

            try {
                data = JSON.parse(response);
            } catch (ee) {}

            if (typeof data.UnreadRepCount !== "undefined") {
                if (headers && headers.date) {
                    StackExchangeNotifications.saveState("lastcheck", headers.date);
                }

                var score = parseInt(data.UnreadRepCount),
                    inbox = data.UnreadInboxCount ? parseInt(data.UnreadInboxCount) : 0,
                    acquired = data.UnreadNonRepCount ? parseInt(data.UnreadNonRepCount) : 0;

                if (score !== 0 || acquired > 0) SimpleCache.set("achievements", null);

                if (inbox !== 0) SimpleCache.set("inbox", null);

                if (doneCallback !== null) {
                    doneCallback({
                        "acquired": acquired,
                        "score": score,
                        "inbox": inbox
                    });
                }
            }
        }

        timer = setTimeout(retrieveData, currentDelay);
    }

    function fixLinkStyle(link)
    {
        if (!isHttpRegExp.test(link.href) || d.querySelector("[href='" + link.href + "']")) {
            return false;
        }

        if (link.type === "text/css" || link.rel === "stylesheet" || link.type === "" || link.rel === "") {
            if (link.type !== "text/css") link.setAttribute("type", "text/css");

            if (link.rel !== "stylesheet") link.setAttribute("rel", "stylesheet");

            d.head.appendChild(link);

            return true;
        }

        return false;
    }

    function translateMonth(month)
    {
        return browser.i18n.getMessage("month_" + month.toLowerCase());
    }

    w.StackExchangeNotifications = {
        "boot": function () {
            //Improve performance in Opera and older machines
            setTimeout(function () {
                try {
                    chrome.browserAction.setBadgeTextColor({color: "white"});
                } catch (ee) {}

                chrome.browserAction.setBadgeBackgroundColor({color:"#EE0101"});
            }, 1);

            setTimeout(function () {
                initiateDelay = 1;

                StackExchangeNotifications.inbox();
                StackExchangeNotifications.achievements();
            }, initiateDelay);

            if (SimpleCache.get("firstrun3", true)) return false;

            if (!SimpleCache.get("firstrun2", true)) {
                StackExchangeNotifications.switchEnable("inbox", true);
                StackExchangeNotifications.switchEnable("score", true);
                StackExchangeNotifications.switchEnable("acquired", true);

                StackExchangeNotifications.switchEnable("dark_theme", false);

                StackExchangeNotifications.switchEnable("gallery_box", true);
                StackExchangeNotifications.switchEnable("copy_code", true);

                StackExchangeNotifications.switchEnable("prevent_duplicate", false);

                StackExchangeNotifications.switchEnable("editor_actived", true);
                StackExchangeNotifications.switchEnable("editor_sync_scroll", true);
                StackExchangeNotifications.switchEnable("editor_preview", true);
                StackExchangeNotifications.switchEnable("editor_auto_fs", true);
                StackExchangeNotifications.switchEnable("editor_tabs_by_spaces", true);
                StackExchangeNotifications.switchEnable("editor_italic", true);
            }

            StackExchangeNotifications.switchEnable("lose_score", true);
            StackExchangeNotifications.switchEnable("score_bydowns", true);

            SimpleCache.set("firstrun3", 1, true);

            return true;
        },
        "background": function () {
            isBackground = true;
        },
        "switchEnable": function (key, enable) {
            var keyName = "switch_" + key;

            if (typeof enable === "boolean") {
                SimpleCache.set(keyName, enable, true);

                switchFieldClass(key, enable);

                return enable;
            }

            var enable = !!SimpleCache.get(keyName, true);

            switchFieldClass(key, enable);

            return enable;
        },
        "pushs": function (callback) {
            if (false === isRunning && typeof callback === "function") {
                isRunning = true;
                doneCallback = callback;

                retrieveData();
            }
        },
        "achievements": function (callback) {
            var hc = typeof callback === "function";
            var cache = hc && SimpleCache.get("achievements");

            if (cache) {
                callback(cache[0], cache[1], cache[2]);
                return null;
            }

            return quickXhr(achievementsURI, function (data, code, headers) {
                if (code === 200) SimpleCache.set("achievements", [data, code, headers]);

                hc && callback(data, code, headers);
            });
        },
        "inbox": function (callback) {
            var hc = typeof callback === "function";
            var cache = hc && SimpleCache.get("inbox");

            if (cache) {
                callback(cache[0], cache[1], cache[2]);
                return null;
            }

            return quickXhr(inboxURI, function (data, code, headers) {
                if (code === 200) {
                    SimpleCache.set("inbox", [data, code, headers]);
                }

                hc && callback(data, code, headers);
            });
        },
        "setAchievements": function (sizeScore, sizeAcquired) {
            var data = StackExchangeNotifications.getAchievements();

            if (sizeScore % 1 === 0) data.score = sizeScore;

            if (sizeAcquired > -1 && sizeAcquired % 1 === 0) data.acquired = sizeAcquired;

            SimpleCache.set("achievementsCount", data);
            data = null;
        },
        "setInbox": function (size) {
            if (size > -1 && size % 1 === 0) SimpleCache.set("inboxCount", size);
        },
        "getAchievements": function () {
            var data = SimpleCache.get("achievementsCount");
            return {
                "acquired": data && data.acquired ? data.acquired : 0,
                "score": data && data.score ? data.score : 0
            };
        },
        "getInbox": function () {
            var data = SimpleCache.get("inboxCount");
            return data ? data : 0;
        },
        "hasCache": function (cache) {
            return !!SimpleCache.get(cache);
        },
        "clearCache": function (current) {
            if (current === "inbox" || current === "achievements") {
                SimpleCache.set(current, null);
            } else {
                SimpleCache.set("inbox", null);
                SimpleCache.set("achievements", null);
            }
        },
        "update": function (reload) {
            if (!isBackground) {
                browser.runtime.sendMessage("update");
            } else if (isRunning) {
                if (reload === true) {
                    if (timer !== false) clearTimeout(timer);

                    setTimeout(retrieveData, 1);
                } else if (doneCallback !== null) {
                    var data = StackExchangeNotifications.getAchievements();

                    data.inbox = StackExchangeNotifications.getInbox();

                    doneCallback(data);

                    data = null;
                }
            }
        },
        "saveState": function (key, data, noToken) {
            return SimpleCache.set(key, data, noToken);
        },
        "restoreState": function (key, noToken) {
            var data = SimpleCache.get(key, noToken);
            return data ? data : false;
        },
        "detectDOM": function (detect) {
            noNeedRequestXhr = detect;
        },
        "meta": metaData
    };

    var Utils = {
        "markdown": function (message) {
            return message
                .replace(/(^|\s)_(.*?)_($|\s)/g, '$1<i>$2<\/i>$3')
                    .replace(/(^|\s)`(.*?)`($|\s)/g, '$1<code>$2<\/code>$3')
                        .replace(/\{([a-z])(\w+)?\}/gi, '<var name="$1$2"><\/var>')
                            .replace(/(^|\s)\*(.*?)\*($|\s)/g, '$1<strong>$2<\/strong>$3');
        },
        "translate": function (doc) {
            var locales = doc.querySelectorAll("[data-i18n]");

            for (var i = locales.length - 1; i >= 0; i--) {
                var el = locales[i], message = browser.i18n.getMessage(el.dataset.i18n);

                if (message) el.innerHTML = Utils.markdown(message);
            }

            if (navigator.language.indexOf("en") === 0) return;

            var inboxTitle = doc.querySelector(".inbox-dialog h3"),
                achievementsTitle = doc.querySelector(".achievements-dialog h3");

            if (inboxTitle) {
                inboxTitle.textContent = browser.i18n.getMessage("inbox");
            } else if (achievementsTitle) {
                achievementsTitle.textContent = browser.i18n.getMessage("achievements");
            }

            var relativetimes = doc.querySelectorAll(".relativetime,.date-header");

            for (var i = relativetimes.length - 1; i >= 0; i--) {
                var message = u, el = relativetimes[i], txtEl = el.textContent.trim().toLowerCase();

                if (txtEl === "today") {
                    message = browser.i18n.getMessage("today");
                } else if (txtEl === "yesterday") {
                    message = browser.i18n.getMessage("yesterday");
                }

                if (message === u) {
                    var relativelastday = txtEl.match(lastDaysRegExp);

                    if (relativelastday !== null) {
                        message = browser.i18n.getMessage("last_days")
                                    .replace(/\{days\}/g, relativelastday[1]);
                    } else {
                        var relativedatehour = txtEl.match(dateRegExp);

                        if (relativedatehour === null) continue;

                        if (relativedatehour[2] === u) {
                            message = browser.i18n.getMessage("last_days")
                                        .replace(/\{days\}/g, relativedatehour[1]);
                        } else {
                            message = browser.i18n.getMessage("date_at")
                                        .replace(/\{month\}/g, translateMonth(relativedatehour[2]))
                                        .replace(/\{date\}/g, relativedatehour[3])
                                        .replace(/\{hour\}/g, relativedatehour[4]);
                        }
                    }
                }

                if (message) el.innerHTML = message;
            }

            var types = doc.querySelectorAll(".inbox-item .item-type > span");

            for (var i = types.length - 1; i >= 0; i--) {
                var el = types[i], textNode = el.nextSibling;

                if (textNode && textNode.nodeType === 3) {
                    var type = textNode.textContent.trim().toLowerCase().replace(/\s+/, "_");

                    if (type === "-") continue;

                    var newtext = browser.i18n.getMessage("inbox_" + type);

                    if (newtext && newtext !== "") {
                        type = newtext;
                    } else {
                        type = textNode.textContent;
                    }

                    textNode.textContent = "-";

                    var badge = d.createElement("div");

                    badge.className = "sen-inbox-type";
                    badge.textContent = type;

                    el.parentNode.appendChild(badge);
                }
            }
        },
        "convertResult": function (size) {
            if (size === 0) {
                return "";
            } else if (size < 1000) {
                return String(size);
            }

            return "+1k";
        },
        "removeInvalidAttributes": function (target) {
            var attrs = target.attributes, currentAttr;

            for (var i = attrs.length - 1; i >= 0; i--) {
                currentAttr = attrs[i].name;

                if (attrs[i].specified && allowedAttrs.indexOf(currentAttr) === -1) {
                    target.removeAttribute(currentAttr);
                }

                if (
                    currentAttr === "href" &&
                    /^(#|javascript[:])/i.test(target.getAttribute("href"))
                ) {
                    target.parentNode.removeChild(currentAttr);
                }
            }
        },
        "clearDomString": function (data) {
            tmpDom = (new DOMParser).parseFromString(data, "text/html").body;

            var list, current, currentHref, toRemove = [];

            list = tmpDom.querySelectorAll(notSelector);

            for (var i = list.length - 1; i >= 0; i--) {
                toRemove.push(list[i]);
            }

            list = tmpDom.querySelectorAll("link");

            for (var i = list.length - 1; i >= 0; i--) {
                if (!fixLinkStyle(list[i])) toRemove.push(list[i]);
            }

            if (!StackExchangeNotifications.switchEnable("lose_score")) {
                list = tmpDom.querySelectorAll("li a span");

                for (var i = list.length - 1; i >= 0; i--) {
                    var value = list[i].textContent.trim();

                    if (value[0] === "-" || value[0] === "−") {
                        toRemove.push(list[i].closest("li"));
                    }
                }
            } else if (!StackExchangeNotifications.switchEnable("score_bydowns")) {
                list = tmpDom.querySelectorAll("li a span");

                for (var i = list.length - 1; i >= 0; i--) {
                    var value = list[i].textContent.trim();

                    if (value === "-1" || value === "−1") {
                        toRemove.push(list[i].closest("li"));
                    }
                }
            }

            for (var i = toRemove.length - 1; i >= 0; i--) {
                toRemove[i].parentNode.removeChild(toRemove[i]);
            }

            toRemove = [];

            list = tmpDom.querySelectorAll("div + ul");

            for (var i = list.length - 1; i >= 0; i--) {
                if (list[i].textContent.trim() === "") {
                    toRemove.push(list[i].closest("div"));
                }
            }

            for (var i = toRemove.length - 1; i >= 0; i--) {
                toRemove[i].parentNode.removeChild(toRemove[i]);
            }

            list = tmpDom.getElementsByTagName("*");

            for (i = list.length - 1; i >= 0; i--) {
                Utils.removeInvalidAttributes(list[i]);
            }

            toRemove = list = null;

            Utils.translate(tmpDom);

            return tmpDom.innerHTML;
        },
        "generateCssImages": function (resources, callback) {
            var total = resources.length;

            function trigger() {
                if (total > 0) return;

                var tmpCss = "";

                for (i = resources.length - 1; i >= 0; i--) {
                    if (resources[i].bin) {
                        tmpCss += resources[i].selector +
                                    " { background-image: url(" + resources[i].bin + "); }";
                    }
                }

                callback(tmpCss);
            }

            for (var c, i = resources.length - 1; i >= 0; i--) {
                var current = i, img = new Image;

                img.onload = function () {
                    --total;
                    resources[current].bin = img2base64(img);
                    trigger();
                };

                img.onerror = function () {
                    --total;
                    resources[current] = null;
                    trigger();
                };

                img.src = resources[i].url;
            }
        }
    };

    w.StackExchangeNotifications.utils = Utils;
})(window, document);
