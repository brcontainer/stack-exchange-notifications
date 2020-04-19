/*
 * StackExchangeNotifications 1.2.4
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    if (!w.StackExchangeNotifications) {
        w.StackExchangeNotifications = { "utils": {} };
    }

    var body, ddialog, dmodal, dcontent, dalert, dconfirm,
        alertCallback, confirmCallback, alertBtn, okBtn, cancelBtn;

    function isOpen()
    {
        return !ddialog.classList.contains("hide");
    }

    function openDialog(msg)
    {
        dcontent.textContent = msg;

        body.classList.add("dialog-open");

        ddialog.classList.remove("hide");
    }

    function closeDialog(e)
    {
        if (e && alertCallback) {
            setTimeout(alertCallback, 1);
        }

        body.classList.remove("dialog-open");

        dalert.classList.add("hide");
        ddialog.classList.add("hide");
        dconfirm.classList.add("hide");
    }

    function confirmDialog(type)
    {
        if (confirmCallback) {
            setTimeout(confirmCallback, 1, !!type);
        }

        closeDialog(false);
    }

    function cancelDialog()
    {
        confirmDialog(false);
    }

    var dialog = {
        "alert": function (msg, callback) {
            if (isOpen()) {
                return false;
            }

            if (typeof callback === "function") {
                alertCallback = callback;
            }

            dalert.classList.remove("hide");
            openDialog(msg);
        },
        "confirm": function (msg, callback) {
            if (isOpen()) {
                return false;
            }

            if (typeof callback === "function") {
                confirmCallback = callback;
            }

            dconfirm.classList.remove("hide");
            openDialog(msg);
        }
    }

    w.StackExchangeNotifications.utils.ready(function () {
        body = d.body;
        ddialog = d.querySelector(".dialog");
        dmodal = ddialog.querySelector(".modal");
        dalert = ddialog.querySelector(".alert");
        dconfirm = ddialog.querySelector(".confirm");
        dcontent = ddialog.querySelector(".content");

        ddialog.querySelector(".alert > button").addEventListener("click", closeDialog);
        ddialog.querySelector(".confirm > button:first-child").addEventListener("click", confirmDialog);
        ddialog.querySelector(".confirm > button:last-child").addEventListener("click", cancelDialog);

        w.StackExchangeNotifications.utils.dialog = dialog;
    });
})(window, document);
