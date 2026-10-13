(function () {
    "use strict";

    var SEARCH_THRESHOLD = 8; // show a search box when there are more options than this

    var EDGE_GUARD = 28; // px from the screen edge treated as a back-swipe

    document.querySelectorAll("#start-screen select").forEach(enhance);

    function el(tag, className) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        return node;
    }

    function enhance(select) {
        var label = document.querySelector('label[for="' + select.id + '"]');
        var labelText = label ? label.textContent.trim() : select.id;

        /* Structure: .dd > .dd-box > [select, button, panel] */
        var cell = el("div", "dd");
        cell.setAttribute("data-for", select.id);
        var box = el("div", "dd-box");
        select.parentNode.insertBefore(cell, select);
        cell.appendChild(box);
        box.appendChild(select);

        select.classList.add("dd-native");
        select.tabIndex = -1;
        select.setAttribute("aria-hidden", "true");

        var trigger = el("button", "dd-trigger");
        trigger.type = "button";
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");
        var valueEl = el("span", "dd-value");
        trigger.appendChild(valueEl);

        var panel = el("div", "dd-panel");
        panel.hidden = true;

        var search = el("input", "dd-search");
        search.type = "text";
        search.placeholder = "Search " + labelText.toLowerCase() + "\u2026";
        search.setAttribute("aria-label", "Search " + labelText);
        search.setAttribute("autocomplete", "off");

        var list = el("ul", "dd-list");
        list.setAttribute("role", "listbox");
        list.setAttribute("aria-label", labelText);
        list.tabIndex = -1;

        panel.appendChild(search);
        panel.appendChild(list);
        box.appendChild(trigger);
        box.appendChild(panel);

        var items = [];
        var activeIndex = -1;
        var typeBuffer = "";
        var typeTimer = null;

        /* ----- build / sync ----- */
        function build() {
            list.textContent = "";
            items = [];
            Array.prototype.forEach.call(select.options, function (opt, i) {
                var li = el("li", "dd-option");
                li.setAttribute("role", "option");
                li.id = select.id + "-opt-" + i;
                li.textContent = opt.textContent;
                li.setAttribute("data-index", i);
                list.appendChild(li);
                items.push(li);
            });
            search.hidden = select.options.length <= SEARCH_THRESHOLD;
            sync();
        }

        function sync() {
            var selected = select.options[select.selectedIndex];
            valueEl.textContent = selected ? selected.textContent : "";
            trigger.setAttribute("aria-label", labelText + ": " + valueEl.textContent);
            trigger.disabled = select.disabled;
            items.forEach(function (li, i) {
                var on = i === select.selectedIndex;
                li.classList.toggle("is-selected", on);
                li.setAttribute("aria-selected", on ? "true" : "false");
            });
        }

        /* ----- open / close ----- */
        function isOpen() {
            return !panel.hidden;
        }

        function open() {
            if (isOpen() || select.disabled) return;
            search.value = "";
            filter("");
            panel.hidden = false;
            trigger.setAttribute("aria-expanded", "true");

            var rect = trigger.getBoundingClientRect();
            var below = window.innerHeight - rect.bottom;
            var goUp = below < 280 && rect.top > below;
            box.classList.toggle("dd-up", goUp);
            var room = (goUp ? rect.top : below) - 20;
            panel.style.maxHeight = Math.max(180, Math.min(320, room)) + "px";

            var useSearch = !search.hidden && !window.matchMedia("(pointer: coarse)").matches;

            setActive(select.selectedIndex >= 0 ? select.selectedIndex : firstVisible());
            (useSearch ? search : list).focus({ preventScroll: true });
        }

        function close(returnFocus) {
            if (!isOpen()) return;
            panel.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
            if (returnFocus) trigger.focus();
        }

        /* ----- active option ----- */
        function visibleIndexes() {
            var out = [];
            items.forEach(function (li, i) {
                if (!li.hidden) out.push(i);
            });
            return out;
        }

        function firstVisible() {
            var v = visibleIndexes();
            return v.length ? v[0] : -1;
        }

        function setActive(i) {
            if (activeIndex > -1 && items[activeIndex]) {
                items[activeIndex].classList.remove("is-active");
            }
            activeIndex = i;
            var target = document.activeElement === search ? search : list;
            if (i > -1 && items[i]) {
                items[i].classList.add("is-active");
                items[i].scrollIntoView({ block: "nearest" });
                target.setAttribute("aria-activedescendant", items[i].id);
            } else {
                target.removeAttribute("aria-activedescendant");
            }
        }

        function move(step) {
            var v = visibleIndexes();
            if (!v.length) return;
            var pos = v.indexOf(activeIndex);
            if (pos === -1) pos = step > 0 ? -1 : v.length;
            pos = Math.min(v.length - 1, Math.max(0, pos + step));
            setActive(v[pos]);
        }

        function choose(i) {
            if (i < 0 || i >= select.options.length) return;
            var changed = select.selectedIndex !== i;
            select.selectedIndex = i;
            sync();
            close(true);
            if (changed) {
                select.dispatchEvent(new Event("input", { bubbles: true }));
                select.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }

        /* ----- search ----- */
        function filter(query) {
            var q = query.trim().toLowerCase();
            var shown = 0;
            items.forEach(function (li) {
                var match = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
                li.hidden = !match;
                if (match) shown++;
            });
            var empty = list.querySelector(".dd-empty");
            if (!shown && !empty) {
                empty = el("li", "dd-empty");
                empty.textContent = "No matches";
                list.appendChild(empty);
            } else if (shown && empty) {
                empty.remove();
            }
            if (q) setActive(firstVisible());
        }

        /* ----- events ----- */
        trigger.addEventListener("click", function () {
            isOpen() ? close(true) : open();
        });

        trigger.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
            }
        });

        search.addEventListener("input", function () {
            filter(search.value);
        });

        panel.addEventListener("keydown", function (e) {
            switch (e.key) {
                case "ArrowDown": e.preventDefault(); move(1); break;
                case "ArrowUp": e.preventDefault(); move(-1); break;
                case "Home":
                    if (search.hidden) { e.preventDefault(); setActive(firstVisible()); }
                    break;
                case "End":
                    if (search.hidden) {
                        e.preventDefault();
                        var v = visibleIndexes();
                        setActive(v[v.length - 1]);
                    }
                    break;
                case "Enter":
                case " ":
                    if (e.key === " " && !search.hidden) break; // allow spaces in search
                    e.preventDefault();
                    choose(activeIndex);
                    break;
                case "Escape":
                    e.preventDefault();
                    close(true);
                    break;
                case "Tab":
                    close(false);
                    break;
                default:
                    // type-ahead for short lists with no search box
                    if (search.hidden && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                        typeBuffer += e.key.toLowerCase();
                        clearTimeout(typeTimer);
                        typeTimer = setTimeout(function () { typeBuffer = ""; }, 600);
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].textContent.toLowerCase().indexOf(typeBuffer) === 0) {
                                setActive(i);
                                break;
                            }
                        }
                    }
            }
        });

        list.addEventListener("click", function (e) {
            var li = e.target.closest(".dd-option");
            if (li) choose(Number(li.getAttribute("data-index")));
        });

        list.addEventListener("mousemove", function (e) {
            var li = e.target.closest(".dd-option");
            if (li) {
                var i = Number(li.getAttribute("data-index"));
                if (i !== activeIndex) setActive(i);
            }
        });

        document.addEventListener("pointerdown", function (e) {
            if (e.clientX < EDGE_GUARD || e.clientX > window.innerWidth - EDGE_GUARD) return;
            if (!box.contains(e.target)) close(false);
        });

        if (label) {
            label.addEventListener("click", function (e) {
                e.preventDefault();
                trigger.focus();
            });
        }

        /* Keep in sync when script.js changes the select */
        select.addEventListener("change", sync);
        new MutationObserver(build).observe(select, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["selected", "disabled"]
        });
        var startScreen = document.getElementById("start-screen");
        if (startScreen) {
            new MutationObserver(sync).observe(startScreen, {
                attributes: true,
                attributeFilter: ["class"]
            });
        }

        build();
    }
})();