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
        focusRegExp    = /(^|\s)sen\-editor\-focus($|\s)/g,
        visibleRegExp  = /(^|\s)sen\-editor\-visible($|\s)/g,
        fullRegExp     = /(^|\s)sen\-editor\-full($|\s)/g,
        readyRegExp    = /(^|\s)sen\-editor\-ready($|\s)/g,
        invertedRegExp = /(^|\s)sen\-editor\-inverted($|\s)/g,
        noscrollRegExp = /(^|\s)sen\-editor\-noscroll($|\s)/g,
        regexGetClass  = /^([\s\S]+?\s|)(wmd\-[\S]+?\-button)([\s\S]+|)$/
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

        if (/sen\-(preview|full|flip|italic)\-button/.test(button.className)) {
            return;
        }

        var c = button.className.replace(regexGetClass, "$2").trim();

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

    function mainActivity(newEditor, realEditor)
    {
        var realPreview = realEditor.querySelector(".wmd-preview");
        var realTextField = realEditor.querySelector(".wmd-input");

        var previewTarget = newEditor.querySelector(".sen-preview");
        var textTarget = newEditor.querySelector(".sen-textfield");

        previewTarget.appendChild(realPreview);
        textTarget.appendChild(realTextField);

        if (tabsBySpaces || italicWithUnderScore) {
            realTextField.addEventListener("change", eventsInput);
            realTextField.addEventListener("keyup",  eventsInput);
            realTextField.addEventListener("paste",  eventsInput);
            realTextField.addEventListener("input",  eventsInput);
        }

        newEditor.querySelector("a.sen-full-button").addEventListener("click", function() {
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
                }
            } else {
                newEditor.className += " sen-editor-full";
                rootDoc.className += " sen-editor-noscroll";

                if (preferPreviewInFull) {
                    newEditor.className += " sen-editor-ready";
                }
            }
        });

        newEditor.querySelector("a.sen-preview-button").addEventListener("click", function() {
            if (readyRegExp.test(newEditor.className)) {
                newEditor.className = newEditor.className
                                        .replace(readyRegExp, " ")
                                            .replace(/\s\s/g, " ").trim();
            } else {
                newEditor.className += " sen-editor-ready";
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

        var buttons = newEditor.querySelectorAll(".sen-editor-toolbar > a[class^='sen-btn ']");

        for (var i = buttons.length - 1; i >= 0; i--) {
            addEventButton(buttons[i], realEditor, realTextField);
        }

        hideRealEditor(realEditor);
    }

    function bootMain(newEditor, realEditor)
    {
        var textField = realEditor.querySelector("textarea");

        realEditor.className += " sen-editor-visible";

        triggerFocus(textField);

        textField.addEventListener("focus", function() {
            newEditor.className += " sen-editor-focus";
        });

        textField.addEventListener("blur", function() {
            newEditor.className
                = newEditor.className
                    .replace(focusRegExp, " ")
                        .replace(/\s\s/g, " ")
                            .trim();
        });

        setTimeout(mainActivity, 600, newEditor, realEditor);
    }

    function loadCss()
    {
        var style = document.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = chrome.extension.getURL("/css/editor.css");

        document.body.appendChild(style);
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
            if (xhr.readyState === 4 && xhr.status === 200) {
                viewHTML = document.createElement("div");
                viewHTML.innerHTML = xhr.responseText;
                viewHTML = viewHTML.firstElementChild;

                bootMain(viewHTML.cloneNode(true), realEditor);
            }
        };

        xhr.send(null);
    }

    function createEditor(target)
    {
        if (
            !target ||
            target.offsetParent === null ||
            target.querySelector(".wmd-button-bar li") === null ||
            target.senEditorAtived
        ) {
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

        rootDoc = document.body.parentNode;

        done = true;

        setTimeout(function() {
            var els = document.querySelectorAll(".post-editor");

            if (els.length > 0) {
                for (var i = els.length - 1; i >= 0; i--) {
                    setTimeout(createEditor, 100, els[i]);
                }
            }
        }, 100);

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function (mutation) {
                var el = mutation.target;

                if (/(^|\s)inline\-(editor|answer)($|\s)/.test(el.className)) {
                    setTimeout(createEditor, 100, el.querySelector(".post-editor"));
                } else if (/(^|\s)post\-form($|\s)/.test(el.className)) {
                    setTimeout(createEditor, 100, el.querySelector(".post-editor"));
                }
            });
        });

        observer.observe(document, {
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
