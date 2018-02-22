/*
 * StackExchangeNotifications 1.1.0
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    var browser = w.chrome||w.browser;

    //Disable functions in chat
    if (w.location.hostname.indexOf("chat.") === 0) {
        return;
    }

    var theme,
        rootDoc,
        autoFullscreen = false,
        syncScroll = false,
        lastcheck,
        viewHTML,
        italicWithUnderScore = false,
        inverted = false,
        tabsBySpaces = false,
        preferPreviewInFull = false,
        focusRegExp    = /\bsen-editor-focus\b/,
        visibleRegExp  = /\bsen-editor-visible\b/,
        fullRegExp     = /\bsen-editor-full\b/,
        readyRegExp    = /\bsen-editor-ready\b/,
        invertedRegExp = /\bsen-editor-inverted\b/,
        noscrollRegExp = /\bsen-editor-noscroll\b/,
        getClassRegExp = /^([\s\S]+?\s|)(wmd-[\S]+?-button)([\s\S]+|)$/,
        skipBtnRegExp  = /sen-(preview|full|flip|italic|strikethrough|syncscroll)-button/,
        isPostRegExp   = /\b(inline-(editor|answer|post))\b/,
        isInput        = /\bwmd-input\b/,
        isContainer    = /\bwmd-container\b/,
        activeRegExp   = /\bsen-disabled\b/,
        isMetaDomain   = /(^|\.)meta\./,
        isMsgRE        = /\bmessage\b/,
        isMac          = /(\s|\()Mac\s/.test(navigator.platform);

    function getSelection(target)
    {
        var start = target.selectionStart, end = target.selectionEnd;
        return start === end ? false : target.value.substr(start, end);
    }

    function triggerEvent(type, target)
    {
        if (!target) {
            return;
        }

        var e = new MouseEvent(type, {
            "view": w,
            "bubbles": true,
            "cancelable": true
        });

        target.dispatchEvent(e);

        e = null;
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

        button.addEventListener("click", function () {
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

            rtsTimer = setTimeout(function () {
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

        from.addEventListener("scroll", function ()
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

            timerScroll = setTimeout(function () {
                inScrollEvt = null;
            }, 200);
        });
    }

    var rgbaToRgb = /rgba\((.*)(,|,\s+)[\d.]+\)/i,
        transparentRe = /rgba\(.*(,|,\s+)[0.]+\)/i;

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
        var realPreview = realEditor.querySelector(".wmd-preview"),
            container = isContainer.test(realEditor.className) ?
                            realEditor : realEditor.querySelector(".wmd-container");

        if (container.getAttribute("data-sen-editor") || !realPreview) {
            return;
        }

        if (isMetaDomain.test(w.location.hostname)) {
            navbar.className += " sen-is-meta";
        }

        container.setAttribute("data-sen-editor", "true");

        var realTextField = realEditor.querySelector(".wmd-input"),
            grippie = realEditor.querySelector(".grippie"),
            fullBtn = navbar.querySelector("a.sen-full-button"),
            saveBtn = navbar.querySelector("a.sen-save-button"),
            previewBtn = navbar.querySelector("a.sen-preview-button"),
            flipBtn = navbar.querySelector("a.sen-flip-button"),
            syncScrollBtn = navbar.querySelector("a.sen-syncscroll-button");

        triggerEvent("click", realTextField);
        triggerEvent("focus", realTextField);

        container.insertBefore(navbar, container.firstElementChild);
        container.appendChild(realPreview);

        setTimeout(function () {
            var buttons = navbar.querySelectorAll("a[class^='sen-btn ']");

            for (var i = buttons.length - 1; i >= 0; i--) {
                addEventButton(buttons[i], realEditor, realTextField);
                changeShorcutTitle(buttons[i]);
            }

            onScroll("preview", realPreview, realTextField);
            onScroll("field", realTextField, realPreview);

            realTextField.addEventListener("focus", function (e) {
                realEditor.className += " sen-editor-focus";

                if (autoFullscreen && e.target.onSenFull && !e.target.senFirstAutoFS) {
                    e.target.senFirstAutoFS = true;

                    if (fullRegExp.test(realEditor.className) === false) {
                        setTimeout(e.target.onSenFull, 1);
                    }
                }
            });

            realTextField.addEventListener("blur", function () {
                realEditor.className
                    = realEditor.className
                        .replace(focusRegExp, " ")
                            .replace(/\s\s/g, " ")
                                .trim();
            });

            var bgColor = getBgColor(container);
            container.style.backgroundColor = bgColor ? bgColor : "#fff";
        }, 600);

        realPreview.addEventListener("click", function () {
            if (!fullRegExp.test(realEditor.className)) {
                realTextField.focus();
            }
        });

        if (StackExchangeNotifications.utils.eventDay(lastcheck)) {
            realPreview.className += " sen-horror";
        }

        fullBtn.addEventListener("click", function () {
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

        previewBtn.addEventListener("click", function () {
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

        realTextField.onSenFull = function () {
            fullBtn.click();
        };

        realTextField.onSenPreview = function () {
            previewBtn.click();
        };

        if (inverted) {
            realEditor.className += " sen-editor-inverted";
        }

        grippie.addEventListener("mousedown", function () {
            realTextField.senFirstAutoFS = true;
        });

        flipBtn.addEventListener("click", function () {
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

        syncScrollBtn.addEventListener("click", function () {
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

        saveBtn.addEventListener("click", function () {
            var btn = realEditor.querySelector("input[type=submit],button[type=submit]");

            if (btn) {
                btn.click();
            }
        });
    }

    function loadView(realEditor)
    {
        if (viewHTML) {
            bootMain(viewHTML.cloneNode(true), realEditor);
            return;
        }

        StackExchangeNotifications.utils.resource("/views/editor.html", function (response) {
            viewHTML = d.createElement("div");
            viewHTML.innerHTML = response;
            viewHTML = viewHTML.firstElementChild;

            bootMain(viewHTML.cloneNode(true), realEditor);
        });
    }

    function createEditor(target)
    {
        if (!target || target.getAttribute("data-sen-editor")) {
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

    var lastAnswers = "";

    function checkNewAnswers()
    {
        var news = "", total = 0, naa = d.getElementById("new-answer-activity");

        if (naa && !StackExchangeNotifications.utils.isHide(naa)) {
            total = parseInt(naa.textContent);

            if (isNaN(total)) {
                total = 0;
            }
        }

        if (total === lastAnswers) {
            return;
        }

        total = StackExchangeNotifications.utils.convertResult(total);

        lastAnswers = total;

        if (total) {
            news = total + " new answers";
        }

        var saf = d.querySelectorAll(".sen-answers-flag");

        for (var i = saf.length - 1; i >= 0; i--) {
            saf[i].textContent = news;
        }
    }

    var lastMessage = "";

    function checkMessage(msg)
    {
        if (!msg) {
            return;
        }

        var txt = String(msg.querySelector(".message-text").textContent).trim();

        if (lastMessage === txt || StackExchangeNotifications.utils.isHide(msg)) {
            return;
        }

        lastMessage = txt;

        if (txt && d.getElementsByClassName("sen-editor-full").length) {
            StackExchangeNotifications.utils.showLabelNotification(txt, 3000, function () {
                lastMessage = "";
            });
        }
    }

    var timerObserver, timerObserver2;

    function checkMutations(mutations) {
        var mutation;

        checkNewAnswers();

        for (var i = mutations.length - 1; i >= 0; i--) {
            mutation = mutations[i];

            if (mutation.attributeName === "style" && mutation.target && isMsgRE.test(mutation.target.className)) {
                setTimeout(checkMessage, 1, mutation.target);
                break;
            }
        }
    }

    function triggerObserver()
    {
        var observer = new MutationObserver(function (mutations) {
            var mutation, all = d.querySelectorAll(".post-editor, .wmd-container");

            for (var i = all.length - 1; i >= 0; i--) {
                setTimeout(createEditor, 1, all[i]);
            }

            if (timerObserver) {
                clearTimeout(timerObserver);
            }

            if (timerObserver2) {
                clearTimeout(timerObserver2);
            }

            timerObserver = setTimeout(checkRemoveFullEditorOpts, 100);
            timerObserver2 = setTimeout(checkMutations, 300, mutations);
        });

        observer.observe(d.body, {
            "subtree": true,
            "childList": true,
            "attributes": true
        });
    }

    function loadAll() {
        d.addEventListener("click", function (e) {
            if (e.target.matches(".wmd-preview a:not([class*=snippet])")) {
                e.preventDefault();
            }
        });

        rootDoc = d.body.parentNode;

        setTimeout(function () {
            var els = d.querySelectorAll("form.post-form, .edit-profile form");

            if (els.length > 0) {
                for (var i = els.length - 1; i >= 0; i--) {
                    setTimeout(createEditor, 1, els[i]);
                }
            }
        }, 100);

        setTimeout(triggerObserver, 300);

        d.addEventListener("keydown", function (e) {
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
        StackExchangeNotifications.utils.resourceStyle("editor");

        if (typeof theme === "string") {
            StackExchangeNotifications.utils.resourceStyle("themes/" + theme + "/editor");
        }

        StackExchangeNotifications.utils.ready(loadAll);
    }

    if (browser && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage("editor", function (response) {
            if (response && response.available) {
                preferPreviewInFull = !!response.preview;
                tabsBySpaces = !!response.indent;
                inverted = !!response.inverted;
                italicWithUnderScore = !!response.italic;
                syncScroll = !!response.scroll;
                autoFullscreen = !!response.full;
                lastcheck = response.lastcheck;
                theme = response.theme;

                initiate();
            }
        });
    }
})(window, document);
