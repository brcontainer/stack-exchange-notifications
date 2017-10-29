/*
 * StackExchangeNotifications 1.0.5
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d, browser) {
    "use strict";

    var
        validValueRegExp    = /^[\d.]+(px|em|pt)$/,
        hideRegExp          = /(^|\s)sen-tools-hide(\s|$)/g,
        ignorePreviewRegExp = /(^|\s)wmd-preview(\s|$)/g,
        mainBody,
        notification,
        hideTimer,
        copyCodeEnabled = false
    ;

    function copyFromDOM(target)
    {
        if (!target) {
            return;
        }

        var range = d.createRange();

        range.selectNode(target);

        w.getSelection().removeAllRanges();
        w.getSelection().addRange(range);

        d.execCommand("copy");

        w.getSelection().removeAllRanges();

        range = null;
    }

    function hideNotification()
    {
        notification.className += " sen-tools-hide";
    }

    function showNotification(label)
    {
        if (hideTimer) {
            clearTimeout(hideTimer);
        }

        notification.textContent = label;
        notification.className =
            notification.className
                .replace(hideRegExp, " ")
                    .replace(/\s\s/g, " ")
                        .trim();

        hideTimer = setTimeout(hideNotification, 2000);
    }

    function loadCss(uri)
    {
        var style = d.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = browser.extension.getURL("/css/" + uri);

        mainBody.appendChild(style);
    }

    function bootCopyCode()
    {
        if (!copyCodeEnabled) {
            return;
        }

        function applyEvents(el)
        {
            if (el.tagName === "PRE" && !el.senCopyCode) {
                var space, tools, button, nextEl = el.nextSibling, code = el.firstElementChild;

                if (!code || !nextEl || code.tagName !== "CODE" || code.senCopyCode) {
                    return;
                }

                space = d.createTextNode(" \n ");
                tools = d.createElement("div");
                tools.className = "sen-tools-clipboard";

                button = d.createElement("a");

                el.senCopyCode = true;
                code.senCopyCode = true;

                button.textContent = "Copy code";
                button.onclick = function () {
                    copyFromDOM(code);
                    showNotification("Copied to clipboard!");
                };
                button.href = "javascript:void(0);";

                tools.appendChild(button);
                el.parentNode.insertBefore(space, nextEl);
                el.parentNode.insertBefore(tools, nextEl);
            }
        }

        function findPreCodes(target)
        {
            var pres = target.querySelectorAll("pre > code");

            for (var i = pres.length - 1; i >= 0; i--) {
                applyEvents(pres[i].parentNode);
            }
        }

        loadCss("extras.css");

        findPreCodes(d);

        notification = d.createElement("div");
        notification.className = "sen-tools-popup sen-tools-hide";

        mainBody.appendChild(notification);

        var inprogress = false;

        var observer = new MutationObserver(function (mutations) {
            if (inprogress) {
                return;
            }

            inprogress = true;

            mutations.forEach(function (mutation) {
                if (ignorePreviewRegExp.test(mutation.target.className) === false) {
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

    function init()
    {
        mainBody = d.body;

        bootCopyCode();
    }

    if (browser && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage("extras", function(response) {
            if (response) {
                copyCodeEnabled = !!response.copycode;

                StackExchangeNotifications.utils.ready(init);
            }
        });
    }
})(window, document, chrome||browser);
