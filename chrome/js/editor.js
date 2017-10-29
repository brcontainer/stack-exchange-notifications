/*
 * StackExchangeNotifications 1.0.5
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(w, d, browser) {
    "use strict";

    var
        theme,
        rootDoc,
        done = false,
        syncScroll = false,
        lastcheck,
        viewHTML,
        italicWithUnderScore = false,
        inverted = false,
        tabsBySpaces = false,
        preferPreviewInFull = false,
        focusRegExp    = /(^|\s)sen-editor-focus(\s|$)/,
        visibleRegExp  = /(^|\s)sen-editor-visible(\s|$)/,
        fullRegExp     = /(^sen|\ssen)-editor-(full$|full\s)/,
        readyRegExp    = /(^|\s)sen-editor-ready(\s|$)/,
        invertedRegExp = /(^|\s)sen-editor-inverted(\s|$)/,
        noscrollRegExp = /(^|\s)sen-editor-noscroll(\s|$)/,
        getClassRegExp = /^([\s\S]+?\s|)(wmd-[\S]+?-button)([\s\S]+|)$/,
        skipBtnRegExp  = /sen-(preview|full|flip|italic|strikethrough|syncscroll)-button/,
        isPostRegExp   = /(^|\s)(inline-(editor|answer|post))(\s|$)/,
        isInput        = /(^|\s)wmd-input(\s|$)/,
        isContainer    = /(^|\s)wmd-container(\s|$)/,
        activeRegExp   = /(^|\s)sen-disabled(\s|$)/,
        isMetaDomain   = /(^|\.)meta\./,
        isMac          = /(\s|\()Mac\s/.test(navigator.platform)
    ;

    function getSelection(target)
    {
        var start = target.selectionStart, end = target.selectionEnd;
        return start === end ? false : target.value.substr(start, end);
    }

    function getSelection(target)
    {
    }

    function triggerEvent(type, target)
    {
        if (!target) {
            return;
        }

        var evt = new MouseEvent(type, {
            "view": w,
            "bubbles": true,
            "cancelable": true
        });

        target.dispatchEvent(evt);

        evt = null;
    }

    //Fix bug in Firefox when on click in a button
    function hideElement(target)
    {
        target.className
            = target.className
                .replace(visibleRegExp, " ")
                    .replace(/\s\s/g, " ")
                        .trim();
    }

    function addEventButton(button, realEditor, realTextField)
    {
        var timerHideButtons, innerBtn;

        if (skipBtnRegExp.test(button.className)) {
            return;
        }

        var c = button.className.replace(getClassRegExp, "$2").trim();

        var btn = realEditor.querySelector("[id=" + c + "]");

        if (!btn) {
            btn = realEditor.querySelector("[id^=" + c + "-]");
        }

        if (btn) {
            if (btn.getAttribute("title")) {
                button.setAttribute("data-title", btn.getAttribute("title"));
            }
        } else {
            button.className += " sen-hide";
            return;
        }

        button.addEventListener("click", function() {
            if (timerHideButtons) {
                clearTimeout(timerHideButtons);
            }

            if (!btn) {
                return;
            }

            if (!innerBtn) {
                innerBtn = btn.querySelector("*");
            }

            realEditor.className += " sen-editor-visible";

            (innerBtn ? innerBtn : btn).click();

            timerHideButtons = setTimeout(hideElement, 200, realEditor);
        });

        return !!btn;
    }

    function eventsInput(el)
    {
        var rtsTimer;

        el.addEventListener("change", function () {
            if (rtsTimer) {
                clearTimeout(rtsTimer);
            }

            rtsTimer = setTimeout(function() {
                var val = el.value;

                if (val && tabsBySpaces) {
                    val = val.replace(/\t/g, "    ");
                }

                if (el.value !== val) {
                    el.value = val;
                }

                triggerEvent("scroll", el);
            }, 100);
        });
    }

    function changeShorcutTitle(btn)
    {
        if (!isMac) {
            return;
        }

        var o = btn.getAttribute("data-title");
        var n = o.replace("Ctrl", "\u2318").replace("Alt", "\u2325");

        if (o !== n) {
            btn.setAttribute("data-title", n);
        }
    }

    var inScrollEvt;

    function onScroll(type, from, to)
    {
        var timerScroll;

        if (type === "field") {
            eventsInput(from);
        }

        from.addEventListener("scroll", function()
        {
            if (!syncScroll || (inScrollEvt && inScrollEvt !== type)) {
                return;
            }

            if (type !== "field" && to === d.activeElement) {
                return;
            }

            clearTimeout(timerScroll);

            inScrollEvt = type;

            var sf = from.scrollHeight - from.clientHeight,
                st = to.scrollHeight - to.clientHeight;

            to.scrollTop = st * (from.scrollTop / sf);

            timerScroll = setTimeout(function() {
                inScrollEvt = null;
            }, 200);
        });
    }

    var
        rgbaToRgb = /rgba\((.*)(,|,\s+)[\d.]+\)/i,
        transparentRe = /rgba\(.*(,|,\s+)[0.]+\)/i
    ;

    function getBgColor(el)
    {
        var color = null;

        if (el.style) {
            var cs = w.getComputedStyle(el, null);

            if (cs) {
                color = cs.getPropertyValue("background-color");

                if (color && (color === "transparent" || color === "" || transparentRe.test(color))) {
                    color = el.parentNode ? getBgColor(el.parentNode) : null;
                } else {
                    color = color.replace(rgbaToRgb, "rgb($1)");
                }
            }

            cs = null;
        }

        return color;
    }

    function bootMain(navbar, realEditor)
    {
        var
            container = isContainer.test(realEditor.className) ?
                            realEditor : realEditor.querySelector(".wmd-container");

        var
            realPreview = realEditor.querySelector(".wmd-preview");

        if (container.senEditorAtived || !realPreview) {
            return;
        }

        if (isMetaDomain.test(w.location.hostname)) {
            navbar.className += " sen-is-meta";
        }

        container.senEditorAtived = true;

        var
            realTextField = realEditor.querySelector(".wmd-input"),

            fullBtn = navbar.querySelector("a.sen-full-button"),
            previewBtn = navbar.querySelector("a.sen-preview-button"),
            flipBtn = navbar.querySelector("a.sen-flip-button"),
            syncScrollBtn = navbar.querySelector("a.sen-syncscroll-button")
        ;

        triggerEvent("click", realTextField);
        triggerEvent("focus", realTextField);

        container.insertBefore(navbar, container.firstElementChild);
        container.appendChild(realPreview);

        setTimeout(function() {
            var buttons = navbar.querySelectorAll("a[class^='sen-btn ']");

            for (var i = buttons.length - 1; i >= 0; i--) {
                addEventButton(buttons[i], realEditor, realTextField);
                changeShorcutTitle(buttons[i]);
            }

            onScroll("preview", realPreview, realTextField);
            onScroll("field", realTextField, realPreview);

            realTextField.addEventListener("focus", function() {
                realEditor.className += " sen-editor-focus";
            });

            realTextField.addEventListener("blur", function() {
                realEditor.className
                    = realEditor.className
                        .replace(focusRegExp, " ")
                            .replace(/\s\s/g, " ")
                                .trim();
            });

            var bgColor = getBgColor(container);
            container.style.backgroundColor = bgColor ? bgColor : "#fff";
        }, 600);

        realPreview.addEventListener("click", function() {
            if (!fullRegExp.test(realEditor.className)) {
                realTextField.focus();
            }
        });

        if (lastcheck) {
            var d = new Date(lastcheck);

            if ((d.getDate() == 31 && d.getMonth() == 9) || (d.getDate() == 31 && d.getDay() == 5)) {
                realPreview.className += " horror";
            }
        }

        fullBtn.addEventListener("click", function() {
            var inPreview = readyRegExp.test(realEditor.className);

            if (fullRegExp.test(realEditor.className)) {
                realEditor.className = realEditor.className
                                        .replace(fullRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();

                rootDoc.className = rootDoc.className
                                        .replace(noscrollRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();

                if (preferPreviewInFull) {
                    realEditor.className = realEditor.className
                                            .replace(readyRegExp, " ")
                                                .replace(/\s\s/g, " ").trim();

                    inPreview = false;
                }
            } else {
                realEditor.className += " sen-editor-full";
                rootDoc.className += " sen-editor-noscroll";

                if (preferPreviewInFull) {
                    realEditor.className += " sen-editor-ready";
                    inPreview = true;
                }
            }

            if (inPreview) {
                realTextField.readOnly = false;
                realTextField.focus();
            }
        });

        previewBtn.addEventListener("click", function()
        {
            var ca = "" + realEditor.className;
            var inFull = fullRegExp.test(ca);

            if (readyRegExp.test(ca)) {
                realEditor.className = realEditor.className
                                        .replace(readyRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();

                if (!inFull) {
                    realTextField.readOnly = false;
                }
            } else {
                realEditor.className += " sen-editor-ready";

                if (!inFull) {
                    realTextField.readOnly = true;
                }
            }
        });

        realTextField.onSenFull = function() {
            fullBtn.click();
        };

        realTextField.onSenPreview = function() {
            previewBtn.click();
        };

        if (inverted) {
            realEditor.className += " sen-editor-inverted";
        }

        flipBtn.addEventListener("click", function() {
            if (invertedRegExp.test(realEditor.className)) {
                realEditor.className = realEditor.className
                                        .replace(invertedRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();
            } else {
                realEditor.className += " sen-editor-inverted";
            }
        });

        if (!syncScroll) {
            syncScrollBtn.className += " sen-disabled";
        }

        syncScrollBtn.addEventListener("click", function() {
            if (activeRegExp.test(syncScrollBtn.className)) {
                syncScrollBtn.className = syncScrollBtn.className
                                            .replace(activeRegExp, " ")
                                                .replace(/\s\s/g, " ").trim();
                syncScroll = true;
            } else {
                syncScrollBtn.className += " sen-disabled";
                syncScroll = false;
            }
        });
    }

    function loadCss(url)
    {
        var style = d.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = browser.extension.getURL("/css/" + url);

        d.body.appendChild(style);
    }

    function loadView(realEditor)
    {
        if (viewHTML) {
            bootMain(viewHTML.cloneNode(true), realEditor);
            return;
        }

        var
            xhr = new XMLHttpRequest(),
            uri = browser.extension.getURL("/view/editor.html")
        ;

        xhr.open("GET", uri, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    viewHTML = d.createElement("div");
                    viewHTML.innerHTML = xhr.responseText;
                    viewHTML = viewHTML.firstElementChild;

                    bootMain(viewHTML.cloneNode(true), realEditor);
                }
            }
        };

        xhr.send(null);
    }

    function createEditor(target)
    {
        if (!target || target.senEditorAtived) {
            return;
        }

        if (target.offsetParent === null || target.querySelector(".wmd-button-bar li") === null) {
            setTimeout(createEditor, 100, target);
            return;
        }

        loadView(target);
    }

    function checkRemoveFullEditorOpts()
    {
        if (d.getElementsByClassName("sen-editor-full").length === 0) {
            rootDoc.className = rootDoc.className
                                    .replace(noscrollRegExp, " ")
                                        .replace(/\s\s/g, " ").trim();
        }
    }

    var timerObserver;

    function triggerObserver()
    {
        var observer = new MutationObserver(function(mutations) {
            var all = d.querySelectorAll(".post-editor, .wmd-container");

            for (var i = all.length - 1; i >= 0; i--) {
                setTimeout(createEditor, 1, all[i]);
            }

            if (timerObserver) {
                clearTimeout(timerObserver);
            }

            timerObserver = setTimeout(checkRemoveFullEditorOpts, 100);
        });

        observer.observe(d.body, {
            "subtree": true,
            "childList": true,
            "attributes": true
        });
    }

    function loadAll() {
        if (done) {
            return;
        }

        d.addEventListener("click", function(e) {
            if (e.target.matches(".wmd-preview a:not([class*=snippet])")) {
                e.preventDefault();
            }
        });

        rootDoc = d.body.parentNode;

        done = true;

        setTimeout(function() {
            var els = d.querySelectorAll("form.post-form, .edit-profile form");

            if (els.length > 0) {
                for (var i = els.length - 1; i >= 0; i--) {
                    setTimeout(createEditor, 1, els[i]);
                }
            }
        }, 100);

        setTimeout(triggerObserver, 300);

        d.addEventListener("keydown", function(e) {
            if (e.altKey && e.target && isInput.test(e.target.className)) {
                switch (e.keyCode) {
                    case 70: //Alt+F change to fullscreen or normal
                        if (e.target.onSenFull) {
                            e.preventDefault();
                            e.target.onSenFull();
                        }
                    break;
                    case 86: //Alt+V show/hide preview
                        if (e.target.onSenPreview) {
                            e.preventDefault();
                            e.target.onSenPreview();
                        }
                    break;
                }
            }
        });
    }

    function initiate()
    {
        loadCss("editor.css");

        if (typeof theme === "string") {
            loadCss("themes/" + theme + "/editor.css");
        }

        StackExchangeNotifications.utils.ready(loadAll);
    }

    //Disable functions in chat
    if (w.location.hostname.indexOf("chat.") === 0) {
        return;
    }

    if (browser && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage("editor", function(response) {
            if (response && response.available) {
                preferPreviewInFull = !!response.preview;
                tabsBySpaces = !!response.indent;
                inverted = !!response.inverted;
                italicWithUnderScore = !!response.italic;
                syncScroll = !!response.scroll;
                lastcheck = response.lastcheck;
                theme = response.theme;

                initiate();
            }
        });
    }
})(window, document, chrome||browser);
