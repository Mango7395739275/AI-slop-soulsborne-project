"use strict";

const page = document.documentElement;
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const motionKey = "soulsborne-archive-motion";
let motionSetting;
let motionEnabled;

try {
    motionSetting = localStorage.getItem(motionKey);
} catch {
    // The archive also works where browser storage is unavailable.
}

function updateMotion() {
    motionEnabled = motionSetting ? motionSetting === "on" : !motionPreference.matches;
    page.dataset.motion = motionEnabled ? "on" : "off";
    for (const button of document.querySelectorAll("[data-motion-toggle]")) {
        button.setAttribute("aria-pressed", String(motionEnabled));
        button.querySelector("[data-motion-status]").textContent = page.dataset.motion;
    }
    document.dispatchEvent(new Event("archive:motionchange"));
}

for (const button of document.querySelectorAll("[data-motion-toggle]")) {
    button.hidden = false;
    button.addEventListener("click", () => {
        motionSetting = motionEnabled ? "off" : "on";
        try {
            localStorage.setItem(motionKey, motionSetting);
        } catch {
            // The choice still applies to the current page.
        }
        updateMotion();
    });
}
motionPreference.addEventListener("change", updateMotion);
updateMotion();

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const wrap = (index, length) => (index + length) % length;

function initReadingProgress() {
    const header = document.querySelector(".site-header");
    const chapterNav = document.querySelector("[data-chapter-nav]");
    const chapters = [...(chapterNav?.querySelectorAll("a") ?? [])].map((link) => ({
        link,
        section: document.getElementById(link.hash.slice(1))
    }));
    let frame = 0;
    let current;

    function update() {
        frame = 0;
        const scrollY = window.scrollY;
        const distance = page.scrollHeight - window.innerHeight;
        header.classList.toggle("is-scrolled", scrollY > 18);
        header.style.setProperty("--page-progress", distance > 0 ? clamp(scrollY / distance, 0, 1) : 0);

        if (!chapterNav) return;
        const line = header.offsetHeight + chapterNav.offsetHeight + 64;
        const next = chapters.findLast(({ section }) => section?.getBoundingClientRect().top <= line);
        if (current === next) return;
        current?.link.removeAttribute("aria-current");
        next?.link.setAttribute("aria-current", "location");
        current = next;
    }

    function queueUpdate() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    window.addEventListener("pageshow", queueUpdate);
    update();
}

function initReveals() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
        for (const { target, isIntersecting } of entries) {
            if (!isIntersecting) continue;
            target.classList.remove("will-reveal");
            target.classList.add("is-revealed");
            observer.unobserve(target);
        }
    }, { threshold: .08 });

    for (const element of document.querySelectorAll("[data-reveal]")) {
        if (element.getBoundingClientRect().top < window.innerHeight) continue;
        element.classList.add("will-reveal");
        observer.observe(element);
    }
}

function initCardTilt() {
    for (const card of document.querySelectorAll("[data-tilt]")) {
        function reset() {
            card.classList.remove("is-pointed");
            for (const name of ["--tilt-x", "--tilt-y", "--card-x", "--card-y"]) {
                card.style.removeProperty(name);
            }
        }

        card.addEventListener("pointermove", (event) => {
            if (!motionEnabled || !finePointer.matches || event.pointerType !== "mouse") return;
            const bounds = card.getBoundingClientRect();
            const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
            const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
            card.classList.add("is-pointed");
            card.style.setProperty("--tilt-x", `${(y - .5) * -5}deg`);
            card.style.setProperty("--tilt-y", `${(x - .5) * 7}deg`);
            card.style.setProperty("--card-x", `${x * 100}%`);
            card.style.setProperty("--card-y", `${y * 100}%`);
        });
        card.addEventListener("pointerleave", reset);
        document.addEventListener("archive:motionchange", reset);
    }
}

const weather = {
    elden: { colors: ["#fff0b6", "#efb365", "#fff8df"], shape: "grace", wind: .24, lift: -.57, sway: .32, density: 1 },
    blood: { colors: ["#ded8ef", "#af9ec8", "#d98483"], shape: "mist", wind: -.68, lift: .3, sway: .21, density: .85 },
    dark: { colors: ["#ffcc7a", "#ff953d", "#eb5728"], shape: "ember", wind: .32, lift: -1.58, sway: .68, density: 1 },
    sekiro: { colors: ["#e83f2b", "#ed7435", "#a8241e", "#ffc16a"], shape: "leaf", wind: .63, lift: .76, sway: 1.08, density: .48 }
};

const appearanceParticleColors = {
    ember: ["#ffdfb0", "#ffae73", "#e6683e"],
    moon: ["#dee7ff", "#b6c9ff", "#9998d6"],
    noir: ["#f0f0ed", "#c7c7c2", "#a2a2a0"]
};

const atmosphereLevels = {
    low: { density: .48, energy: .55 },
    normal: { density: 1, energy: 1 },
    high: { density: 1.4, energy: 1.35 }
};

function initAtmosphere(hero) {
    const canvas = hero.querySelector("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    const mapleLeaf = new Path2D("M0 -10 2 -5 4 -6 4 -2 10 -5 7 0 9 0 5 4 7 5 1 6 1 10 -1 10 -1 6 -7 5 -5 4 -9 0 -7 0 -10 -5 -4 -2 -4 -6 -2 -5Z");
    const leafVeins = new Path2D("M0 7V-5 M0 4 -5 -1 M0 4 5 -1");
    const pointer = { x: 0, y: 0, active: false, easedX: 0, easedY: 0 };
    let width = 0;
    let height = 0;
    let visible = true;
    let frame = 0;
    let lastTime = 0;
    let lastTrail = 0;
    let theme;
    let intensity;
    let motes = [];
    let sparks = [];
    let rings = [];

    function makeMote(scatter) {
        const depth = .35 + Math.random() * .9;
        const ember = theme.shape === "ember";
        const lifespan = 110 + Math.random() * 190;
        const age = ember && scatter ? Math.random() * lifespan : 0;
        const travel = age * depth;
        let x = Math.random() * width;
        let y = theme.lift < 0 ? height + 20 : -20;
        if (scatter) y = Math.random() * height;
        if (ember) {
            x = width * (.76 + (Math.random() - .5) * .36) + travel * theme.wind;
            y = height * (.91 + Math.random() * .06) + travel * theme.lift;
        }
        return {
            x, y, depth, age, lifespan,
            phase: Math.random() * Math.PI * 2,
            spin: (Math.random() - .5) * .063,
            color: theme.colors[Math.floor(Math.random() * theme.colors.length)]
        };
    }

    function resetMotes() {
        const count = clamp(Math.round(width * height * theme.density * intensity.density / 10500), 7, 125);
        motes = Array.from({ length: count }, () => makeMote(true));
    }

    function updateLook() {
        theme = weather[hero.dataset.world];
        const colors = appearanceParticleColors[page.dataset.appearance];
        if (colors) theme = { ...theme, colors };
        intensity = atmosphereLevels[page.dataset.atmosphere] ?? atmosphereLevels.normal;
        if (width && height) resetMotes();
    }

    function resize() {
        width = hero.clientWidth;
        height = hero.clientHeight;
        if (!width || !height) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.lineCap = "round";
        resetMotes();
    }

    function addSparks(x, y, count, speed) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (.2 + Math.random() * .8);
            sparks.push({
                x, y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - .18,
                life: .6 + Math.random() * .4,
                color: theme.colors[i % theme.colors.length]
            });
        }
        if (sparks.length > 110) sparks.splice(0, sparks.length - 110);
    }

    function pulse(x, y, radius) {
        addSparks(x, y, Math.ceil(30 * intensity.density), 4.4 * intensity.energy);
        rings.push({ x, y, radius: radius * intensity.energy, life: 1, color: theme.colors[0] });
        if (rings.length > 4) rings.shift();
    }

    function drawMote(mote, time, delta) {
        const sway = Math.sin(time * .0013 + mote.phase);
        const vx = theme.wind * mote.depth + sway * theme.sway;
        const vy = theme.lift * mote.depth + sway * .13;
        const distanceStep = delta * intensity.energy;
        mote.x += vx * distanceStep;
        mote.y += vy * distanceStep;
        mote.age += distanceStep;

        if (pointer.active) {
            const dx = mote.x - pointer.x;
            const dy = mote.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 100) {
                const eddy = (100 - distance) * .0009 * delta;
                mote.x += (dx - dy) * eddy;
                mote.y += (dy + dx) * eddy * .55;
            }
        }

        if (mote.y < -22 || mote.y > height + 22 || (theme.shape === "ember" && mote.age >= mote.lifespan)) {
            Object.assign(mote, makeMote(false));
            return;
        }
        if (mote.x < -22) mote.x += width + 44;
        if (mote.x > width + 22) mote.x -= width + 44;

        context.fillStyle = mote.color;
        switch (theme.shape) {
            case "leaf": {
                const size = mote.depth * .92;
                const flutter = .28 + Math.abs(Math.cos(mote.age * .028 + mote.phase)) * .72;
                context.save();
                context.translate(mote.x, mote.y);
                context.rotate(mote.phase + mote.age * mote.spin);
                context.scale(size * flutter, size);
                context.globalAlpha = Math.min(.87, .38 + mote.depth * .43);
                context.fill(mapleLeaf);
                context.strokeStyle = "#301412";
                context.lineWidth = .85;
                context.stroke(leafVeins);
                context.restore();
                break;
            }
            case "ember":
            case "mist": {
                const ember = theme.shape === "ember";
                const length = ember ? 4 + mote.depth * 3 : 8 + mote.depth * 11;
                const fade = ember ? Math.sin(mote.age / mote.lifespan * Math.PI) : .36;
                context.strokeStyle = mote.color;
                context.beginPath();
                context.moveTo(mote.x, mote.y);
                context.lineTo(mote.x - vx * length, mote.y - vy * length);
                context.globalAlpha = fade * .19;
                context.lineWidth = 2 + mote.depth * 2;
                context.stroke();
                context.globalAlpha = fade * (.49 + mote.depth * .28);
                context.lineWidth = .45 + mote.depth * .8;
                context.stroke();
                break;
            }
            default: {
                const size = .48 + mote.depth * 1.2;
                context.globalAlpha = (.17 + sway * .08) * mote.depth;
                context.beginPath();
                context.arc(mote.x, mote.y, size * 3.4, 0, Math.PI * 2);
                context.fill();
                context.globalAlpha = Math.min(1, (.62 + sway * .27) * mote.depth);
                context.beginPath();
                context.ellipse(mote.x, mote.y, size * 1.45, size * .66, mote.phase + sway, 0, Math.PI * 2);
                context.fill();
            }
        }
    }

    function step(time) {
        const delta = lastTime ? Math.min((time - lastTime) / 16.67, 2) : 1;
        lastTime = time;
        context.clearRect(0, 0, width, height);

        const x = pointer.active ? pointer.x / width - .5 : 0;
        const y = pointer.active ? pointer.y / height - .5 : 0;
        const ease = 1 - Math.pow(.92, delta);
        pointer.easedX += (x - pointer.easedX) * ease;
        pointer.easedY += (y - pointer.easedY) * ease;
        const shiftX = pointer.easedX * intensity.energy;
        const shiftY = pointer.easedY * intensity.energy;
        const scrollLift = clamp(window.scrollY / height, 0, 1) * Math.min(38, height * .045);

        hero.style.setProperty("--scene-x", `${(-shiftX * 20).toFixed(2)}px`);
        hero.style.setProperty("--scene-y", `${(scrollLift - shiftY * 16).toFixed(2)}px`);
        hero.style.setProperty("--orbit-x", `${(shiftX * 36).toFixed(2)}px`);
        hero.style.setProperty("--orbit-y", `${(shiftY * 28 - scrollLift * .65).toFixed(2)}px`);
        hero.style.setProperty("--light-x", `${(73 + shiftX * 12).toFixed(2)}%`);
        hero.style.setProperty("--light-y", `${(39 + shiftY * 14).toFixed(2)}%`);

        for (const mote of motes) drawMote(mote, time, delta);

        sparks = sparks.filter((spark) => spark.life > 0);
        for (const spark of sparks) {
            spark.life = Math.max(0, spark.life - .021 * delta);
            spark.x += spark.vx * delta;
            spark.y += spark.vy * delta;
            spark.vx *= .97;
            spark.vy *= .97;
            context.globalAlpha = spark.life * .8;
            context.strokeStyle = spark.color;
            context.lineWidth = 1.2;
            context.beginPath();
            context.moveTo(spark.x, spark.y);
            context.lineTo(spark.x - spark.vx * 3, spark.y - spark.vy * 3);
            context.stroke();
        }

        rings = rings.filter((ring) => ring.life > 0);
        for (const ring of rings) {
            ring.life = Math.max(0, ring.life - .018 * delta);
            const radius = (1 - Math.pow(ring.life, 2)) * ring.radius + 8;
            context.globalAlpha = ring.life * .54;
            context.strokeStyle = ring.color;
            context.lineWidth = 1;
            context.beginPath();
            context.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
            context.stroke();
        }
        context.globalAlpha = 1;
        frame = requestAnimationFrame(step);
    }

    function sync() {
        if (motionEnabled && visible && !document.hidden && width && height) {
            if (!frame) frame = requestAnimationFrame(step);
            return;
        }
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        pointer.active = false;
        if (motionEnabled) return;

        context.clearRect(0, 0, width, height);
        pointer.easedX = 0;
        pointer.easedY = 0;
        sparks = [];
        rings = [];
        for (const name of ["--scene-x", "--scene-y", "--orbit-x", "--orbit-y", "--light-x", "--light-y"]) {
            hero.style.removeProperty(name);
        }
    }

    hero.addEventListener("pointermove", (event) => {
        if (!motionEnabled || event.pointerType !== "mouse") return;
        const bounds = hero.getBoundingClientRect();
        pointer.x = event.clientX - bounds.left;
        pointer.y = event.clientY - bounds.top;
        pointer.active = true;
        if (event.timeStamp - lastTrail > 46) {
            addSparks(pointer.x, pointer.y, Math.ceil(2 * intensity.density), .85 * intensity.energy);
            lastTrail = event.timeStamp;
        }
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { pointer.active = false; });
    hero.addEventListener("click", (event) => {
        if (!motionEnabled || event.target.closest("a, button") || !event.detail) return;
        const bounds = hero.getBoundingClientRect();
        pulse(event.clientX - bounds.left, event.clientY - bounds.top, 155);
    });
    hero.addEventListener("archive:worldchange", () => {
        updateLook();
        if (motionEnabled) pulse(width * .72, height * .43, Math.min(width * .23, 280));
    });

    new ResizeObserver(() => { resize(); sync(); }).observe(hero);
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        hero.classList.toggle("is-offscreen", !visible);
        sync();
    }).observe(hero);
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("archive:motionchange", sync);
    document.addEventListener("archive:appearancechange", updateLook);
    updateLook();
    resize();
    sync();
}

function initWorldSelector(hero) {
    const options = hero.querySelector("[data-world-options]");
    if (!options) return;

    const buttons = [...options.querySelectorAll("button")];
    const scenes = [...hero.querySelectorAll("[data-scene]")];
    const link = hero.querySelector("[data-world-link]");
    const linkLabel = hero.querySelector("[data-world-link-label]");
    const region = hero.querySelector("[data-world-region]");
    let requested = 0;
    let selection = 0;
    let requestId = 0;
    let transitionTimer = 0;
    let swipeStart = null;

    function loadScene(scene) {
        const image = scene.querySelector("img");
        if (image.dataset.src) {
            image.src = image.dataset.src;
            delete image.dataset.src;
        }
        return image;
    }

    async function choose(index) {
        const id = ++requestId;
        requested = index;
        if (selection === index) return;
        const button = buttons[index];
        const scene = scenes.find((candidate) => candidate.dataset.scene === button.dataset.worldOption);
        const image = loadScene(scene);
        try {
            await image.decode();
        } catch {
            // Show the accessible chapter link even if the artwork cannot load.
        }
        if (id !== requestId) return;

        clearTimeout(transitionTimer);
        hero.classList.remove("is-shifting");
        const previous = scenes.find((item) => item.classList.contains("is-active"));
        for (const item of scenes) {
            item.classList.toggle("is-active", item === scene);
            item.classList.toggle("is-leaving", motionEnabled && item === previous);
        }
        selection = index;
        for (const item of buttons) item.setAttribute("aria-pressed", String(item === button));
        hero.dataset.world = button.dataset.worldOption;
        region.textContent = button.dataset.region;
        link.href = button.dataset.chapter;
        linkLabel.textContent = "Enter " + button.querySelector(".world-option-title").textContent;
        if (motionEnabled) {
            void hero.offsetWidth;
            hero.classList.add("is-shifting");
            transitionTimer = setTimeout(() => {
                hero.classList.remove("is-shifting");
                previous?.classList.remove("is-leaving");
            }, 950);
        }
        hero.dispatchEvent(new Event("archive:worldchange"));
    }

    for (const [index, button] of buttons.entries()) {
        const preload = () => loadScene(scenes.find((scene) => scene.dataset.scene === button.dataset.worldOption));
        button.addEventListener("click", () => choose(index));
        button.addEventListener("pointerenter", preload, { once: true });
        button.addEventListener("focus", preload, { once: true });
    }

    options.addEventListener("keydown", (event) => {
        const destinations = {
            ArrowLeft: wrap(requested - 1, buttons.length),
            ArrowRight: wrap(requested + 1, buttons.length),
            Home: 0,
            End: buttons.length - 1
        };
        const index = destinations[event.key];
        if (!Number.isInteger(index)) return;
        event.preventDefault();
        buttons[index].focus({ preventScroll: true });
        choose(index);
    });

    hero.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch" || !event.isPrimary || event.target.closest("a, button")) return;
        swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    hero.addEventListener("pointercancel", () => { swipeStart = null; });
    hero.addEventListener("pointerup", (event) => {
        if (swipeStart?.id !== event.pointerId) return;
        const x = event.clientX - swipeStart.x;
        const y = event.clientY - swipeStart.y;
        swipeStart = null;
        if (Math.abs(x) > 48 && Math.abs(x) > Math.abs(y) * 1.5) {
            choose(wrap(requested + (x < 0 ? 1 : -1), buttons.length));
        }
    });

    options.hidden = false;
}

function enableMousePan(element, canPan, horizontalOnly = false) {
    let start;
    let panning = false;
    let suppressClick = false;

    element.addEventListener("pointerdown", (event) => {
        if (event.isPrimary) suppressClick = false;
        if (event.pointerType !== "mouse" || event.button !== 0 || !canPan()) return;
        start = { id: event.pointerId, x: event.clientX, y: event.clientY, left: element.scrollLeft, top: element.scrollTop };
    });

    element.addEventListener("pointermove", (event) => {
        if (start?.id !== event.pointerId || !event.buttons) return;
        const x = event.clientX - start.x;
        const y = horizontalOnly ? 0 : event.clientY - start.y;
        if (!panning && Math.hypot(x, y) < 6) return;
        if (!panning) {
            element.setPointerCapture(event.pointerId);
            element.classList.add("is-panning");
            panning = true;
        }
        event.preventDefault();
        element.scrollTo({ left: start.left - x, top: start.top - y, behavior: "instant" });
    });

    function end(event) {
        if (start?.id !== event.pointerId) return;
        start = null;
        suppressClick = panning;
        panning = false;
        element.classList.remove("is-panning");
    }

    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
    element.addEventListener("lostpointercapture", end);
    element.addEventListener("pointerleave", (event) => { if (!panning) end(event); });
    element.addEventListener("click", (event) => {
        if (!suppressClick || !event.detail) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
    }, true);
}

function initGalleryTrack() {
    const track = document.querySelector("[data-gallery-track]");
    const section = track?.closest("[data-gallery-section]");
    if (!section) return;
    const cards = [...track.children];
    if (cards.length < 3) return;

    const controls = section.querySelector("[data-gallery-controls]");
    const counter = controls.querySelector("[data-gallery-count]");
    const world = controls.querySelector("[data-gallery-world-name]");
    const note = controls.querySelector("[data-gallery-note]");
    const play = controls.querySelector("[data-gallery-play]");
    const playLabel = play.querySelector("[data-gallery-play-label]");
    const announcement = controls.querySelector("[data-gallery-announcement]");
    const cueGroup = controls.querySelector("[data-gallery-cues]");
    const names = cards.map((card) => card.querySelector(".gallery-caption > :first-child").textContent);
    const worldNames = cards.map((card) => card.querySelector(".gallery-caption > :last-child").textContent);
    const first = 2;
    const logicalIndex = (index) => wrap(index - first, cards.length);
    let positions = [];
    let active = -1;
    let visible = false;
    let keyboardFocused = false;
    let pointer = null;
    let playbackOverride;
    let autoFrame = 0;
    let autoPosition = 0;
    let autoTime;
    let loopStart = 0;
    let loopLength = 0;
    let driftSpeed = 0;
    let settleTimer = 0;
    let paintFrame = 0;
    let travel = null;
    let paintedPosition = NaN;

    // The copies carry the same scenery through the seam. Keep a single set of links and focus stops.
    function mirror(card) {
        const copy = card.cloneNode(true);
        for (const attribute of ["href", "data-lightbox", "data-reference", "data-note"]) {
            copy.removeAttribute(attribute);
        }
        copy.setAttribute("data-gallery-mirror", "");
        copy.setAttribute("aria-hidden", "true");
        copy.inert = true;
        return copy;
    }

    track.prepend(...cards.slice(-first).map(mirror));
    track.append(...cards.slice(0, first).map(mirror));
    const frames = [...track.children];
    const cues = names.map((name, index) => {
        const cue = document.createElement("button");
        cue.type = "button";
        cue.className = "gallery-cue";
        cue.title = name;
        cue.setAttribute("aria-label", `Show ${name}`);
        cue.setAttribute("aria-controls", track.id);
        cue.addEventListener("click", () => seek(index));
        return cue;
    });
    cueGroup.append(...cues);

    function nearest(left) {
        return clamp(Math.round((left - positions[0]) / (positions[1] - positions[0])), 0, frames.length - 1);
    }

    function paint() {
        paintFrame = 0;
        const left = track.scrollLeft;
        if (left === paintedPosition) return;
        paintedPosition = left;
        const current = nearest(left);
        const stride = positions[1] - positions[0];
        for (const [index, card] of frames.entries()) {
            const phase = clamp((positions[index] - left) / stride, -1.45, 1.45);
            const distance = Math.abs(phase);
            card.style.setProperty("--gallery-turn", `${-phase * 23}deg`);
            card.style.setProperty("--gallery-drop", `${distance * 18}px`);
            card.style.setProperty("--gallery-distance", `${distance * -168}px`);
            card.style.setProperty("--gallery-parallax", `${clamp(phase * 5, -5.25, 5.25)}%`);
            card.style.setProperty("--gallery-dim", String(Math.min(.48, distance * .32)));
            card.classList.toggle("is-featured", index === current);
        }

        const index = logicalIndex(current);
        if (active === index) return;
        if (active >= 0) cues[active].removeAttribute("aria-current");
        cues[index].setAttribute("aria-current", "true");
        section.dataset.world = cards[index].dataset.world;
        counter.textContent = `${String(index + 1).padStart(2, "0")} / ${cards.length}`;
        world.textContent = worldNames[index];
        note.textContent = cards[index].dataset.note;
        active = index;
    }

    function cancelAutoplay() {
        cancelAnimationFrame(autoFrame);
        autoFrame = 0;
    }

    function wantsAutoplay() {
        return playbackOverride ?? motionEnabled;
    }

    function canAutoplay() {
        return loopLength > 0 && wantsAutoplay() && visible
            && !document.hidden && !keyboardFocused && pointer === null && !document.querySelector("dialog[open]");
    }

    function drift(time) {
        if (!canAutoplay()) {
            cancelAutoplay();
            return;
        }

        // Keep subpixel progress even when the browser rounds individual scroll writes.
        const elapsed = autoTime === undefined ? 0 : clamp(time - autoTime, 0, 50);
        autoTime = time;
        autoPosition = loopStart + wrap(autoPosition - loopStart + elapsed * driftSpeed, loopLength);
        track.scrollTo({ left: autoPosition, behavior: "instant" });
        paint();
        autoFrame = requestAnimationFrame(drift);
    }

    function syncAutoplay() {
        if (!canAutoplay()) {
            cancelAutoplay();
            return;
        }
        if (autoFrame || settleTimer || travel) return;
        autoPosition = track.scrollLeft;
        autoTime = undefined;
        autoFrame = requestAnimationFrame(drift);
    }

    function cancelTravel() {
        if (!travel) return;
        cancelAnimationFrame(travel.frame);
        travel = null;
    }

    function finish(index, announce) {
        const scene = logicalIndex(index);
        track.scrollTo({ left: positions[first + scene], behavior: "instant" });
        paint();
        if (announce) announcement.textContent = `Scene ${scene + 1} of ${cards.length}. ${names[scene]}.`;
        syncAutoplay();
    }

    function goTo(index) {
        if (!loopLength) return;
        cancelAutoplay();
        cancelTravel();
        clearTimeout(settleTimer);
        settleTimer = 0;
        const start = track.scrollLeft;
        const distance = positions[index] - start;
        const steps = Math.abs(distance) / (positions[1] - positions[0]);
        if (!motionEnabled || steps < .005 || steps > 2.2) {
            finish(index, true);
            return;
        }

        let started;
        const duration = 765 + steps * 125;
        function step(time) {
            started ??= time;
            const progress = Math.min((time - started) / duration, 1);
            const eased = progress * progress * (3 - 2 * progress);
            track.scrollTo({ left: start + distance * eased, behavior: "instant" });
            paint();
            if (progress < 1) {
                travel.frame = requestAnimationFrame(step);
            } else {
                travel = null;
                finish(index, true);
            }
        }
        travel = { index, frame: requestAnimationFrame(step) };
    }

    function move(direction) {
        const current = travel?.index ?? nearest(track.scrollLeft);
        const next = current + direction;
        const target = next < 0 || next >= frames.length ? first + logicalIndex(next) : next;
        goTo(target);
    }

    function seek(scene) {
        let closest = first + scene;
        for (const [index, position] of positions.entries()) {
            if (logicalIndex(index) === scene
                && Math.abs(track.scrollLeft - position) < Math.abs(track.scrollLeft - positions[closest])) {
                closest = index;
            }
        }
        goTo(closest);
    }

    function measure() {
        const middle = track.clientWidth / 2;
        const end = track.scrollWidth - track.clientWidth;
        const centers = frames.map((card) => clamp(card.offsetLeft + card.offsetWidth / 2 - middle, 0, end));
        cancelAutoplay();
        cancelTravel();
        loopLength = 0;
        if (centers[1] <= centers[0]) return;
        positions = centers;
        // The seam falls between scenes so the central card is always an original.
        loopStart = (centers[first - 1] + centers[first]) / 2;
        loopLength = centers[first + cards.length] - centers[first];
        if (!loopLength) return;
        driftSpeed = clamp(loopLength / cards.length / 4800, .075, .2);
        paintedPosition = NaN;
        finish(first + Math.max(active, 0), false);
    }

    function queueSettle() {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
            settleTimer = 0;
            if (travel || pointer !== null) return;
            const index = nearest(track.scrollLeft);
            if (index !== first + logicalIndex(index)) finish(index, false);
            syncAutoplay();
        }, 175);
    }

    function reflectPlayState() {
        const playing = wantsAutoplay();
        play.dataset.playState = playing ? "on" : "off";
        playLabel.textContent = playing ? "Pause autoplay" : "Start autoplay";
        syncAutoplay();
    }

    controls.querySelector("[data-gallery-prev]").addEventListener("click", () => move(-1));
    controls.querySelector("[data-gallery-next]").addEventListener("click", () => move(1));
    play.addEventListener("click", () => {
        playbackOverride = !wantsAutoplay();
        reflectPlayState();
    });
    track.addEventListener("keydown", (event) => {
        if (event.target === track && active >= 0 && ["Enter", " "].includes(event.key)) {
            event.preventDefault();
            cards[active].click();
            return;
        }
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        if (event.target !== track) track.focus({ preventScroll: true });
        if (event.key === "Home" || event.key === "End") {
            seek(event.key === "Home" ? 0 : cards.length - 1);
        } else {
            move(event.key === "ArrowLeft" ? -1 : 1);
        }
    });
    function updateKeyboardFocus(target) {
        keyboardFocused = target !== play && section.contains(target) && target?.matches(":focus-visible");
        syncAutoplay();
    }

    section.addEventListener("focusin", (event) => updateKeyboardFocus(event.target));
    section.addEventListener("focusout", (event) => updateKeyboardFocus(event.relatedTarget));
    track.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary) return;
        pointer = event.pointerId;
        cancelTravel();
        cancelAutoplay();
    }, { passive: true });
    function releasePointer(event) {
        if (event.pointerId !== pointer) return;
        pointer = null;
        queueSettle();
    }
    window.addEventListener("pointerup", releasePointer, { passive: true });
    window.addEventListener("pointercancel", releasePointer, { passive: true });
    track.addEventListener("wheel", (event) => {
        if (!event.deltaX && !event.shiftKey) return;
        cancelTravel();
        cancelAutoplay();
        queueSettle();
    }, { passive: true });
    track.addEventListener("scroll", () => {
        if (travel || autoFrame || !loopLength) return;
        if (!paintFrame) paintFrame = requestAnimationFrame(paint);
        queueSettle();
    }, { passive: true });
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        section.classList.toggle("is-in-view", visible);
        syncAutoplay();
    }).observe(track);
    new ResizeObserver(measure).observe(track);
    document.addEventListener("visibilitychange", syncAutoplay);
    document.addEventListener("close", syncAutoplay, true);
    document.addEventListener("archive:motionchange", () => {
        if (!motionEnabled) {
            if (playbackOverride === true) playbackOverride = undefined;
            if (travel) {
                const { index } = travel;
                cancelTravel();
                finish(index, false);
            }
        }
        reflectPlayState();
    });
    enableMousePan(track, () => track.scrollWidth > track.clientWidth, true);

    track.classList.add("is-enhanced");
    controls.hidden = false;
    measure();
    reflectPlayState();
}

function initViewer() {
    if (typeof HTMLDialogElement === "undefined" || !HTMLDialogElement.prototype.showModal) return;
    const viewer = document.createElement("dialog");
    viewer.className = "viewer";
    viewer.setAttribute("aria-labelledby", "viewer-title");
    viewer.innerHTML = `
        <div class="viewer-viewport" tabindex="0" role="region" aria-label="Image preview"></div>
        <div class="viewer-bar">
            <div class="viewer-info">
                <h2 class="viewer-title" id="viewer-title" aria-live="polite"></h2>
                <a class="text-link" data-viewer-reference target="_blank" rel="noopener" hidden>Read about this place</a>
            </div>
            <div class="viewer-controls">
                <div class="viewer-nav" role="group" aria-label="Browse images">
                    <button type="button" class="button" data-viewer-prev>Previous</button>
                    <button type="button" class="button" data-viewer-next>Next</button>
                </div>
                <div class="viewer-zoom" role="group" aria-label="Image zoom">
                    <button type="button" class="button" data-zoom-out aria-label="Zoom out">−</button>
                    <button type="button" class="button" data-zoom-fit>Fit</button>
                    <button type="button" class="button" data-zoom-in aria-label="Zoom in">+</button>
                </div>
                <button type="button" class="button" data-viewer-close>Close</button>
            </div>
        </div>`;
    document.body.append(viewer);

    const viewport = viewer.querySelector(".viewer-viewport");
    const title = viewer.querySelector(".viewer-title");
    const nav = viewer.querySelector(".viewer-nav");
    const reference = viewer.querySelector("[data-viewer-reference]");
    const close = viewer.querySelector("[data-viewer-close]");
    const minus = viewer.querySelector("[data-zoom-out]");
    const fit = viewer.querySelector("[data-zoom-fit]");
    const plus = viewer.querySelector("[data-zoom-in]");
    let group = [];
    let index = 0;
    let zoom = 1;
    let photo;
    let opener;

    function fitImage(keepCenter = false) {
        if (!photo?.naturalWidth || !photo.isConnected || !viewer.open) return;
        const oldWidth = photo.clientWidth;
        const oldHeight = photo.clientHeight;
        const centerX = oldWidth > viewport.clientWidth ? (viewport.scrollLeft + viewport.clientWidth / 2) / oldWidth : .5;
        const centerY = oldHeight > viewport.clientHeight ? (viewport.scrollTop + viewport.clientHeight / 2) / oldHeight : .5;
        const aspect = photo.naturalWidth / photo.naturalHeight;
        const width = Math.min(viewport.clientWidth, viewport.clientHeight * aspect, photo.naturalWidth) * zoom;
        photo.style.setProperty("--viewer-width", `${width}px`);
        if (keepCenter) {
            viewport.scrollLeft = centerX * width - viewport.clientWidth / 2;
            viewport.scrollTop = centerY * width / aspect - viewport.clientHeight / 2;
        } else {
            viewport.scrollTo(0, 0);
        }
    }

    function updateZoomControls() {
        const ready = Boolean(photo?.isConnected);
        minus.disabled = !ready || zoom === 1;
        fit.disabled = !ready || zoom === 1;
        plus.disabled = !ready || zoom >= 4;
        viewport.classList.toggle("is-zoomed", ready && zoom > 1);
    }

    function changeZoom(value) {
        zoom = clamp(value, 1, 4);
        fitImage(true);
        updateZoomControls();
    }

    function showImage() {
        const trigger = group[index];
        const thumbnail = trigger.querySelector("img");
        title.textContent = trigger.dataset.caption
            || trigger.querySelector(".gallery-caption > span")?.textContent
            || thumbnail?.alt || trigger.textContent.trim();
        reference.hidden = !trigger.dataset.reference;
        if (trigger.dataset.reference) reference.href = trigger.dataset.reference;
        nav.hidden = group.length < 2;
        viewer.dataset.world = trigger.closest("[data-world]")?.dataset.world ?? "elden";

        zoom = 1;
        const status = document.createElement("p");
        status.className = "viewer-status";
        status.setAttribute("role", "status");
        status.textContent = "Loading image…";
        viewport.replaceChildren(status);
        viewport.scrollTo(0, 0);

        const image = new Image();
        photo = image;
        image.alt = thumbnail?.alt || title.textContent;
        image.draggable = false;
        image.addEventListener("load", () => {
            if (photo !== image || !viewer.open) return;
            viewport.replaceChildren(image);
            fitImage();
            updateZoomControls();
        }, { once: true });
        image.addEventListener("error", () => {
            if (photo === image) status.textContent = "This image could not be loaded.";
        }, { once: true });
        image.src = trigger.href;
        updateZoomControls();
    }

    function move(direction) {
        if (group.length < 2) return;
        index = wrap(index + direction, group.length);
        showImage();
    }

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("a[data-lightbox]");
        if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = trigger;
        const collection = trigger.closest("[data-gallery]");
        group = collection ? [...collection.querySelectorAll("a[data-lightbox]")] : [trigger];
        index = group.indexOf(trigger);
        viewer.showModal();
        showImage();
        close.focus();
    });

    close.addEventListener("click", () => viewer.close());
    viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.close(); });
    viewer.addEventListener("close", () => {
        if (viewer.open) return;
        photo = null;
        viewport.replaceChildren();
        opener?.focus({ preventScroll: true });
    });
    viewer.addEventListener("keydown", (event) => {
        if (zoom > 1 || group.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        move(event.key === "ArrowRight" ? 1 : -1);
    });

    viewer.querySelector("[data-viewer-prev]").addEventListener("click", () => move(-1));
    viewer.querySelector("[data-viewer-next]").addEventListener("click", () => move(1));
    minus.addEventListener("click", () => changeZoom(zoom / 1.5));
    fit.addEventListener("click", () => changeZoom(1));
    plus.addEventListener("click", () => changeZoom(zoom * 1.5));
    enableMousePan(viewport, () => zoom > 1);
    new ResizeObserver(() => fitImage(true)).observe(viewport);
}

initReadingProgress();
initReveals();
initCardTilt();
initGalleryTrack();
initViewer();

const hero = document.querySelector("[data-hero]");
if (hero) {
    hero.classList.add("has-arrived");
    initWorldSelector(hero);
    initAtmosphere(hero);
}
