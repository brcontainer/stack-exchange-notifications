/*
 * StackExchangeNotifications 1.0.7
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    var readyRegExp = /^(interactive|complete)$/;

    if (!w.StackExchangeNotifications) {
        w.StackExchangeNotifications = { "utils": {} };
    }

    w.StackExchangeNotifications.utils.ready = function (callback) {
        if (readyRegExp.test(d.readyState)) {
            callback();
        } else {
            d.addEventListener("DOMContentLoaded", callback);
            w.addEventListener("load", callback);
        }
    };
})(window, document);
