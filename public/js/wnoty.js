/**
 * wnoty.js v0.1
 * https://qcode.site
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 */
!(function($, win, doc) {
    "use strict";
    var _doc = $(doc),
        _win = $(win),
		wnoty = doc.createElement("div"),
        notify = "wnoty",
        _notify = "#",
        error = function(e) {
            throw "error: Cannot Notify => " + e;
        },
        warn = function(l) {
            (console.warn == "undefiend") ? console.log("Notify Warning: " + l) : console.warn("Notify Warning: " + l);
        },
        in_array = function(array, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i] === value) return true;
            }
            return false;
        },
        PrefixedEvent = function(element, type, callback) {
            var pfx = ["webkit", "moz", "MS", "o", ""];
            for (var p = 0; p < pfx.length; p++) {
                if (!pfx[p]) type = type.toLowerCase();
                _doc.on(pfx[p] + type, element, callback);
            }
        },
        closeNotify = function(button) {
            button.parents("." + notify + "-notification").removeClass("" + notify + "-show");
            setTimeout(function() {
                button.parents("." + notify + "-notification").addClass("" + notify + "-hide")
            }, 25);
        },
        initialize = function(set) {
            var main = doc.createElement("div"),
                wrapper = doc.createElement("div"),
                icon = doc.createElement("span"),
                text = doc.createElement("p"),
                close = doc.createElement("span");
			for(var g = 0; g < $("." + notify + "-notification").length; g++) {
                var g = g;
            }
			wnoty.className = "" + notify + "-block " + notify + "-" + set.position;
            main.className = "" + notify + "-notification " + notify + "-" + set.type + " leight-" + g;
			main.id = "leight-" + g;
            wrapper.className = notify + "-wrapper";
            if(set.type == "error") {
                icon.innerHTML = '<svg width="25" height="25" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" stroke-width="0" fill="currentColor" stroke="currentColor" class="icon" > <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"></path></svg>';
                icon.style.display = "inline-flex";
                icon.style.alignItems = "center";
                icon.style.justifyContent = "center";
                icon.style.marginRight = "12px";
            } else if(set.type == "success") {
                icon.innerHTML = '<svg width="25" height="25" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" stroke-width="0" fill="currentColor" stroke="currentColor" class="icon"> <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"></path></svg>';
                icon.style.display = "inline-flex";
                icon.style.alignItems = "center";
                icon.style.justifyContent = "center";
                icon.style.marginRight = "12px";
            } else if(set.type == "warning") {
                icon.className = notify + "-icon fa fa-exclamation-triangle";
            } else if(set.type == "info") {
                icon.className = notify + "-icon fas fa-info-circle";
            };
            close.className = "wnoty-close";
            doc.body.append(wnoty);
            wnoty.prepend(main);
            main.appendChild(wrapper);
            main.appendChild(close);
            wrapper.appendChild(icon);
            wrapper.appendChild(text);
            text.innerHTML = set.message;
			$("." + notify + "-notification").removeClass("wnoty-show");
			$("#leight-" + g).addClass("wnoty-show");
            if (set.autohide == true) {
                setTimeout(function() {
                    closeNotify($(close));
                }, set.autohideDelay)
            }
        };
    $.wnoty = function(options) {
        var positions = ["top-left", "bottom-left", "top-right", "bottom-right"],
            types = ["error", "success", "warning", "info"],
            defaults = {
                position: positions[2]
            }, settings = {
                message: "",
                type: "",
                autohide: true,
                autohideDelay: 2500,
                position: positions[2],
            };
        $.extend(settings, options);
        if(settings.type == "" && !settings.type.length) error("Type is not defined!");
        if(!in_array(types, settings.type)) error("Uhh, invalid notify type!");
        if(settings.message == "" && !settings.message.length) error("Hmmm, Message seems to be empty or not defined!");
        if(!in_array(positions, settings.position)) {
            warn("Oh, Invalid position switching to default!");
            settings.position = defaults.position;
        }
        if($("." + notify + "-notification").length >= 10) {
            $("." + notify + "-notification:last").remove();
        }
        initialize(settings);
    };
    PrefixedEvent($("." + notify + "-notification"), "AnimationEnd", function() {
        $(".wnoty-notification.wnoty-hide").remove();
    });
    _doc.on("click", ".wnoty-close", function() {
        closeNotify($(this));
    });

})(window.jQuery, window, document)