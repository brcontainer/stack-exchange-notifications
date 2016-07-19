/*
 * StackExchangeNotifications 0.1.0
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (doc) {
    var
        rootDoc,
        done = false,
        viewHTML,
        preferPreviewInFull = false,
        visibleRegExp  = /(^|\s)sen\-editor\-visible($|\s)/g,
        fullRegExp     = /(^|\s)sen\-editor\-full($|\s)/g,
        readyRegExp    = /(^|\s)sen\-editor\-ready($|\s)/g,
        noscrollRegExp = /(^|\s)sen\-editor\-noscroll($|\s)/g
    ;

    var addEventButton = function(button, realEditor, realTextField) {
        var timerHideButtons,
            innerBtn,
            btn = realEditor.querySelector("li[id=" + button.className + "] > *");

        if (!btn) {
            return;
        }

        innerBtn = realEditor.querySelector("li[id=" + button.className + "]");

        button.addEventListener("click", function() {
            if (timerHideButtons) {
                clearTimeout(timerHideButtons);
            }

            realEditor.className += " sen-editor-visible";

            var event = new Event("click", {
                "view": window,
                "bubbles": true,
                "cancelable": true
            });

            if (innerBtn) {
                innerBtn.dispatchEvent(event);
            } else {
                btn.dispatchEvent(event);
            }

            event = new Event("paste", {
                "view": window,
                "bubbles": true,
                "cancelable": true
            });

            realTextField.dispatchEvent(event);

            event = null;

            timerHideButtons = seTimeout(function() {
                realEditor.className
                    = realEditor.className
                        .replace(visibleRegExp, " ")
                            .replace(/\s\s/g, " ")
                                .trim();
            }, 200);
        });
    };

    var main = function(newEditor, realEditor) {
        var realPreview = realEditor.querySelector(".wmd-preview");
        var realTextField = realEditor.querySelector(".wmd-input");

        var previewTarget = newEditor.querySelector(".sen-preview");
        var textTarget = newEditor.querySelector(".sen-textfield");

        previewTarget.appendChild(realPreview);
        textTarget.appendChild(realTextField);

        newEditor.querySelector("a.sen-full-button").addEventListener("click", function() {
            if (fullRegExp.test(newEditor.className)) {
                newEditor.className = newEditor.className.replace(fullRegExp, " ").replace(/\s\s/g, " ").trim();
                rootDoc.className = rootDoc.className.replace(noscrollRegExp, " ").replace(/\s\s/g, " ").trim();
            } else {
                newEditor.className += " sen-editor-full";
                rootDoc.className += " sen-editor-noscroll";
            }
        });

        newEditor.querySelector("a.sen-preview-button").addEventListener("click", function() {
            if (readyRegExp.test(newEditor.className)) {
                newEditor.className = newEditor.className.replace(readyRegExp, " ").replace(/\s\s/g, " ").trim();
            } else {
                newEditor.className += " sen-editor-ready";
            }
        });

        var buttons = newEditor.querySelectorAll(".sen-editor-toolbar > a[class^=wmd]");

        for (var i = buttons.length - 1; i >= 0; i--) {
            addEventButton(buttons[i], realEditor, realTextField);
        }

        //realEditor.appendChild(newEditor);
        realEditor.parentNode.insertBefore(newEditor, realEditor.nextSibling);
    };

    var loadCss = function() {
        var l = document.createElement("link");

        l.rel  = "stylesheet";
        l.type = "text/css";
        l.href = chrome.extension.getURL("/css/editor.css");

        document.body.appendChild(l);
    };

    var loadView = function(callback) {
        if (viewHTML) {
            callback(viewHTML.cloneNode(true));
            return;
        }

        var
            xhr = new XMLHttpRequest(),
            uri = chrome.extension.getURL("/view/editor.html")
        ;

        xhr.open("GET", uri, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var data = xhr.responseText;

                viewHTML = document.createElement("div");
                viewHTML.innerHTML = data;
                viewHTML = viewHTML.firstElementChild;

                callback(viewHTML.cloneNode(true));
            }
        };

        xhr.send(null);
    };

    var editor = function(target) {
        if (!target || target.senEditorAtived) {
            return;
        }

        target.senEditorAtived = true;

        loadView(function(newEditor) {
            main(newEditor, target);
        });
    };

    var initiate = function() {
        if (done) {
            return;
        }

        rootDoc = document.body.parentNode;

        done = true;

        loadCss();

        setTimeout(function() {
            editor(document.querySelector(".post-editor"));
        }, 100);

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function (mutation) {
                var el = mutation.target;

                if (/(^|\s)inline\-editor($|\s)/.test(el.className)) {
                    editor(el.querySelector(".post-editor"));
                }
            });
        });

        observer.observe(document, {
            "subtree": true,
            "childList": true,
            "attributes": true
        });
    };

    var load = function() {
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage("editor", function(response) {
                if (response) {
                    preferPreviewInFull = !!response.preview;

                    if (response.available === true) {
                        setTimeout(initiate, 200);
                    }
                }
            });
        }
    };

    if (/interactive|complete/i.test(doc.readyState)) {
        load();
    } else {
        doc.addEventListener("DOMContentLoaded", load);
        window.addEventListener("load", load);
    }
})(document);
