/*
 * StackExchangeNotifications 0.1.0
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

function SEN_Editor_main(Space, Button)
{
    if (!!document.querySelector(".sen-editor-full")) {
        return;
    }

    var
        fullRegExp     = /(^|\s)SEN\-full\-editor($|\s)/g,
        noscrollRegExp = /(^|\s)SEN\-noscroll($|\s)/g,
        hideRegExp     = /(^|\s)SEN\-hide($|\s)/g,
        readyRegExp    = /(^|\s)SEN\-readonly($|\s)/g,

        rootDoc        = document.body.parentNode,

        postEditor     = document.querySelector(".post-editor"),

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
            btn = Button("SEN-fakeact " + el.className);
            btn.innerHTML = el.innerHTML;
        } else if (el.className.indexOf("wmd-spacer") !== -1) {
            Space("SEN-fakeact");
        }
    }

    postPreview.className += " SEN-hide";

    if (fl) {
        fl.className += " SEN-hide";
    }

    textField.parentNode.insertBefore(postPreview, textField.nextSibling);

    Space();

    var fullViewAction = Button("sen-editor-full", "Expand editor in full view-port");
    var showPreview    = Button("sen-editor-preview", "Show post preview");
    //var sibeBySide     = Button("sen-editor-sidebyside", "Show preview on left editor");

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
            btn,
            actions = document.querySelector(".wmd-button-row"),
            helpButton = document.querySelector(".wmd-button-row > .wmd-help-button");

        if (!actions) {
            setTimeout(initiate, 200);
            return;
        }

        done = true;

        var editorCss = document.createElement("link");

        editorCss.rel  = "stylesheet";
        editorCss.type = "text/css";
        editorCss.href = chrome.extension.getURL("/css/editor.css");

        document.body.appendChild(editorCss);

        var Space = function(className) {
            if (sc) {
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

            Space(className);
        };

        var Button = function(className, title) {
            if (btn) {
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

            return Button(className, title);
        };

        setTimeout(function() {
            SEN_Editor_main(Space, Button);
        }, 800);

        document.querySelector("textarea.wmd-input").addEventListener("click", function() {
            setTimeout(function() {
                SEN_Editor_main(Space, Button);
            }, 500);
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
