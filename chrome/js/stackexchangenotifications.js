/*
 * StackExchangeNotifications 1.1.0
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    var delay = 60, //In seconds
        initiateDelay = 5000; //Milliseconds

    var unreadCountsURI = "https://stackexchange.com/topbar/get-unread-counts",
        achievementsURI = "https://stackexchange.com/topbar/achievements",
        inboxURI        = "https://stackexchange.com/topbar/inbox";

    var inbox = 0,
        score = 0,
        acquired = 0;

    var doneCallback = null,
        isRunning = false,
        timer = null,
        noNeedRequestXhr = false,
        browser = w.chrome||w.browser;

    var tmpDom     = d.createElement("div"),
        validAttrs = [ "class", "id", "href" ];

    var Utils = {
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

                if (attrs[i].specified && validAttrs.indexOf(currentAttr) === -1) {
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
        },
        "generateCssImages": function (resources, callback) {
            var total = resources.length;

            function trigger() {
                if (total > 0) {
                    return;
                }

                var tmpCss = "";

                for (i = resources.length - 1; i >= 0; i--) {
                    if (resources[i].bin) {
                        tmpCss += resources[i].selector +
                                    ' { background-image: url(' + resources[i].bin + '); }';
                    }
                }

                callback(tmpCss);
            }

            for (var c, i = resources.length - 1; i >= 0; i--) {
                var current = i;
                var img = new Image();

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

    var tmpCanvas, canvasContext;

    function img2base64(img)
    {
        if (!tmpCanvas) {
            tmpCanvas = d.createElement("canvas");
            canvasContext = tmpCanvas.getContext('2d');
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

    var sitesRE = new RegExp('^(' + getMatches(0).join("|")
                                    .replace(/(\.|\/)/g, "\\$1")
                                        .replace(/\*/g, ".*?") + ')$', 'i');

    function metaData()
    {
        var u;

        if (browser && browser.runtime && browser.runtime.getManifest) {
            var meta = browser.runtime.getManifest();

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
            headersLines = headersStr.split(/\n+/),
            re = /^([\w\-]+)[:]\s?([\s\S]+)$/i,
            headers = {}, current;

        for (var i = headersLines.length - 1; i >= 0; i--) {
            current = re.exec(headersLines[i]);

            if (current) {
                headers[ current[1] ] = current[2];
            }
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
                    setTimeout(function () {
                        callback("", 0, headers);
                    }, 200);
                } else {
                    var status = xhr.responseText === "" && xhr.status === 200 ? -1 : xhr.status;

                    callback(xhr.responseText, status, headers);
                }

                setTimeout(function () {
                    callback = null;
                    xhr = null;
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

            if (el.display !== "none") {
                result = parseInt(el.textContent);
            }
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

                score = parseInt(data.UnreadRepCount);
                inbox = data.UnreadInboxCount ? parseInt(data.UnreadInboxCount) : 0;
                acquired = data.UnreadNonRepCount ? parseInt(data.UnreadNonRepCount) : 0;

                if (score !== 0 || acquired > 0) {
                    SimpleCache.set("achievements", null);
                }

                if (inbox !== 0) {
                    SimpleCache.set("inbox", null);
                }

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

    w.StackExchangeNotifications = {
        "boot": function () {
            //Improve performance in Opera and older machines
            setTimeout(function () {
                initiateDelay = 1;
                StackExchangeNotifications.inbox();
                StackExchangeNotifications.achievements();
            }, initiateDelay);

            if (SimpleCache.get("firstrun2", true)) {
                return false;
            }

            localStorage.clear();

            StackExchangeNotifications.switchEnable("editor_actived", true);
            StackExchangeNotifications.switchEnable("editor_preview", true);
            StackExchangeNotifications.switchEnable("editor_sync_scroll", true);

            StackExchangeNotifications.switchEnable("inbox", true);
            StackExchangeNotifications.switchEnable("score", true);
            StackExchangeNotifications.switchEnable("acquired", true);

            StackExchangeNotifications.switchEnable("gallery_box", true);
            StackExchangeNotifications.switchEnable("copy_code", true);

            SimpleCache.set("firstrun2", 1, true);

            return true;
        },
        "switchEnable": function (key, enable) {
            var kn = "switch_" + key;

            if (typeof enable === "boolean") {
                SimpleCache.set(kn, enable, true);
                return enable;
            }

            return !!SimpleCache.get(kn, true);
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
                if (code === 200) {
                    SimpleCache.set("achievements", [data, code, headers]);
                }

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
            if (sizeScore % 1 === 0) {
                score = sizeScore;
            }

            if (sizeAcquired > -1 && sizeAcquired % 1 === 0) {
                acquired = sizeAcquired;
            }
        },
        "setInbox": function (size) {
            if (size > -1 && size % 1 === 0) {
                inbox = size;
            }
        },
        "getAchievements": function () {
            return {
                "acquired": acquired,
                "score": score
            };
        },
        "getInbox": function () {
            return inbox;
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
                    "acquired": acquired,
                    "score": score,
                    "inbox": inbox
                });
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
        "meta": metaData,
        "utils": Utils
    };
})(window, document);
