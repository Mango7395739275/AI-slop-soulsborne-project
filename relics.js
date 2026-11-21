(() => {
    const chamber = document.querySelector(".relics-section");
    if (!chamber) return;

    const journal = chamber.querySelector("[data-relics-journal]");
    const progress = chamber.querySelector("[data-relics-progress]");
    const count = chamber.querySelector("[data-relics-count]");
    const kindle = chamber.querySelector("[data-relics-kindle]");
    const kindleLabel = kindle.querySelector("[data-relics-kindle-label]");
    const reward = chamber.querySelector("[data-relics-reward]");
    const scene = chamber.querySelector("[data-relics-scene]");
    const sceneState = chamber.querySelector("[data-relics-scene-state]");
    const embers = chamber.querySelector("[data-relics-embers]");
    const toast = document.querySelector("[data-relics-toast]");
    const toastTitle = toast.querySelector("[data-relics-toast-title]");
    const toastNote = toast.querySelector("[data-relics-toast-note]");
    const toastLink = toast.querySelector("[data-relics-toast-link]");
    const announcer = document.querySelector("[data-relics-announcer]");
    const storagePrefix = "soulsborne-archive-relic:";
    const discovered = new Set();
    let kindled = false;
    let lastMark;

    const marks = Array.from(document.querySelectorAll("[data-relic-mark]"), (button) => {
        const key = button.dataset.relicMark;
        const clue = chamber.querySelector(`[data-relic-clue="${key}"]`);
        return {
            key, button, clue,
            name: clue.querySelector("[data-relic-name]").textContent,
            state: clue.querySelector("[data-relic-state]"),
            hint: clue.querySelector("[data-relic-hint]"),
            note: clue.querySelector("[data-relic-note]")
        };
    });

    function restoreJournal() {
        try {
            for (const mark of marks) {
                if (window.localStorage.getItem(storagePrefix + mark.key) === "true") discovered.add(mark.key);
            }
            if (discovered.size === marks.length && window.localStorage.getItem(storagePrefix + "kindled") === "true") {
                kindled = true;
            }
        } catch {
            // Browsing modes that restrict storage still support this visit's journal.
        }
    }

    function save(key) {
        try {
            window.localStorage.setItem(storagePrefix + key, "true");
        } catch {
            // The in-memory journal remains usable when storage is unavailable.
        }
    }

    function updateJournal() {
        progress.value = discovered.size;
        count.textContent = `${discovered.size} of ${marks.length} marks found`;
        kindle.disabled = discovered.size < marks.length;
        kindleLabel.textContent = kindled ? "Tend the fire" : "Kindle the fire";
        chamber.dataset.kindled = String(kindled);
        kindle.setAttribute("aria-expanded", String(kindled));
        sceneState.textContent = kindled ? "Bonfire kindled" : "Bonfire dormant";
        reward.hidden = !kindled;

        for (const mark of marks) {
            const found = discovered.has(mark.key);
            mark.button.dataset.found = String(found);
            mark.clue.dataset.found = String(found);
            mark.state.textContent = found ? "Found" : "Clue";
            mark.hint.hidden = found;
            mark.note.hidden = !found;
            if (found) mark.button.setAttribute("aria-label", `Revisit the ${mark.name} mark`);
        }
    }

    function sparkAt(target, radius, count) {
        if (document.documentElement.dataset.motion !== "on") return;

        target.querySelector(".relic-burst")?.remove();
        const burst = document.createElement("span");
        burst.className = "relic-burst";
        burst.setAttribute("aria-hidden", "true");
        for (let index = 0; index < count; index++) {
            const spark = document.createElement("span");
            const angle = 2 * Math.PI * (index + Math.random() * .5) / count;
            const distance = radius * (.45 + Math.random() * .55);
            spark.className = "relic-spark";
            spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
            spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
            spark.style.setProperty("--spark-size", `${1.5 + Math.random() * 3}px`);
            burst.append(spark);
        }
        burst.addEventListener("animationend", (event) => {
            if (event.target === burst && event.animationName === "relic-burst-fade") burst.remove();
        });
        target.append(burst);
    }

    function inspect(mark) {
        const found = discovered.has(mark.key);
        lastMark = mark.button;
        if (!found) {
            discovered.add(mark.key);
            save(mark.key);
            updateJournal();
        }
        sparkAt(mark.button, 78, 13);
        toastTitle.textContent = found ? `${mark.name} in your journal` : `${mark.name} found`;
        toastNote.textContent = mark.note.textContent;
        const canKindle = !kindled && discovered.size === marks.length;
        toastLink.textContent = canKindle ? "Return to the bonfire" : "Open the relic journal";
        toast.hidden = false;
        announcer.textContent = canKindle
            ? `${toastTitle.textContent}. All marks found. The bonfire is ready to kindle.`
            : `${toastTitle.textContent}. ${count.textContent}.`;
    }

    for (const mark of marks) {
        mark.button.hidden = false;
        mark.button.addEventListener("click", () => inspect(mark));
    }

    kindle.addEventListener("click", () => {
        if (discovered.size < marks.length) return;
        if (!kindled) {
            kindled = true;
            save("kindled");
            updateJournal();
            announcer.textContent = "Bonfire kindled. The Places to rest field notes are available below.";
        } else {
            announcer.textContent = "The bonfire flares.";
        }
        toast.hidden = true;
        sparkAt(scene, 200, 28);
        sparkAt(kindle, 65, 12);
    });

    toast.querySelector("[data-relics-toast-close]").addEventListener("click", () => {
        toast.hidden = true;
        lastMark?.focus({ preventScroll: true });
    });
    toastLink.addEventListener("click", () => { toast.hidden = true; });

    window.addEventListener("storage", (event) => {
        if (event.key?.startsWith(storagePrefix)) {
            restoreJournal();
            updateJournal();
        }
    });

    document.addEventListener("archive:motionchange", () => {
        if (document.documentElement.dataset.motion !== "on") {
            for (const burst of document.querySelectorAll(".relic-burst")) burst.remove();
        }
    });

    for (let index = 0; index < 18; index++) {
        const ember = document.createElement("span");
        ember.className = "relic-ember";
        ember.style.setProperty("--ember-left", `${36 + Math.random() * 34}%`);
        ember.style.setProperty("--ember-rise", `${68 + Math.random() * 14}%`);
        ember.style.setProperty("--spark-size", `${1.1 + Math.random() * 2.5}px`);
        ember.style.setProperty("--ember-drift", `${(Math.random() - .44) * 180}px`);
        ember.style.setProperty("--ember-duration", `${3.1 + Math.random() * 3}s`);
        ember.style.setProperty("--ember-delay", `${-index * .37}s`);
        embers.append(ember);
    }

    if ("IntersectionObserver" in window) {
        new IntersectionObserver(([entry]) => {
            scene.dataset.visible = String(entry.isIntersecting);
        }).observe(scene);
    } else {
        scene.dataset.visible = "true";
    }

    restoreJournal();
    updateJournal();
    journal.hidden = false;
    sceneState.hidden = false;
})();
