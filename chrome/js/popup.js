/*
 * Prevent Duplicate Tabs
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/prevent-duplicate-tabs
 */

(function (w, d) {
    "use strict";

    if (typeof browser === "undefined") {
        w.browser = chrome;
    } else if (!w.browser) {
        w.browser = browser;
    }

    var debugMode = false,
        browser = w.browser,
        isHttpRE = /^https?:\/\/[^\/]/i,
        manifest = browser.runtime.getManifest(),
        _app = d.getElementById("app"),
        _tabs = browser.tabs;

    if (browser.runtime.id && !("requestUpdateCheck" in browser.runtime)) {
        if (/@temporary-addon$/.test(browser.runtime.id)) debugMode = true;
    } else if (!("update_url" in manifest)) {
        debugMode = true;
    }

    function disableEvent(e) {
        e.preventDefault();
        return false;
    }

    if (!debugMode) {
        d.oncontextmenu = disableEvent;
        d.ondragstart = disableEvent;
    }

    function changeTab(btn)
    {
        var target = btn.dataset.tab,
            tabsAndBtns = d.querySelectorAll("#app > .tab-item, button[data-tab]");

        for (var i = tabsAndBtns.length - 1; i >= 0; i--) {
            tabsAndBtns[i].classList.toggle("sen-active", false);
        }

        d.getElementById(target).classList.toggle("sen-active", true);

        btn.classList.toggle("sen-active", true);

        setTimeout(resetScroll, 2);
    }

    function actionLink(target, e)
    {
        if (isHttpRE.test(target.href)) {
            e.preventDefault();

            _tabs.create({ "url": target.href });
        }
    }

    function resetScroll()
    {
        _app.scrollTop = 0;
    }

    setTimeout(resetScroll, 2);

    d.addEventListener("click", function (e) {
        if (e.button !== 0) return;

        var el = e.target;

        if (el.matches("button[data-tab]")) {
            changeTab(el);
        } else if (el.matches("a[href^='http']")) {
            actionLink(el, e);
        }
    });

    //setup-tab
    //httpRequest();
})(window, document);
