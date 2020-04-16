/*
 * StackExchangeNotifications 1.2.2
 * Copyright (c) 2020 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (w, d) {
    "use strict";

    var re = /\{[<][:]=\(TEXT\)=[:][>]\}/g;

    function applyMarkdown(markdown, textarea, select, alternative)
    {
        var text,
            start = textarea.selectionStart,
            end = textarea.selectionEnd,
            value = textarea.value,
            ini = value.substring(start, end);

        console.log({ alternative })

        if (!ini) {
            ini = alternative;
            text = markdown.replace(re, ini);
        } else if (ini.trim() !== ini) {
            ini = ini.trim();
            text = markdown.replace(re, ini) + " ";
        } else {
            text = markdown.replace(re, ini);
        }

        textarea.value = value.substring(0, start) + text + value.substring(end, value.length);

        textarea.setSelectionRange(start + select, start + ini.length + select);
    }

    d.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.target.matches("textarea.js-comment-text-input")) {
            var md, alternative = "", select = 1;

            switch (typeof e.which === "undefined" ? e.keyCode : e.which) {
                case 66: //B
                    md = "**{<:=(TEXT)=:>}**";
                    select = 2;
                    alternative = "strong text";
                    break;
                case 73: //I
                    md = "*{<:=(TEXT)=:>}*";
                    alternative = "emphasized text";
                    break;
                case 75: //K
                    md = "`{<:=(TEXT)=:>}`";
                    alternative = "code text";
                    break;
                case 76: //L link
                    var link = w.prompt('Enter link like: http://foo or with title: http://foo "title"');

                    if (!link) return;

                    md = "[{<:=(TEXT)=:>}](" + link + ")";
                    alternative = "enter link description here";
                    break;
            }

            if (md) {
                e.preventDefault();
                applyMarkdown(md, e.target, select, alternative);
            }
        }
    });
})(window, document);
