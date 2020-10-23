/*
 * Prevent Duplicate Tabs
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/prevent-duplicate-tabs
 */

(function (w, d, u) {
    "use strict";

    if (typeof browser === "undefined") {
        w.browser = chrome;
    } else if (!w.browser) {
        w.browser = browser;
    }

    var dialog = d.getElementById("dialog"),
        dialogContent = d.getElementById("dialog_content"),
        dialogConfirm = dialog.querySelector(".confirm"),
        dialogAlert = dialog.querySelector(".alert"),
        lastCallback;

    w.openDialog = function (description, confirm, callback) {
        dialogContent.textContent = description;

        lastCallback = callback;

        dialogAlert.classList.toggle("hide", confirm);
        dialogConfirm.classList.toggle("hide", !confirm);
        dialog.classList.toggle("hide", false);
    };

    d.getElementById("dialog_ok").onclick = okOrConfirm;
    d.getElementById("dialog_confirm").onclick = okOrConfirm;

    d.getElementById("dialog_cancel").onclick = function () {
        dialog.classList.toggle("hide", true);

        lastCallback = u;
    };

    function okOrConfirm()
    {
        dialog.classList.toggle("hide", true);

        if (lastCallback) lastCallback();
    }


    // teste........
    var test = `foo bar baz baadsf asdf adsf asdf asf asdf asdf asdf foo bar baz baadsf asdf adsf asdf asf asdf asdf asdf
foo bar baz baadsf asdf adsf asdf asf asdf asdf asdf foo bar baz baadsf asdf adsf asdf asf asdf asdf asdf
foo bar baz baadsf asdf adsf asdf asf asdf asdf asdf foo bar baz baadsf asdf adsf asdf asf asdf asdf asdf
foo bar baz baadsf asdf adsf asdf asf asdf asdf asdf foo bar baz baadsf asdf adsf asdf asf asdf asdf asdf`;

    d.getElementById("clear_cache").onclick = function () {
        openDialog(test, false, function () {
            console.log("teste 1");
        });
    };

    d.getElementById("reset_data").onclick = function () {
        openDialog(test, true, function () {
            console.log("teste 2");
        });
    };
})(window, document);
