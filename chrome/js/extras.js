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
        if (!target) return;

        var range = d.createRange();

        range.selectNode(target);

        w.getSelection().removeAllRanges();
        w.getSelection().addRange(range);

        d.execCommand("copy");

        w.getSelection().removeAllRanges();

        range = null;
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
        if (el.tagName === "PRE" && !el.senCopyCode && !el.matches(".wmd-preview pre")) {
            var space, tools, button, nextEl = el.nextSibling, code = el.firstElementChild;

            if (!code || code.tagName !== "CODE" || code.senCopyCode) return;

            space = d.createTextNode(" \n ");
            tools = d.createElement("div");
            tools.className = "sen-tools-clipboard";

            button = d.createElement("a");

            el.senCopyCode = true;
            code.senCopyCode = true;

            button.textContent = "Copy";
            button.onclick = function (e) {
                e.preventDefault();
                copyFromDOM(code);

                StackExchangeNotifications.utils.showLabelNotification("Copied to clipboard!");
            };
            button.href = "javascript:void(0);";

            tools.appendChild(button);

            if (!nextEl) {
                el.parentNode.appendChild(space);
                el.parentNode.appendChild(tools);
            } else {
                el.parentNode.insertBefore(space, nextEl);
                el.parentNode.insertBefore(tools, nextEl);
            }
        }
    }

    function findPreCodes(target)
    {
        if (target.matches(".wmd-preview " + target.tagName)) return;

        var pres = target.querySelectorAll(":not(.wmd-preview) pre.post-text > code");

        for (var i = pres.length - 1; i >= 0; i--) {
            applyEvents(pres[i].parentNode);
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
