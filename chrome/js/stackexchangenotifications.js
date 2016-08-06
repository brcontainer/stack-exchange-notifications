/*
 * StackExchangeNotifications 0.1.3
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function() {
    "use strict";

    var delay = 60, //In seconds
        initiateDelay = 5000; //Milesec

    var unreadCountsURI = "http://stackexchange.com/topbar/get-unread-counts",
        achievementsURI = "http://stackexchange.com/topbar/achievements",
        inboxURI        = "http://stackexchange.com/topbar/inbox";

    var inbox = 0,
        achievements = 0;

    var doneCallback = null,
        isRunning = false,
        timer = null,
        inSleepMode = false
    ;

    var tmpDom     = document.createElement("div"),
        validAttrs = [ "class", "id", "href" ];

    var Utils = {
        "convertResult": function(size) {
            if (size === 0) {
                return "";
            } else if (size < 1000) {
                return String(size);
            }

            return "+1k";
        },
        "removeInvalidAttributes": function(target) {
            var attrs = target.attributes, currentAttr;

            for (var i = attrs.length - 1; i >= 0; i--) {
                currentAttr = attrs[i].name;

                if (attrs[i].specified && validAttrs.indexOf(currentAttr) === -1) {
                    target.removeAttribute(currentAttr);
                }

                if (
                    currentAttr === "href" &&
                    /^(#|javascript[:])/gi.test(target.getAttribute("href"))
                ) {
                    target.parentNode.removeChild(currentAttr);
                }
            }
        },
        "cleanDomString": function(data) {
            tmpDom = (new DOMParser).parseFromString(data, "text/html").body;

            var list, current, currentHref;

            list = tmpDom.querySelectorAll("script,img");

            for (var i = list.length - 1; i >= 0; i--) {
                current = list[i];
                current.parentNode.removeChild(current);
            }

            list = tmpDom.getElementsByTagName("*");

            for (i = list.length - 1; i >= 0; i--) {
                Utils.removeInvalidAttributes(list[i]);
            }

            list = tmpDom.querySelectorAll("link");

            for (var i = list.length - 1; i >= 0; i--) {
                list[i].type = "text/css";
                list[i].rel  = "stylesheet";
            }

            return tmpDom.innerHTML;
        }
    };

    function metaData()
    {
        var u;

        if (chrome && chrome.runtime && chrome.runtime.getManifest) {
            var meta = chrome.runtime.getManifest();

            return {
                "appname": meta.name,
                "version": meta.version
            };
        }

        return {
            "appname": u,
            "version": u
        }
    };

    function noCacheURI(uri)
    {
        return [ uri, "?_=", new Date().getTime() ].join("");
    }

    function headersXhrJson(xhr)
    {
        var headersStr = String(xhr.getAllResponseHeaders()).trim(),
            headersLines = headersStr.split(/\n/),
            current,
            headers = {},
            re = /^([a-z0-9\-]+[:])[\s\S]+$/gi;

        for (var i = headersLines.length - 1; i >= 0; i--) {
            current = headersLines[i];
            headers[ current.replace(/:[\s\S]+$/, "") ] =
                                    current.replace(/^[^:]+:/, "").trim();
        }

        return headers;
    }

    function quickXhr(uri, callback)
    {
        var
            headers,
            completed = false,
            isAborted = false,
            xhr       = new XMLHttpRequest();

        xhr.open("GET", noCacheURI(uri), true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && isAborted === false) {

                completed = true;

                headers = headersXhrJson(xhr);

                if (xhr.status === 0) {
                    setTimeout(function() {
                        callback("", 0, headers);
                    }, 200);
                } else {
                    var status = xhr.responseText === "" && xhr.status === 200 ? -1 : xhr.status;

                    callback(xhr.responseText, status, headers);
                }

                setTimeout(function() {
                    callback = null;
                    xhr = null;
                }, 1000);
            }
        };

        xhr.send(null);

        return {
            "abort": function() {
                if (completed === false) {
                    isAborted = true;
                    try {
                        xhr.abort();
                    } catch (ee) {}
                }
            }
        };
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
                switch (key) {
                    case "inbox":
                        change = StackExchangeNotifications.getInbox() !== 0;
                    break;

                    case "achievements":
                        change = StackExchangeNotifications.getAchievements() !== 0;
                    break;
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
        quickXhr(unreadCountsURI, triggerEvt);
    }

    function getResult(target)
    {
        var el, result = 0;

        if (target.length > 0) {
            el = target[0];

            if (el.display !== "none") {
                result = parseInt(el.innerHTML);
            }
        }

        return isNaN(result) ? 0 : result;
    }

    function triggerEvt(response, code)
    {
        var currentDelay = 1000 * delay;

        if (code !== 200) {
            /*
             * If the internet access fails uses a smaller delay
             */
            currentDelay = 1000;
        } else if (typeof response === "string") {
            var data;

            try {
                data = JSON.parse(response);
            } catch (ee) {}

            if (typeof data.UnreadRepCount !== "undefined") {

                achievements = parseInt(data.UnreadRepCount);
                inbox = data.UnreadInboxCount ? parseInt(data.UnreadInboxCount) : 0;

                if (achievements !== 0) {
                    SimpleCache.set("achievements", null);
                } else {
                    achievements = data.UnreadNonRepCount ? parseInt(data.UnreadNonRepCount) : 0;
                }

                if (inbox !== 0) {
                    SimpleCache.set("inbox", null);
                }

                if (doneCallback !== null) {
                    doneCallback({
                        "achievements": achievements,
                        "inbox": inbox
                    });
                }
            }
        }

        timer = setTimeout(retrieveData, currentDelay);
    }

    var
        RunnigNotifications = false,
        ListNotifications = [],
        UsedNotificationsSession = [],
        CurrentNotification = 0,
        TokenNotifications = String(new Date().getTime() / 1000) + "_"
    ;

    function saveNotifications()
    {
        SimpleCache.set("notificationbackup", ListNotifications, true);
    }

    function showNotifications()
    {
        RunnigNotifications = true;

        var data = ListNotifications[CurrentNotification];

        CurrentNotification++;

        if (!data) {
            CurrentNotification--;
            RunnigNotifications = false;
            return;
        } else if (data === 1) {
            setTimeout(showNotifications, 1000);
            return;
        }

        var props = {
            "type":    "basic",
            "title":   data.title,
            "iconUrl": "images/icon-128px.png",
            "message": data.message,
            "requireInteraction": true
        };

        //Prevent not show in Opera
        var id = TokenNotifications + data.id;

        try {
            chrome.notifications.create(id, props, function() {});
        } catch (ee) {
            //Firefox don't support requireInteraction and causes exception

            delete props.requireInteraction;

            chrome.notifications.create(id, props, function() {});
        }

        setTimeout(showNotifications, 1000);
    }

    window.StackExchangeNotifications = {
        "boot": function() {
            //Improve perfomance in Opera and older machinesSW
            setTimeout(function() { initiateDelay = 1; }, initiateDelay);

            if (SimpleCache.get("firstrun", true)) {
                return false;
            }

            localStorage.clear();

            StackExchangeNotifications.switchEnable("editor_actived", true);
            StackExchangeNotifications.switchEnable("editor_preview", true);

            StackExchangeNotifications.switchEnable("inbox", true);
            StackExchangeNotifications.switchEnable("reputation", true);
            StackExchangeNotifications.switchEnable("achievements", true);

            StackExchangeNotifications.switchEnable("lightbox", true);

            SimpleCache.set("firstrun", 1, true);

            return true;
        },
        "enableSleepMode": function(enable) {
            if (typeof enable === "boolean") {
                inSleepMode = !!enable;
            }

            if (!inSleepMode && !RunnigNotifications) {
                RunnigNotifications = true;

                setTimeout(showNotifications, initiateDelay);
            }

            return inSleepMode;
        },
        "switchEnable": function(key, enable) {
            var kn = "switch_" + key;

            if (typeof enable === "boolean") {
                SimpleCache.set(kn, enable, true);
                return enable;
            }

            return !!SimpleCache.get(kn, true);
        },
        "removeNotificationFromCache": function(id) {
            for (var i = ListNotifications.length - 1; i >= 0; i--) {
                var c = ListNotifications[i];

                if (c && c.id === id) {
                    ListNotifications[i] = true;
                    break;
                }
            }

            saveNotifications();
        },
        "notificationsSession": function() {
            return TokenNotifications;
        },
        "notify": function(id, title, message) {
            if (!StackExchangeNotifications.switchEnable("editor_actived")) {
                return;
            }

            if (UsedNotificationsSession.indexOf(id) !== -1) {
                return;
            }

            UsedNotificationsSession.push(id);

            ListNotifications.push({ "id": id, "title": title, "message": message });

            saveNotifications();

            if (!inSleepMode && !RunnigNotifications) {
                RunnigNotifications = true;

                setTimeout(showNotifications, initiateDelay);
            }
        },
        "pushs": function(callback) {
            if (false === isRunning && typeof callback === "function") {
                isRunning     = true;
                doneCallback  = callback;
                retrieveData();
            }
        },
        "achievements": function(callback) {
            if (typeof callback === "function") {
                var cache = SimpleCache.get("achievements");

                if (cache) {
                    callback(cache[0], cache[1], cache[2]);
                    return null;
                }

                return quickXhr(achievementsURI, function (data, code, headers) {
                    if (code === 200) {
                        SimpleCache.set("achievements", [data, code, headers]);
                    }

                    callback(data, code, headers);
                });
            }

            return null;
        },
        "inbox": function(callback) {
            if (typeof callback === "function") {
                var cache = SimpleCache.get("inbox");

                if (cache) {
                    callback(cache[0], cache[1], cache[2]);
                    return null;
                }

                return quickXhr(inboxURI, function (data, code, headers) {
                    if (code === 200) {
                        SimpleCache.set("inbox", [data, code, headers]);
                    }

                    callback(data, code, headers);
                });
            }

            return null;
        },
        "setAchievements": function(size) {
            if (size % 1 === 0) {
                achievements = size;
            }
        },
        "setInbox": function(size) {
            if (size > -1 && size % 1 === 0) {
                inbox = size;
            }
        },
        "getAchievements": function() {
            return achievements;
        },
        "getInbox": function() {
            return inbox;
        },
        "hasCache": function(cache) {
            return !!SimpleCache.get(cache);
        },
        "clearCache": function(current) {
            switch (current) {
                case "inbox":
                case "achievements":
                    SimpleCache.set(current, null);
                break;

                default:
                    SimpleCache.set("inbox", null);
                    SimpleCache.set("achievements", null);
            }
        },
        "update": function(reload) {
            if (false === isRunning) {
                return;
            }

            if (reload === true) {
                if (timer !== false) {
                    clearTimeout(timer);
                }

                setTimeout(retrieveData, 1);
            } else if (doneCallback !== null) {
                doneCallback({
                    "achievements": achievements,
                    "inbox": inbox
                });
            }
        },
        "saveState": function(key, data, noToken) {
            return SimpleCache.set(key, data, noToken);
        },
        "restoreState": function(key, noToken) {
            var data = SimpleCache.get(key, noToken);

            if (data) {
                return data;
            }

            return false;
        },
        "meta": metaData,
        "utils": Utils
    };
}());
