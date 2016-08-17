/*
 * StackExchangeNotifications 1.0.0
 * Copyright (c) 2016 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(doc, browser) {
    "use strict";

    var setupKeyEsc,
        setupResize,
        viewHTML,
        mainBody,
        photos,
        loader,
        targetImg,
        maskPhoto,
        currentPhoto,
        validImages  = /\.(png|jpeg|jpe|jpg|svg|gif)(|\?[\s\S]+)$/i,
        errorRegExp  = /(^|\s)sen\-error(\s|$)/,
        loaderRegExp = /(^|\s)sen\-bg\-loader(\s|$)/,
        showRegExp   = /(^|\s)show(\s|$)/,
        checkTarget  = /(^|\s)wmd\-preview|(inline|sen)\-editor($|\s)/
    ;

    function loadCss(uri)
    {
        var style = doc.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = browser.extension.getURL(uri);

        mainBody.appendChild(style);
    }

    function resizeImage()
    {
        if (!targetImg) {
            return;
        }

        //targetImg.className = "";

        var cw, ch,
            iw = targetImg.naturalWidth,
            ih = targetImg.naturalHeight;

        if (iw === 0 || ih === 0) {
            return;
        }

        var vw = maskPhoto.clientWidth,
            vh = maskPhoto.clientHeight;

        cw = iw < vw ? iw : vw;
        ch = ih < vh ? ih : vh;

        if (cw >= ch) {
            targetImg.style.setProperty("height", ch + "px", "important");
            targetImg.style.setProperty("width",  "auto",    "important");
        } else {
            targetImg.style.setProperty("width", cw + "px", "important");
            targetImg.style.setProperty("height", "auto",    "important");
        }
    }

    function hideView(e)
    {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        if (targetImg) {
            targetImg.onload = targetImg.onerror = null;
        }

        viewHTML.className = viewHTML.className
                                .replace(showRegExp, " ").trim();
    }

    function loadView()
    {
        var
            xhr = new XMLHttpRequest(),
            uri = browser.extension.getURL("/view/gallery.html")
        ;

        xhr.open("GET", uri, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (!mainBody) {
                        return;
                    }

                    viewHTML = doc.createElement("div");
                    viewHTML.innerHTML = xhr.responseText;
                    viewHTML = viewHTML.firstElementChild;

                    mainBody.appendChild(viewHTML);

                    currentPhoto = viewHTML.querySelector(".sen-gallery-current");
                    maskPhoto = viewHTML.querySelector(".sen-gallery-image-mask");
                    photos = viewHTML.querySelector(".sen-gallery-photos");
                    loader = viewHTML.querySelector(".sen-gallery-loader");

                    var closeBtn = viewHTML.querySelector(".sen-gallery-close");

                    if (closeBtn) {
                        closeBtn.addEventListener("click", hideView);
                    }

                    if (currentPhoto) {
                        viewHTML.addEventListener("click", function(e) {
                            if (e.target !== photos) {
                                return;
                            }

                            hideView();
                        });
                    }
                }
            }
        };

        xhr.send(null);
    }

    function removeLoader()
    {
        loader.className = loader.className
                            .replace(loaderRegExp, " ").trim();
    }

    function showPhoto(el)
    {
        if (targetImg) {
            currentPhoto.removeChild(targetImg);
        }

        loader.className += " sen-bg-loader";
        currentPhoto.className = currentPhoto.className
                                    .replace(errorRegExp, " ").trim();

        viewHTML.className += " show";

        targetImg = new Image;

        targetImg.onload = function () {
            removeLoader();

            setTimeout(resizeImage, 50);

            targetImg.onerror = targetImg.onload = null;
        };

        targetImg.onerror = function () {
            removeLoader();

            currentPhoto.className += " sen-error";

            targetImg.onload = targetImg.onerror = null;
        };

        targetImg.src = el.href;

        currentPhoto.appendChild(targetImg);

        if (!setupKeyEsc) {
            setupKeyEsc = true;

            doc.addEventListener("keydown", function (e) {
                var code = typeof e.which === "undefined" ? e.keyCode : e.which;

                if (code == 27) {
                    hideView();
                }
            });
        }

        if (!setupResize) {
            setupResize = true;

            window.addEventListener("resize", resizeImage);
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

    function addLinkEvent(current)
    {
        if (
            !current.senLightbox &&
            validImages.test(current.href) &&
            current.getElementsByTagName("img").length === 1
        ) {
            current.senLightbox = true;
            current.addEventListener("click", eventPhoto);
        }
    }

    function setGallery(target)
    {
        if (!target) {
            return;
        }

        var current, links = target.querySelectorAll("a[href]");

        for (var i = links.length - 1, current; i >= 0; i--) {
            addLinkEvent(links[i]);
        }
    }

    function findImageLinks()
    {
        var question = doc.querySelector(".question"),
            answers = doc.querySelectorAll("#answers .post-text");

        setGallery(question);

        for (var i = answers.length - 1; i >= 0; i--) {
            setGallery(answers[i]);
        }
    }

    var timerObserver;

    function triggerObserver()
    {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function (mutation) {
                if (checkTarget.test(mutation.target.className)) {
                    setGallery(mutation.target);
                }
            });
        });

        observer.observe(doc, {
            "subtree": true,
            "childList": true,
            "attributes": true
        });
    }

    function bootGallery()
    {
        mainBody = doc.body;

        if (!mainBody) {
            setTimeout(bootGallery, 2000);
            return;
        }

        loadCss("/css/gallery.css");
        loadCss("/css/animate.css");

        loadView();

        setTimeout(findImageLinks, 1);

        setTimeout(triggerObserver, 100);
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

    //Disable functions in chat
    if (window.location.hostname.indexOf("chat.") === 0) {
        return;
    }

    if (browser && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage("gallery", function(response) {
            if (response && response.available) {
                initiate();
            }
        });
    }
})(document, chrome||browser);
