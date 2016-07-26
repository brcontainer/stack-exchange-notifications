/*
 * StackExchangeNotifications 0.1.3
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (doc) {
    "use strict";

    var bootGallery = function() {
        var linkImgs = document.querySelectorAll("img[src*=.png], img[src*=.jpg], img[src*=.jpeg], img[src*=.gif], img[src*=.svg]");

        console.log(linkImgs);
    };

    if (/interactive|complete/i.test(doc.readyState)) {
        bootGallery();
    } else {
        doc.addEventListener("DOMContentLoaded", bootGallery);
        window.addEventListener("load", bootGallery);
    }
})(document);