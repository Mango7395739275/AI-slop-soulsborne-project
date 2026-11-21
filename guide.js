"use strict";

(() => {
    const guide = document.querySelector("[data-guide]");
    if (!guide) return;

    const choices = guide.querySelector("[data-guide-options]");
    const tabs = Array.from(choices.querySelectorAll("[data-guide-target]"));
    const entries = tabs.map((tab) => document.getElementById(tab.dataset.guideTarget));
    if (!tabs.length || entries.some((entry) => !entry || !guide.contains(entry))) return;

    const compact = matchMedia("(max-width: 720px)");
    let selected = -1;

    function select(index) {
        if (index === selected) return;
        selected = index;

        tabs.forEach((tab, position) => {
            const active = position === index;
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
            entries[position].hidden = !active;
        });
    }

    function setOrientation() {
        choices.setAttribute("aria-orientation", compact.matches ? "horizontal" : "vertical");
    }

    choices.setAttribute("role", "tablist");
    setOrientation();
    compact.addEventListener("change", setOrientation);

    tabs.forEach((tab, index) => {
        const entry = entries[index];
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", entry.id);
        entry.setAttribute("role", "tabpanel");
        entry.setAttribute("aria-labelledby", tab.id);
        entry.tabIndex = 0;
        tab.addEventListener("click", () => select(index));
    });

    choices.addEventListener("keydown", (event) => {
        const index = tabs.indexOf(event.target);
        if (index < 0) return;

        const row = compact.matches ? 2 : 1;
        const positions = {
            ArrowLeft: index - 1,
            ArrowRight: index + 1,
            ArrowUp: index - row,
            ArrowDown: index + row,
            Home: 0,
            End: tabs.length - 1
        };
        if (!Object.hasOwn(positions, event.key)) return;

        event.preventDefault();
        const position = (positions[event.key] + tabs.length) % tabs.length;
        select(position);
        tabs[position].focus();
    });

    select(0);
    guide.classList.add("is-enhanced");
    choices.hidden = false;
})();
