/*
 * StackExchangeNotifications 1.1.0
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d, u) {
    "use strict";

    var theme, browser = w.chrome||w.browser, version = d.getElementById("version");

    var debugMode = !(
        "update_url" in browser.runtime.getManifest() ||
        browser.runtime.id === "stackexchangenotifications@mozilla.org"
    );

    if (version) {
        var manifestData = StackExchangeNotifications.meta();
        version.textContent = manifestData.appname + " " + manifestData.version;
    }

    function changeTheme()
    {
        var enabled = StackExchangeNotifications.switchEnable("dark_theme");

        if (enabled) {
            if (!theme) {
                theme = StackExchangeNotifications.utils.resourceStyle("themes/dark/options");
            } else {
                theme.disabled = false;
            }

            checkEvent();
        } else if (theme) {
            theme.disabled = true;
        }

        return enabled;
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

    function ready(response)
    {
        d.getElementById("setup-inner").innerHTML = response;

        var switchs = d.querySelectorAll("a[data-switch]"),
            clearCache = d.getElementById("clear-cache"),
            clearAllData = d.getElementById("clear-all-data"),
            switchTheme = d.querySelector("a[data-switch='dark_theme']");

        switchTheme.addEventListener("click", function () {
            setTimeout(changeTheme, 150, false);

            browser.runtime.sendMessage({
                "updatetheme": true,
                "from": w.location.href
            }, function () {});
        });

        for (var i = 0, j = switchs.length; i < j; i++) {
            switchEngine(switchs[i]);
        }

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

        browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request && request.updatetheme && request.from !== w.location.href) {
                switchTheme.setAttribute("data-switch-value", changeTheme() ? "on" : "off");
            }
        });
    }

    function checkEvent()
    {
        var lc = StackExchangeNotifications.restoreState("lastcheck");

        if (StackExchangeNotifications.utils.eventDay(lc)) {
            d.body.className += " horror";
        }
    }

    function disableEvent(e)
    {
        if (!debugMode) {
            e.preventDefault();
            return false;
        }
    }

    function setActionAnchor(e)
    {
        if (e.button !== 0) {
            return;
        }

        setTimeout(function (s) { s.blur(); }, 300, e.target);

        var el = e.target;

        if (!el.href) {
            while ((el = el.parentNode) && el.nodeType === 1) {
                if (el.tagName === "A") {
                    break;
                }
            }
        }

        if (!el || !el.href) {
            return;
        }

        e.preventDefault();

        if (!/^https?\:\/\//.test(el.href)) {
            return;
        }

        setTimeout(function (url) {
            if (!StackExchangeNotifications.switchEnable("prevent_duplicate")) {
                browser.tabs.create({ "url": url });
                return;
            }

            browser.tabs.query({ "url": "https://*/*" }, function (tabs) {
                var tabId, checkUrl = removeQuerystringAndHash(url);

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
                    browser.tabs.create({ "url": url });
                }
            });
        }, 1, el.href);
    }

    d.oncontextmenu = disableEvent;
    d.ondragstart = disableEvent;
    d.onclick = setActionAnchor;

    setTimeout(function () {
        StackExchangeNotifications.boot();

        changeTheme();

        StackExchangeNotifications.utils.resource("/views/setup.html", ready);
    }, 50);
})(window, document);
