/*
 * StackExchangeNotifications 0.1.4
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function (doc) {
    "use strict";

    var setupKeyEsc,
        viewHTML,
        mainBody,
        photos,
        targetImg,
        currentPhoto,
        showRegExp = /(^|\s)show(\s|$)/;

    function loadCss()
    {
        var style = document.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = chrome.extension.getURL("/css/gallery.css");

        mainBody.appendChild(style);
    }

    function resizeImage()
    {
        targetImg.className = "";

        var ih = targetImg.naturalHeight;
        var iw = targetImg.naturalWidth;

        if (iw === 0 || ih === 0) {
            return;
        }

        if (iw >= ih) {
            targetImg.className = "sen-limit-width";
        } else {
            targetImg.className = "sen-limit-height";
        }
    }

    function hideView()
    {
        viewHTML.className = viewHTML.className
                                .replace(showRegExp, " ").trim();
    }

    function loadView()
    {
        var
            xhr = new XMLHttpRequest(),
            uri = chrome.extension.getURL("/view/gallery.html")
        ;

        xhr.open("GET", uri, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200 && mainBody) {
                viewHTML = document.createElement("div");
                viewHTML.innerHTML = xhr.responseText;
                viewHTML = viewHTML.firstElementChild;

                mainBody.appendChild(viewHTML);
                currentPhoto = viewHTML.querySelector(".sen-gallery-current");
                photos = viewHTML.querySelector(".sen-gallery-photos");

                if (currentPhoto) {
                    viewHTML.addEventListener("click", function(e) {
                        if (e.target !== photos) {
                            return;
                        }

                        hideView();
                    });
                }
            }
        };

        xhr.send(null);
    }

    function showPhoto(el)
    {
        currentPhoto.style.removeProperty("width");
        currentPhoto.style.removeProperty("height");
        currentPhoto.innerHTML = "";

        viewHTML.className += " show";

        var img = new Image;

        img.onload = function () {
            setTimeout(resizeImage, 100);
        };
        img.onerror = function () {
            currentPhoto.innerHTML = "Failed!";
        };

        img.src = el.href;

        targetImg = img;

        currentPhoto.appendChild(img);

        if (!setupKeyEsc) {
            setupKeyEsc = true;

            document.addEventListener("keydown", function (e) {
                var code = typeof e.which === "undefined" ? e.keyCode : e.which;

                if (code == 27) {
                    hideView();
                }
            });
        }
    }

    function eventPhoto(e)
    {
        e.preventDefault();

        if (viewHTML && currentPhoto) {
            setTimeout(showPhoto, 1, this);
        }

        return false;
    }

    function isValid(url)
    {
        return /\.(png|jpeg|jpg|svg|gif)$/i.test(String(url).replace(/\?[\s\S]+$/, ""));
    }

    function setGallery(target)
    {
        if (!target) {
            return;
        }

        var links = target.querySelectorAll("a[href]");

        for (var i = links.length - 1, current; i >= 0; i--) {
            current = links[i];

            if (isValid(current.href) && current.getElementsByTagName("img").length === 1) {
                current.addEventListener("click", eventPhoto);
            }
        }
    }

    function bootGallery()
    {
        mainBody = document.body;

        if (!mainBody) {
            setTimeout(bootGallery, 2000);
            return;
        }

        loadCss();
        loadView();

        var question = document.querySelector(".question"),
            answers = document.querySelectorAll("#answers .post-text");

        setGallery(question);

        for (var i = answers.length - 1; i >= 0; i--) {
            setGallery(answers[i]);
        }
    }

    function initiate()
    {
        if (/^(interactive|complete)$/i.test(doc.readyState)) {
            bootGallery();
        } else {
            doc.addEventListener("DOMContentLoaded", bootGallery);
            window.addEventListener("load", bootGallery);
        }
    }

    if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage("gallery", function(response) {
            if (response) {
                if (response.available === true) {
                    initiate();
                }
            }
        });
    }
})(document);
