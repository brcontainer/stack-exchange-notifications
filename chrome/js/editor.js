/*
 * StackExchangeNotifications 0.1.4
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (doc) {
    "use strict";

    var
        rootDoc,
        done = false,
        viewHTML,
        italicWithUnderScore = false,
        inverted = false,
        tabsBySpaces = false,
        preferPreviewInFull = false,
        italicRegExp   = /(^|\s|\*\*)\*([^*]+)\*(\s|\*\*|$)/g,
        focusRegExp    = /(^|\s)sen\-editor\-focus($|\s)/,
        visibleRegExp  = /(^|\s)sen\-editor\-visible($|\s)/,
        fullRegExp     = /(^sen|\ssen)\-editor\-(full$|full\s)/,
        readyRegExp    = /(^|\s)sen\-editor\-ready($|\s)/,
        invertedRegExp = /(^|\s)sen\-editor\-inverted($|\s)/,
        noscrollRegExp = /(^|\s)sen\-editor\-noscroll($|\s)/,
        getClassRegexp = /^([\s\S]+?\s|)(wmd\-[\S]+?\-button)([\s\S]+|)$/,
        skipBtnRegexp  = /sen\-(preview|full|flip|italic|strikethrough)\-button/,
        isPostRegexp   = /(^|\s)(inline\-(editor|answer)|post\-form)($|\s)/,
        isMac          = /Mac/.test(navigator.platform)
    ;

    function triggerFocus(target)
    {
        if (!target) {
            return;
        }

        var evt = new MouseEvent("focus", {
            "view": window,
            "bubbles": true,
            "cancelable": true
        });

        target.dispatchEvent(evt);

        var evt = new MouseEvent("click", {
            "view": window,
            "bubbles": true,
            "cancelable": true
        });

        target.dispatchEvent(evt);

        evt = null;
    }

    //Fix bug in Firefox when on click in a button
    function hideRealEditor(target)
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

        if (skipBtnRegexp.test(button.className)) {
            return;
        }

        var c = button.className.replace(getClassRegexp, "$2").trim();

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

            var event = new MouseEvent("click", {
                "view": window,
                "bubbles": true,
                "cancelable": true
            });

            if (innerBtn) {
                innerBtn.dispatchEvent(event);
            } else {
                btn.dispatchEvent(event);
            }

            event = null;

            timerHideButtons = setTimeout(hideRealEditor, 200, realEditor);
        });

        return !!btn;
    }

    var rtsTimer;

    function eventsInput()
    {
        var el = this;

        if (rtsTimer) {
            clearTimeout(rtsTimer);
        }

        rtsTimer = setTimeout(function(obj) {
            var val = el.value;
            /*var ss = val.selectionStart,
                se = val.selectionEnd;*/

            if (val && tabsBySpaces) {
                val = val.replace(/\t/g, "    ");
            }

            /*if (val && italicWithUnderScore) {
                val = val.replace(italicRegExp, "$1_$2_$3");
            }*/

            if (el.value !== val) {
                el.value = val;
            }

            el = null;

            /*
            if (ss !== se) {
                console.log(ss, se);
                val.selectionStart = ss;
                val.selectionEnd = se;
                val.focus();
            }*/
        }, 100);
    }

    function changeShorcutTitle(btn)
    {
        if (!isMac) {
            return;
        }

        var o = btn.getAttribute("data-title");
        var n = o.replace("Ctrl", "\u2318").replace("Alt", "\u2325");

        if (o !== n) { btn.setAttribute("data-title", n); }
    }

    function bootMain(newEditor, realEditor)
    {
        var
            realPreview = realEditor.querySelector(".wmd-preview"),
            realTextField = realEditor.querySelector(".wmd-input"),

            previewTarget = newEditor.querySelector(".sen-preview"),
            textTarget = newEditor.querySelector(".sen-textfield"),

            textField = realEditor.querySelector("textarea"),

            fullBtn = newEditor.querySelector("a.sen-full-button"),
            previewBtn = newEditor.querySelector("a.sen-preview-button")
        ;

        realEditor.className += " sen-editor-visible";

        triggerFocus(textField);

        textField.addEventListener("focus", function() {
            newEditor.className += " sen-editor-focus";
        });

        var d = new Date;

        if (d.getDate() == 31 && d.getMonth() == 9) {
            previewTarget.className += " halloween";
        }

        textField.addEventListener("blur", function() {
            newEditor.className
                = newEditor.className
                    .replace(focusRegExp, " ")
                        .replace(/\s\s/g, " ")
                            .trim();
        });

        doc.addEventListener("keydown", function(e) {
            if (e.altKey && e.target === textField) {
                switch (e.keyCode) {
                    case 70: //Alt+F change to fullscreen or normal
                        e.preventDefault();
                        fullBtn.click();
                    break;
                    case 86: //Alt+V show/hide preview
                        e.preventDefault();
                        previewBtn.click();
                    break;
                }
            }
        });

        previewTarget.addEventListener("click", function() {
            realTextField.focus();
        });

        previewTarget.appendChild(realPreview);
        textTarget.appendChild(realTextField);

        if (tabsBySpaces || italicWithUnderScore) {
            realTextField.addEventListener("change", eventsInput);
            realTextField.addEventListener("keyup",  eventsInput);
            realTextField.addEventListener("paste",  eventsInput);
            realTextField.addEventListener("input",  eventsInput);
        }

        fullBtn.addEventListener("click", function()
        {
            var inPreview = readyRegExp.test(newEditor.className);

            if (fullRegExp.test(newEditor.className)) {
                newEditor.className = newEditor.className
                                        .replace(fullRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();

                rootDoc.className = rootDoc.className
                                        .replace(noscrollRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();

                if (preferPreviewInFull) {
                    newEditor.className = newEditor.className
                                            .replace(readyRegExp, " ")
                                                .replace(/\s\s/g, " ").trim();

                    inPreview = false;
                }
            } else {
                newEditor.className += " sen-editor-full";
                rootDoc.className += " sen-editor-noscroll";

                if (preferPreviewInFull) {
                    newEditor.className += " sen-editor-ready";
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
            var ca = "" + newEditor.className;
            var inFull = fullRegExp.test(ca);

            if (readyRegExp.test(ca)) {

                newEditor.className = newEditor.className
                                        .replace(readyRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();

                if (!inFull) {
                    realTextField.readOnly = false;
                }
            } else {

                newEditor.className += " sen-editor-ready";

                if (!inFull) {
                    realTextField.readOnly = true;
                }
            }
        });

        if (inverted) {
            newEditor.className += " sen-editor-inverted";
        }

        newEditor.querySelector("a.sen-flip-button").addEventListener("click", function() {
            if (invertedRegExp.test(newEditor.className)) {
                newEditor.className = newEditor.className
                                        .replace(invertedRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();
            } else {
                newEditor.className += " sen-editor-inverted";
            }
        });

        //realEditor.className += "";

        realEditor.parentNode.insertBefore(newEditor, realEditor.nextSibling);

        setTimeout(function () {
            var buttons = newEditor.querySelectorAll(".sen-editor-toolbar > a[class^='sen-btn ']");

            for (var i = buttons.length - 1; i >= 0; i--) {
                addEventButton(buttons[i], realEditor, realTextField);
                changeShorcutTitle(buttons[i]);
            }
        }, 600);

        hideRealEditor(realEditor);
    }

    function loadCss()
    {
        var style = doc.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = chrome.extension.getURL("/css/editor.css");

        doc.body.appendChild(style);
    }

    function loadView(realEditor)
    {
        if (viewHTML) {
            bootMain(viewHTML.cloneNode(true), realEditor);
            return;
        }

        var
            xhr = new XMLHttpRequest(),
            uri = chrome.extension.getURL("/view/editor.html")
        ;

        xhr.open("GET", uri, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    viewHTML = doc.createElement("div");
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

        target.senEditorAtived = true;

        loadView(target);
    }

    function loadAll()
    {
        if (done) {
            return;
        }

        rootDoc = doc.body.parentNode;

        done = true;

        setTimeout(function() {
            var els = doc.querySelectorAll(".post-editor");

            if (els.length > 0) {
                for (var i = els.length - 1; i >= 0; i--) {
                    setTimeout(createEditor, 1, els[i]);
                }
            }
        }, 100);

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function (mutation) {
                var el = mutation.target;

                if (isPostRegexp.test(el.className)) {
                    setTimeout(createEditor, 1, el.querySelector(".post-editor"));
                }
            });
        });

        observer.observe(doc, {
            "subtree": true,
            "childList": true,
            "attributes": true
        });
    }

    function initiate()
    {
        loadCss();

        if (/^(interactive|complete)$/i.test(doc.readyState)) {
            loadAll();
        } else {
            doc.addEventListener("DOMContentLoaded", loadAll);
            window.addEventListener("load", loadAll);
        }
    }

    if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage("editor", function(response) {
            if (response) {
                preferPreviewInFull = !!response.preview;
                tabsBySpaces = !!response.spaceindentation;
                inverted = !!response.inverted;
                italicWithUnderScore = !!response.italic;

                if (response.available === true) {
                    initiate();
                }
            }
        });
    }
})(document);
