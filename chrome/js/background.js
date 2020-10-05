/*
 * Prevent Duplicate Tabs
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/prevent-duplicate-tabs
 */

(function (w, u) {
    "use strict";

    if (typeof browser === "undefined") {
        w.browser = chrome;
    } else if (!w.browser) {
        w.browser = browser;
    }

    var configs,
        ignoreds,
        timeout,
        isHttpRE = /^https?:\/\/\w/i,
        linkJsonRE = /^\{[\s\S]+?\}$/,
        removeHashRE = /#[\s\S]+?$/,
        removeQueryRE = /\?[\s\S]+?$/,
        browser = w.browser;

    var unreadCountsURI = "https://stackexchange.com/topbar/get-unread-counts",
        achievementsURI = "https://stackexchange.com/topbar/achievements",
        inboxURI        = "https://stackexchange.com/topbar/inbox";

    function empty() {}

    function setStorage(key, value) {
        localStorage.setItem(key, JSON.stringify({ "value": value }));
    }

    function getStorage(key) {
        var itemValue = localStorage[key];

        if (!itemValue && !linkJsonRE.test(itemValue)) return false;

        var current = JSON.parse(itemValue);

        return current ? current.value : itemValue;
    }

    function getConfigs() {
        return {
            "turnoff": getStorage("turnoff"),
            "old": getStorage("old"),
            "active": getStorage("active"),
            "start": getStorage("start"),
            "replace": getStorage("replace"),
            "update": getStorage("update"),
            "create": getStorage("create"),
            "datachange": getStorage("datachange"),
            "http": getStorage("http"),
            "query": getStorage("query"),
            "hash": getStorage("hash"),
            "incognito": getStorage("incognito")
        };
    }

    function noCacheURI(uri) {
        return uri + (uri.indexOf("?") === -1 ? "?" : "&") + "_=" + new Date().getTime();
    }

    function update() {
        // {"UnreadInboxCount":0,"UnreadRepCount":0,"UnreadNonRepCount":0}
        httpRequest(unreadCountsURI, function () {
            setTimeout(update, 5000);
        });
    }

    function httpRequest(uri, callback)
    {
        var headers,
            completed = false,
            isAborted = false,
            xhr       = new XMLHttpRequest;

        console.log(uri, noCacheURI(uri))

        xhr.open("GET", noCacheURI(uri), true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && isAborted === false) {

                completed = true;

                headers = {};//headersXhrJson(xhr);

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

    if (!getStorage("firstrun")) {
        configs = {
            "turnoff": false,
            "old": true,
            "active": true,
            "start": true,
            "replace": true,
            "update": true,
            "create": true,
            "datachange": true,
            "http": true,
            "query": true,
            "hash": false,
            "incognito": false
        };

        for (var config in configs) {
            setStorage(config, configs[config]);
        }

        setStorage("firstrun", true);
    } else {
        configs = getConfigs();
    }

    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.setup) {
            configs[request.setup] = request.enable;
            setStorage(request.setup, request.enable);
        } else if (request.configs) {
            sendResponse(getConfigs());
        }

        if (request.setup || request.ignore !== u) {
            //if (configs.datachange) setTimeout(checkTabs, 10, "datachange");
        }
    });

    setTimeout(update, 1000);
})(window);
