(function (w, d, browser) {
    "use strict";

    var
        validValueRegEx = /^[\d.]+(px|em|pt)$/,
        hideRegEx = /(^|\s)sen-tools-hide(\s|$)/,
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
                .replace(hideRegEx, " ")
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

    function applyEvents(el)
    {
        if (el.tagName === "PRE") {
            var space, tools, button, code = el.firstElementChild;

            if (!code || code.tagName !== "CODE") {
                console.log(el.firstElementChild);
                return;
            }

            tools = d.createElement("div");
            tools.className = "sen-tools-clipboard";

            button = d.createElement("a");

            button.textContent = "Copy code";
            button.onclick = function () {
                copyFromDOM(code);
                showNotification("Copied to clipboard!");
            };

            tools.appendChild(button);
            el.parentNode.insertBefore(tools, el.nextSibling);
        }
    }

    function bootCopyCode()
    {
        if (!copyCodeEnabled) {
            return;
        }

        loadCss("extras.css");

        var pres = d.querySelectorAll("pre > code");

        for (var i = pres.length - 1; i >= 0; i--) {
            applyEvents(pres[i].parentNode);
        }

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                applyEvents(mutation.target);
            });
        });

        observer.observe(d.body, {
            "subtree": true,
            "childList": true,
            "attributes": false
        });

        notification = d.createElement("div");
        notification.className = "sen-tools-popup sen-tools-hide";

        mainBody.appendChild(notification);
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

                if (/interactive|complete/i.test(d.readyState)) {
                    init();
                } else {
                    d.addEventListener("DOMContentLoaded", init);
                    window.addEventListener("onload", init);
                }
            }
        });
    }
})(window, document, chrome||browser);
