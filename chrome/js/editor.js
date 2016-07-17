/*
 * StackExchangeNotifications 0.1.0
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

function SEN_Editor_main(Space, Button, postEditor)
{
    if (!!postEditor.querySelector(".SEN-editor-full")) {
        return;
    }

    var
        fullRegExp     = /(^|\s)SEN\-full\-editor($|\s)/g,
        noscrollRegExp = /(^|\s)SEN\-noscroll($|\s)/g,
        hideRegExp     = /(^|\s)SEN\-hide($|\s)/g,
        readyRegExp    = /(^|\s)SEN\-readonly($|\s)/g,

        rootDoc        = document.body.parentNode,

        standardActs
                = postEditor.querySelectorAll(
                    ".wmd-button:not(.SEN-button), .wmd-spacer"),

        textField      = postEditor.querySelector("textarea"),
        postPreview    = postEditor.querySelector(".wmd-preview"),
        fl             = postEditor.querySelector(".fl"),

        inReadOnlyMode = false
    ;

    for (var i = 0, j = standardActs.length; i < j; i++) {
        var btn, el = standardActs[i];

        if (el.className.indexOf("wmd-button") !== -1) {
            btn = Button("SEN-fakeact " + el.className, "", postEditor);
            btn.innerHTML = el.innerHTML;
        } else if (el.className.indexOf("wmd-spacer") !== -1) {
            Space("SEN-fakeact", postEditor);
        }
    }

    postPreview.className += " SEN-hide";

    if (fl) {
        fl.className += " SEN-hide";
    }

    textField.parentNode.insertBefore(postPreview, textField.nextSibling);

    var pb = postEditor.querySelector(".form-submit input[type=submit]");

    if (pb) {
        var publicButton = document.createElement("button");
        publicButton.className = "SEN-master-button";
        publicButton.textContent = pb.value||pb.textContent;
        textField.parentNode.insertBefore(publicButton, textField.nextSibling);

        publicButton.onclick = function() {
            pb.click();
        };
    }

    Space(false, postEditor);

    var fullViewAction = Button("SEN-editor-full", "Expand editor in full view-port", postEditor);
    var showPreview    = Button("SEN-editor-preview", "Show post preview", postEditor);
    //var sibeBySide     = Button("SEN-editor-sidebyside", "Show preview on left editor", postEditor);

    fullViewAction.addEventListener("click", function() {
        if (fullRegExp.test(postEditor.className)) {
            postEditor.className = postEditor.className.replace(fullRegExp, " ").replace(/\s\s/g, " ").trim();
            rootDoc.className = rootDoc.className.replace(noscrollRegExp, " ").replace(/\s\s/g, " ").trim();
        } else {
            postEditor.className += " SEN-full-editor";
            rootDoc.className += " SEN-noscroll";
        }
    });

    showPreview.addEventListener("click", function() {
        if (hideRegExp.test(textField.className)) {
            inReadOnlyMode = false;

            textField.className = textField.className.replace(hideRegExp, " ").replace(/\s\s/g, " ").trim();
            postPreview.className += " SEN-hide";

            postEditor.className = postEditor.className.replace(readyRegExp, " ").replace(/\s\s/g, " ").trim();
        } else {
            inReadOnlyMode = true;

            textField.className += " SEN-hide";
            postPreview.className = postPreview.className.replace(hideRegExp, " ").replace(/\s\s/g, " ").trim();

            postEditor.className += " SEN-readonly";
        }
    });
}


(function (doc) {
    var done = false;

    var initiate = function() {
        var
            sc,
            btn;

        done = true;

        var editorCss = document.createElement("link");

        editorCss.rel  = "stylesheet";
        editorCss.type = "text/css";
        editorCss.href = chrome.extension.getURL("/css/editor.css");

        document.body.appendChild(editorCss);

        var Space = function(className, target) {
            if (sc) {
                var helpButton = target.querySelector(".wmd-button-row > .wmd-help-button");
                var actions = actions = target.querySelector(".wmd-button-row");
                var tmp = sc.cloneNode();

                if (helpButton) {
                    helpButton.parentNode.insertBefore(tmp, helpButton);
                } else {
                    actions.appendChild(tmp);
                }

                if (className) {
                    tmp.className += " " + className;
                }
                return tmp;
            }

            sc = document.createElement("li");
            sc.className = "wmd-spacer SEN-spacer";

            Space(className, target);
        };

        var Button = function(className, title, target) {
            if (btn) {
                var helpButton = target.querySelector(".wmd-button-row > .wmd-help-button");
                var actions = actions = target.querySelector(".wmd-button-row");
                var tmp = btn.cloneNode(true);

                if (className) {
                    tmp.className += " " + className;
                }

                if (title) {
                    btn.setAttribute("title", title);
                }

                if (helpButton) {
                    helpButton.parentNode.insertBefore(tmp, helpButton);
                } else {
                    actions.appendChild(tmp);
                }

                return tmp;
            }

            btn = document.createElement("li");
            btn.className = "wmd-button SEN-button";
            btn.innerHTML = "<span></span>";

            return Button(className, title, target);
        };

        var addButtons = function(target) {
            setTimeout(function() {
                SEN_Editor_main(Space, Button, target);
            }, 500);

            target.querySelector("textarea.wmd-input").addEventListener("focus", function() {
                addButtons(target);
            });
        };

        addButtons(document.querySelector(".post-editor"));

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function (mutation) {
                var el = mutation.target;

                if (/(^|\s)inline\-editor($|\s)/.test(el.className)) {
                    addButtons(el.querySelector(".post-editor"));
                }
            });
        });

        observer.observe(document, {
            subtree: true,
            childList: true,
            attributes: true
        });
    };

    var load = function() {
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage("editorAvailable", function(response) {
                if (response === true) {
                    setTimeout(initiate, 200);
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
