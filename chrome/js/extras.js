/*
 * StackExchangeNotifications
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    var copyCodeEnabled = false,
        previewRegExp = /(^|\s)wmd-preview($|\s)/;

    function copyFromDOM(target)
    {
        try {
            var range = d.createRange(), selection = w.getSelection();

            range.selectNode(target);

            selection.removeAllRanges();
            selection.addRange(range);

            d.execCommand("copy");

            selection.removeAllRanges();
            selection = range = null;

            target.blur();

            return true;
        } catch (ee) {
            return false;
        }
    }

    function bootCopyCode()
    {
        if (!copyCodeEnabled) return;

        StackExchangeNotifications.utils.resourceStyle("extras");

        findPreCodes(d.body);

        var inprogress = false;

        var observer = new MutationObserver(function (mutations) {
            if (inprogress) return;

            inprogress = true;

            mutations.forEach(function (mutation) {
                if (previewRegExp.test(mutation.target.className) === false) {
                    findPreCodes(mutation.target);
                }
            });

            inprogress = false;
        });

        observer.observe(d.body, {
            "subtree": true,
            "childList": true,
            "attributes": false
        });
    }

    function applyEvents(el)
    {
        if (!el.matches(".wmd-preview pre, [contenteditable], [contenteditable] *") && !el.senCopyCode) {
            var space, tools, button, nextEl = el.nextSibling, code = el.firstElementChild;

            if (!code || code.tagName !== "CODE" || code.senCopyCode) return;

            space = d.createTextNode(" \n ");
            tools = d.createElement("div");

            tools.className = "sen-tools-clipboard";

            button = d.createElement("button");

            el.senCopyCode = true;

            button.textContent = browser.i18n.getMessage("site_clipboard_button");

            button.onclick = function (e) {
                e.preventDefault();

                var target = this.parentNode && this.parentNode.previousElementSibling ?
                                this.parentNode.previousElementSibling.querySelector("code") : null;

                if (target && copyFromDOM(target)) {
                    StackExchangeNotifications.utils.showLabelNotification(browser.i18n.getMessage("site_clipboard_copied"));
                } else {
                    StackExchangeNotifications.utils.showLabelNotification(browser.i18n.getMessage("site_clipboard_copied_error"));
                }
            };

            button.type = "button";

            tools.appendChild(button);

            el.parentNode.insertBefore(space, nextEl);
            el.parentNode.insertBefore(tools, nextEl);
        }
    }

    function findPreCodes(target)
    {
        if (!target.matches(".wmd-preview " + target.tagName) && !target.querySelector(".sen-tools-clipboard")) {
            var pres = target.querySelectorAll("pre > code");

            for (var i = pres.length - 1; i >= 0; i--) {
                applyEvents(pres[i].parentNode);
            }
        }
    }

    if (browser && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage("extras", function (response) {
            if (response) {
                copyCodeEnabled = !!response.copycode;

                StackExchangeNotifications.utils.ready(bootCopyCode);
            }
        });
    }
})(window, document);
