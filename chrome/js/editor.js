/*
 * StackExchangeNotifications 0.0.12
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

function SEN_Editor_main(Space, Button)
{
    var
        fullRegExp     = /(^|\s)SEN\-full\-editor($|\s)/g,
        noscrollRegExp = /(^|\s)SEN\-noscroll($|\s)/g,
        hideRegExp     = /(^|\s)SEN\-hide($|\s)/g,

        rootDoc        = document.body.parentNode;

        postEditor     = document.getElementById("post-editor")

        textField      = postEditor.querySelector("textarea"),
        postPreview    = document.getElementById("wmd-preview"),
        grippie        = postEditor.querySelector(".grippie"),
        communityOpt   = postEditor.querySelector(".community-option")
    ;

    postPreview.className += " SEN-hide";

    Space();

    var fullViewAction = Button("sen-editor-full", "Expand editor in full view-port");
    var showPreview    = Button("sen-editor-preview", "Show post preview");
    var sibeBySide     = Button("sen-editor-sidebyside", "Show preview on left editor");

    fullViewAction.addEventListener("click", function() {
        if (fullRegExp.test(postEditor.className)) {
            postEditor.className = postEditor.className.replace(fullRegExp, "").trim();
            rootDoc.className    = rootDoc.className.replace(noscrollRegExp, "").trim();
        } else {
            postEditor.className += " SEN-full-editor";
            rootDoc.className += " SEN-noscroll";
        }
    });

    showPreview.addEventListener("click", function() {
        if (hideRegExp.test(textField.className)) {
            communityOpt.className = communityOpt.className.replace(hideRegExp, "").trim();
            textField.className = textField.className.replace(hideRegExp, "").trim();
            grippie.className = grippie.className.replace(hideRegExp, "").trim();
            postPreview.className += " SEN-hide";
        } else {
            grippie.className += " SEN-hide";
            textField.className += " SEN-hide";
            communityOpt.className += " SEN-hide";
            postPreview.className = textField.className.replace(hideRegExp, "").trim();
        }
    });
}


(function (doc) {
    var done = false;

    var initiate = function() {
        var sc,
            btn,
            actions = doc.getElementById("wmd-button-row"),
            helpButton = doc.querySelector(".wmd-button-row > .wmd-help-button");

        if (!actions) {
            setTimeout(initiate, 200);
            return;
        }

        done = true;

        var editorCss = doc.createElement("link");

        editorCss.rel  = "stylesheet";
        editorCss.type = "text/css";
        editorCss.href = chrome.extension.getURL("/css/editor.css");

        doc.body.appendChild(editorCss);

        var Space = function() {
            if (sc) {
                helpButton.parentNode.insertBefore(sc.cloneNode(), helpButton);
                return;
            }

            sc = doc.createElement("li");
            sc.className = "wmd-spacer";

            Space();
        };

        var Button = function(className, title) {
            if (btn) {
                var tmp = btn.cloneNode(true);

                tmp.className += " " + className;

                actions.appendChild(tmp);

                return tmp;
            }

            btn = doc.createElement("li");
            btn.className = "wmd-button";
            btn.innerHTML = "<span></span>";

            btn.setAttribute("title", title);

            return Button(title);
        };

        SEN_Editor_main(Space, Button);
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

    doc.addEventListener("DOMContentLoaded", load);
    window.addEventListener("load", load);
})(document);
