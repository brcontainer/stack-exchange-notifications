/*
 * StackExchangeNotifications
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";
    
    var italicWithUnderScore = false;

    function applyMarkdown(prefix, sulfix, textarea, select, alternative)
    {
        var md,
            start = textarea.selectionStart,
            end = textarea.selectionEnd,
            value = textarea.value,
            ini = value.substring(start, end);

        if (!ini) {
            ini = alternative;
            md = sulfix + ini + sulfix;
        } else if (ini.trim() !== ini) {
            ini = ini.trim();
            md = sulfix + ini + sulfix + " ";
        } else {
            md = sulfix + ini + sulfix;
        }

        textarea.value = value.substring(0, start) + md + value.substring(end, value.length);

        textarea.setSelectionRange(start + select, start + ini.length + select);
    }

    d.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.target.matches("textarea.js-comment-text-input")) {
            var prefix, sulfix, alternative = "", select = 1;

            switch (typeof e.which === "undefined" ? e.keyCode : e.which) {
                case 66: //B
                    prefix = sulfix = "**";
                    select = 2;
                    alternative = "strong text";
                    break;
                case 73: //I
                    prefix = sulfix = italicWithUnderScore ? "_" : "*";
                    alternative = "emphasized text";
                    break;
                case 75: //K
                    prefix = sulfix = "`";
                    alternative = "code text";
                    break;
                case 76: //L link
                    var link = w.prompt('Enter link like: http://foo or with title: http://foo "title"');

                    if (!link) return;

                    prefix = "[";
                    sulfix = "](" + link + ")";
                    alternative = "enter link description here";
                    break;
            }

            if (prefix) {
                e.preventDefault();
                applyMarkdown(prefix, sulfix, e.target, select, alternative);
            }
        }
    });

    if (browser && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage("editor", function (response) {
            italicWithUnderScore = !!response.italic;
        });
    }
})(window, document);
