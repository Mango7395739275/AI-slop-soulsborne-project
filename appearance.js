"use strict";

(() => {
    const root = document.documentElement;
    const storageKey = "soulsborne-archive-appearance";
    const palettes = [
        { id: "world", label: "World colors", text: "A different palette in every world." },
        { id: "ember", label: "Ember", text: "Copper tones and firelit shadows." },
        { id: "moon", label: "Moonlight", text: "Silver blues and violet shadows." },
        { id: "noir", label: "Noir", text: "Monochrome art and silver accents." }
    ];
    const intensities = [
        { id: "low", label: "Soft" },
        { id: "normal", label: "Cinematic" },
        { id: "high", label: "Charged" }
    ];
    const defaults = { palette: "world", intensity: "normal" };
    let appearance = defaults;
    let panel;

    function readSettings(raw) {
        try {
            const saved = JSON.parse(raw);
            return {
                palette: palettes.some(({ id }) => id === saved?.palette) ? saved.palette : defaults.palette,
                intensity: intensities.some(({ id }) => id === saved?.intensity) ? saved.intensity : defaults.intensity
            };
        } catch {
            return defaults;
        }
    }

    function loadSettings() {
        try {
            return readSettings(localStorage.getItem(storageKey));
        } catch {
            return appearance;
        }
    }

    function apply(next, save = false) {
        const changed = appearance.palette !== next.palette || appearance.intensity !== next.intensity;
        appearance = next;
        root.dataset.appearance = appearance.palette;
        root.dataset.atmosphere = appearance.intensity;

        for (const radio of panel?.querySelectorAll("input[type='radio']") ?? []) {
            radio.checked = appearance[radio.name] === radio.value;
        }

        if (save) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(appearance));
            } catch {
                // Apply the choices for this visit when browser storage is unavailable.
            }
        }
        if (changed) document.dispatchEvent(new Event("archive:appearancechange"));
    }

    apply(loadSettings());
    window.addEventListener("pageshow", (event) => { if (event.persisted) apply(loadSettings()); });
    window.addEventListener("storage", (event) => {
        if (event.key === storageKey || event.key === null) apply(readSettings(event.newValue));
    });

    const opener = document.querySelector("[data-appearance-open]");
    if (!opener || typeof HTMLDialogElement === "undefined" || !HTMLDialogElement.prototype.showModal) return;

    panel = document.createElement("dialog");
    panel.id = "appearance-panel";
    panel.className = "appearance-panel";
    panel.setAttribute("aria-labelledby", "appearance-title");
    panel.innerHTML = `
        <form method="dialog">
            <div class="appearance-heading">
                <div>
                    <h2 id="appearance-title">Appearance<span class="accent">.</span></h2>
                    <p>Changes apply as you choose.</p>
                </div>
                <button class="button" type="submit" data-appearance-done>Done</button>
            </div>
            <fieldset class="appearance-field">
                <legend>Color palette</legend>
                <div class="appearance-palettes">
                    ${palettes.map(({ id, label, text }) => `
                        <label class="appearance-option">
                            <input type="radio" name="palette" value="${id}">
                            <span class="palette-card" data-palette="${id}">
                                <span class="palette-sample" aria-hidden="true"></span>
                                <strong>${label}</strong>
                                <span>${text}</span>
                            </span>
                        </label>
                    `).join("")}
                </div>
            </fieldset>
            <fieldset class="appearance-field" aria-describedby="appearance-intensity-help">
                <legend>Atmosphere</legend>
                <p id="appearance-intensity-help">Adjust the glow, particles, and parallax.</p>
                <div class="appearance-intensities">
                    ${intensities.map(({ id, label }) => `
                        <label class="appearance-option">
                            <input type="radio" name="intensity" value="${id}">
                            <span>${label}</span>
                        </label>
                    `).join("")}
                </div>
            </fieldset>
            <fieldset class="appearance-field appearance-perk" data-ember-trail-controls hidden>
                <legend>Bonfire reward</legend>
                <button class="button button--quiet" type="button" data-ember-trail-toggle aria-label="Ember trail" aria-pressed="true">
                    Ember trail <span data-ember-trail-status>on</span>
                </button>
            </fieldset>
            <div class="appearance-footer">
                <button class="button button--quiet" type="button" data-appearance-reset>Restore defaults</button>
            </div>
        </form>`;
    document.body.append(panel);
    apply(appearance);
    opener.setAttribute("aria-controls", panel.id);
    opener.hidden = false;

    opener.addEventListener("click", () => {
        panel.showModal();
        panel.querySelector("[data-appearance-done]").focus();
    });
    panel.addEventListener("change", (event) => {
        const radio = event.target;
        if (radio.matches("input[type='radio']")) apply({ ...appearance, [radio.name]: radio.value }, true);
    });
    panel.querySelector("[data-appearance-reset]").addEventListener("click", () => apply(defaults, true));
    panel.addEventListener("click", (event) => { if (event.target === panel) panel.close(); });
    panel.addEventListener("close", () => { if (!panel.open) opener.focus({ preventScroll: true }); });
})();
