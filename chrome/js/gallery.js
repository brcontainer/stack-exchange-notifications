/*
 * StackExchangeNotifications 1.0.1
 * Copyright (c) 2017 Guilherme Nascimento (brcontainer@yahoo.com.br)
 * Released under the MIT license
 *
 * https://github.com/brcontainer/stack-exchange-notification
 */

(function(w, d, browser) {
    "use strict";

    var setupKeyEsc,
        setupResize,
        viewHTML,
        mainBody,
        photos,
        loader,
        loaded = false,
        magnified = false,
        magnifyPhoto = false,
        currentZoom = null,
        targetImg,
        currentPhoto,
        currentPhotoToken,
        currentUrl,
        isOpen = false,
        ignorePreviewRegEx  = /(^|\s)wmd-preview(\s|$)/,
        validImages         = /\.(png|jpeg|jpe|jpg|svg|gif)(|\?[\s\S]+)$/i,
        errorRegExp         = /(^|\s)sen-error(\s|$)/,
        loaderRegExp        = /(^|\s)sen-bg-loader(\s|$)/,
        inLoadRegxp         = /(^|\s)in-load(\s|$)/,
        magnifiedRegExp     = /(^|\s)magnified(\s|$)/,
        magnificationRegexp = /(^|\s)magnification(\s|$)/,
        showRegExp          = /(^|\s)show(\s|$)/,
        mainSelector        = "a[href]"
    ;

    function loadCss(uri)
    {
        var style = d.createElement("link");

        style.rel  = "stylesheet";
        style.type = "text/css";
        style.href = browser.extension.getURL("/css/" + uri);

        mainBody.appendChild(style);
    }

    function resizeImage()
    {
        if (!targetImg) {
            return;
        }

        var cw, ch,
            iw = targetImg.naturalWidth,
            ih = targetImg.naturalHeight;

        if (iw === 0 || ih === 0) {
            return;
        }

        var vw = photos.clientWidth,
            vh = photos.clientHeight;

        cw = iw < vw ? iw : vw;
        ch = ih < vh ? ih : vh;

        magnifyPhoto = iw > vw || ih > vh;

        if (magnifyPhoto) {
            currentPhoto.className += " magnification";
            magnified = false;
        } else {
            currentPhoto.className += " magnified";
            magnified = true;
        }

        currentPhoto.style.cssText = "";

        if (cw >= ch) {
            if (magnifyPhoto) {
                ch = ch - 20;
            }

            targetImg.style.setProperty("height", ch + "px", "important");
            targetImg.style.setProperty("width", "auto", "important");
        } else {
            if (magnifyPhoto) {
                cw = cw - 20;
            }

            targetImg.style.setProperty("width", cw + "px", "important");
            targetImg.style.setProperty("height", "auto", "important");
        }

        alignImage();
    }

    function alignImage()
    {
        currentPhoto.style.transform = "scale(1)";
        currentZoom = null;

        var vw = photos.clientWidth, vh = photos.clientHeight,
            cw = currentPhoto.clientWidth, ch = currentPhoto.clientHeight;

        currentPhoto.style.left = Math.round( (vw / 2) - (cw / 2) ) + "px";
        currentPhoto.style.top  = Math.round( (vh / 2) - (ch / 2) ) + "px";
    }

    function removeEvts()
    {
        isOpen = false;

        if (targetImg) {
            targetImg.onload = targetImg.onerror = null;
        }
    }

    function hideView(e)
    {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        removeEvts();

        viewHTML.className = viewHTML.className
                                .replace(showRegExp, " ").trim();

        currentPhoto.style.transform = "scale(1)";
        currentZoom = null;
    }

    function navigateTo(navigate)
    {
        if (!showRegExp.test(viewHTML.className)) {
            return;
        }

        var lnks = d.querySelectorAll(mainSelector);
        var el, findNext = false;

        if (lnks.length === 0) {
            return;
        }

        lnks = Array.prototype.slice.call(lnks, 0);

        if (navigate === "prev") {
            lnks = lnks.reverse();
        }

        for (var i = 0, j = lnks.length; i < j; i++) {
            var imgs = lnks[i].getElementsByTagName("img");
            if (imgs.length === 1) {
                if (findNext && imgs[0].src === lnks[i].href) {
                    el = lnks[i];
                    break;
                } else if (lnks[i].getAttribute("data-sen-gallery") === currentPhotoToken) {
                    findNext = true;
                }
            }
        }

        if (el) {
            removeEvts();
            setTimeout(showPhoto, 1, el);
        }
    }

    function dragablePhoto()
    {
        var isMove = false,
            x = 0, y = 0,
            xel = 0, yel = 0;

        currentPhoto.addEventListener("mousedown", function() {
            if (!magnified) {
                return;
            }

            isMove = true;

            x = w.event ? w.event.clientX : e.pageX;
            y = w.event ? w.event.clientY : e.pageY;

            xel = x - currentPhoto.offsetLeft;
            yel = y - currentPhoto.offsetTop;
        });

        d.addEventListener("mousemove", function(e) {
            if (isMove && magnified) {
                e.preventDefault();

                x = w.event ? w.event.clientX : e.pageX;
                y = w.event ? w.event.clientY : e.pageY;

                currentPhoto.style.left = (x - xel) + 'px';
                currentPhoto.style.top  = (y - yel) + 'px';
            }
        });

        d.addEventListener("mouseup", function() {
            isMove = false;
        });
    }

    function prepareDOM(sourcehtml)
    {
        var lastSize = {
            "width": "auto",
            "height": "auto"
        };

        viewHTML = d.createElement("div");
        viewHTML.innerHTML = sourcehtml;
        viewHTML = viewHTML.firstElementChild;

        sourcehtml = null;

        mainBody.appendChild(viewHTML);

        currentPhoto = viewHTML.querySelector(".sen-gallery-current");
        photos = viewHTML.querySelector(".sen-gallery-photos");
        loader = viewHTML.querySelector(".sen-gallery-loader");

        dragablePhoto();

        function mouseWheel(e)
        {
            if (!showRegExp.test(viewHTML.className)) {
                return;
            }

            e.preventDefault();

            if (currentZoom === null) {
                currentZoom = 1;
                currentPhoto.click();
            }

            var rolled = 0;

            if ("wheelDelta" in e) {
                rolled = e.wheelDelta;
            } else {
                rolled = -40 * e.detail;
            }

            var zoom = currentZoom + (rolled / 1200);

            if (zoom < 0.3 || zoom > 3) {
                return;
            }

            currentZoom = zoom;

            currentPhoto.style.transform = "scale(" + currentZoom + ")";
        }

        currentPhoto.addEventListener("DOMMouseScroll", mouseWheel);
        currentPhoto.addEventListener("mousewheel", mouseWheel);

        currentPhoto.addEventListener("dblclick", function() {
            currentPhoto.style.transform = "scale(1)";
            currentZoom = null;
        });

        currentPhoto.addEventListener("click", function(e) {
            if (!magnifyPhoto || magnified) {
                return;
            }

            e.preventDefault();

            magnified = true;

            currentPhoto.className += " magnified";

            lastSize.height = String(targetImg.style.height).replace(/\!important$/i, "").trim();
            lastSize.width  = String(targetImg.style.width).replace(/\!important$/i, "").trim();

            targetImg.style.setProperty("height", "auto", "important");
            targetImg.style.setProperty("width",  "auto", "important");

            alignImage();
        });

        var closeBtn = viewHTML.querySelector(".sen-gallery-close");
        var nextBtn = viewHTML.querySelector(".sen-gallery-right");
        var prevBtn = viewHTML.querySelector(".sen-gallery-left");

        if (closeBtn) {
            closeBtn.addEventListener("click", hideView);
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", function(e) {
                e.preventDefault();

                navigateTo("prev");

                return false;
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", function(e) {
                e.preventDefault();

                navigateTo("next");

                return false;
            });
        }

        viewHTML.addEventListener("mouseout", function(e) {
            closeBtn.className = closeBtn.className
                                    .replace(showRegExp, " ").trim();
        });

        viewHTML.addEventListener("mouseover", function(e) {
            if (!showRegExp.test(closeBtn.className)) {
                closeBtn.className += " show";
            }
        });

        if (currentPhoto) {
            viewHTML.addEventListener("click", function(e) {
                if (e.target !== photos) {
                    return;
                }

                hideView(e);
            });
        }

        setTimeout(setGallery, 1, mainBody);
        setTimeout(triggerObserver, 50);
    }

    function loadView()
    {
        var
            xhr = new XMLHttpRequest(),
            uri = browser.extension.getURL("/view/gallery.html");
        ;

        xhr.open("GET", uri, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (!mainBody) {
                        return;
                    }

                    prepareDOM(xhr.responseText);
                }
            }
        };

        xhr.send(null);
    }

    function removeLoader()
    {
        loader.className = loader.className
                            .replace(loaderRegExp, " ").trim();

        currentPhoto.className = currentPhoto.className
                                    .replace(inLoadRegxp, " ").trim();
    }

    function showPhoto(el)
    {
        if (currentUrl === el.href && isOpen) {
            return;
        }

        currentZoom = 1;

        currentPhotoToken = String(new Date().getTime());

        el.setAttribute("data-sen-gallery", currentPhotoToken);

        magnified = false;

        var hasError = false;

        currentPhoto.className = currentPhoto.className
                                    .replace(magnificationRegexp, " ")
                                        .replace(magnifiedRegExp, " ")
                                            .trim();

        currentUrl = el.href;

        isOpen = true;

        if (targetImg) {
            currentPhoto.removeChild(targetImg);
        }

        loader.className += " sen-bg-loader";
        currentPhoto.className = currentPhoto.className
                                    .replace(errorRegExp, " ")
                                        .replace(inLoadRegxp, " ").trim();

        if (!inLoadRegxp.test(currentPhoto.className)) {
            currentPhoto.className += " in-load";
        }

        if (!showRegExp.test(viewHTML.className)) {
            viewHTML.className += " show";
        }

        targetImg = new Image;

        targetImg.onload = function () {
            if (hasError) {
                return;
            }

            removeLoader();

            setTimeout(resizeImage, 50);

            targetImg.onerror = targetImg.onload = null;
        };

        targetImg.onerror = function () {
            hasError = true;

            removeLoader();

            if (!errorRegExp.test(currentPhoto.className)) {
                currentPhoto.className += " sen-error";
            }

            targetImg.onload = targetImg.onerror = null;
        };

        targetImg.src = el.href;

        currentPhoto.appendChild(targetImg);

        alignImage();

        if (!setupKeyEsc) {
            setupKeyEsc = true;

            d.addEventListener("keydown", function (e) {
                if (!showRegExp.test(viewHTML.className)) {
                    return;
                }

                var code = typeof e.which === "undefined" ? e.keyCode : e.which;

                switch (typeof e.which === "undefined" ? e.keyCode : e.which) {
                    case 27:
                        hideView(e);
                    break;
                    case 37:
                    case 39:
                        e.preventDefault();
                        navigateTo(code == 37 ? "prev" : "next");
                    break;
                }
            });
        }

        if (!setupResize) {
            setupResize = true;

            w.addEventListener("resize", resizeImage);
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
            /*
            if (current.getElementsByTagName("img")[0].src !== current.href) {
                return;
            }
            */

            current.senLightbox = true;
            current.addEventListener("click", eventPhoto);
        }
    }

    function setGallery(target)
    {
        if (!target) {
            return;
        }

        var current, links = target.querySelectorAll(mainSelector);

        for (var i = links.length - 1, current; i >= 0; i--) {
            addLinkEvent(links[i]);
        }
    }

    var timerObserver;

    function triggerObserver()
    {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                var c = mutation.target;

                if (ignorePreviewRegEx.test(c.className)) {
                    return;
                }

                if (c.tagName !== "A" && c.querySelector("a img")) {

                    if (timerObserver) {
                        clearTimeout(timerObserver);
                    }

                    timerObserver = setTimeout(setGallery, 50, c);

                } else if (c.tagName === "A" && c.getElementsByTagName("img").length === 1) {

                    if (timerObserver) {
                        clearTimeout(timerObserver);
                    }

                    timerObserver = setTimeout(addLinkEvent, 50, c);

                }
            });
        });

        observer.observe(mainBody, {
            "subtree": true,
            "childList": true,
            "attributes": false
        });
    }

    function bootGallery()
    {
        if (loaded) {
            return;
        }

        loaded = false;

        mainBody = d.body;

        if (!mainBody) {
            setTimeout(bootGallery, 2000);
            return;
        }

        loadCss("gallery.css");
        loadCss("animate.css");

        loadView();
    }

    function initiate()
    {
        if (/^(interactive|complete)$/i.test(d.readyState)) {
            bootGallery();
        } else {
            d.addEventListener("DOMContentLoaded", bootGallery);
            w.addEventListener("load", bootGallery);
        }
    }

    if (browser && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage("gallery", function(response) {
            if (response && response.available) {
                initiate();
            }
        });
    }
})(window, document, chrome||browser);
