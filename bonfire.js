(() => {
    const root = document.documentElement;
    const unlockKey = "soulsborne-archive-relic:kindled";
    const trailKey = "soulsborne-archive-relic:ember-trail";
    const colors = ["#ffe0a1", "#ffb666", "#ff8d49", "#e76534"];
    const maxParticles = 150;
    let unlocked = false;
    let trailEnabled = true;
    let layer, canvas, context, wash;
    let width = 0, height = 0;
    let particles = [];
    let frame = 0, frameTime = 0;
    let lastPointer;

    const canAnimate = () => root.dataset.motion === "on" && !document.hidden;
    const canTrail = () => unlocked && trailEnabled && canAnimate();
    const random = (low, high) => low + Math.random() * (high - low);
    const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

    function restore() {
        try {
            unlocked ||= window.localStorage.getItem(unlockKey) === "true";
            const savedTrail = window.localStorage.getItem(trailKey);
            if (savedTrail !== null) trailEnabled = savedTrail !== "off";
        } catch {
            // Keep the in-memory reward available when storage is blocked.
        }
        reflectTrail();
    }

    function reflectTrail() {
        for (const controls of document.querySelectorAll("[data-ember-trail-controls]")) controls.hidden = !unlocked;
        for (const toggle of document.querySelectorAll("[data-ember-trail-toggle]")) {
            toggle.setAttribute("aria-pressed", String(unlocked && trailEnabled));
            const status = toggle.querySelector("[data-ember-trail-status]");
            if (status) status.textContent = unlocked && trailEnabled ? "on" : "off";
        }
    }

    function resize() {
        if (!layer) return;
        width = root.clientWidth || window.innerWidth;
        height = window.innerHeight;
        if (!context) return;
        const scale = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        context.setTransform(scale, 0, 0, scale, 0, 0);
    }

    function prepareLayer() {
        if (layer) return;
        layer = document.createElement("div");
        layer.className = "bonfire-effects";
        layer.setAttribute("aria-hidden", "true");
        canvas = document.createElement("canvas");
        canvas.className = "bonfire-particles";
        canvas.hidden = true;
        layer.append(canvas);
        document.body.append(layer);
        context = canvas.getContext("2d");
        resize();
    }

    function stopParticles() {
        cancelAnimationFrame(frame);
        frame = 0;
        frameTime = 0;
        particles = [];
        if (context) context.clearRect(0, 0, width, height);
        if (canvas) canvas.hidden = true;
    }

    function clearEffects() {
        lastPointer = undefined;
        stopParticles();
        wash?.remove();
        wash = undefined;
    }

    function animate(time) {
        if (!canAnimate()) {
            clearEffects();
            return;
        }

        const step = frameTime ? Math.min((time - frameTime) / 1000, .04) : 1 / 60;
        frameTime = time;
        context.clearRect(0, 0, width, height);
        const living = [];

        for (const ember of particles) {
            ember.age += step;
            if (ember.age >= ember.life) continue;
            ember.x += ember.vx * step;
            ember.y += ember.vy * step;
            ember.vx *= Math.exp(-step * 1.65);
            ember.vy -= step * 12;
            living.push(ember);

            const fade = Math.min(ember.age * 12, 1) * (1 - ember.age / ember.life) ** 1.25;
            const radius = ember.size * (.45 + .55 * fade);
            context.fillStyle = ember.color;
            context.globalAlpha = fade * .19;
            context.beginPath();
            context.arc(ember.x, ember.y, radius * 3.3, 0, Math.PI * 2);
            context.fill();

            context.globalAlpha = fade * .9;
            context.strokeStyle = ember.color;
            context.lineWidth = radius * 1.45;
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(ember.x, ember.y);
            context.lineTo(ember.x - ember.vx * .025, ember.y - ember.vy * .025 + .4);
            context.stroke();
        }

        context.globalAlpha = 1;
        particles = living;
        if (particles.length) {
            frame = requestAnimationFrame(animate);
        } else {
            stopParticles();
        }
    }

    function spark(x, y, vx, vy, size, life, trail = false) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({ x, y, vx, vy, color, size, life, trail, age: 0 });
    }

    function renderSparks() {
        if (!context || !particles.length) return;
        if (particles.length > maxParticles) particles.splice(0, particles.length - maxParticles);
        if (frame) return;
        canvas.hidden = false;
        frame = requestAnimationFrame(animate);
    }

    function celebrate(detail) {
        if (!canAnimate()) return;
        prepareLayer();
        wash?.remove();

        const x = clamp(Number.isFinite(detail.x) ? detail.x : width * .5, 0, width);
        const y = clamp(Number.isFinite(detail.y) ? detail.y : height * .7, 0, height);
        wash = document.createElement("div");
        wash.className = "bonfire-wash";
        if (detail.first) wash.dataset.first = "";
        wash.style.setProperty("--fire-x", `${x}px`);
        wash.style.setProperty("--fire-y", `${y}px`);
        wash.style.setProperty("--fire-scale", String(Math.hypot(width, height) / 64));
        wash.addEventListener("animationend", (event) => {
            if (event.target === wash && event.animationName === "bonfire-wash") {
                wash.remove();
                wash = undefined;
            }
        });
        layer.prepend(wash);

        if (!context) return;
        const strength = detail.first ? 1 : .72;
        const scale = clamp(Math.min(width, height) / 680, .62, 1.35);
        for (let index = 0; index < Math.round(62 * strength * scale); index++) {
            const angle = random(-Math.PI * 1.08, Math.PI * .08);
            const speed = random(130, 720) * scale;
            spark(x + random(-10, 10), y + random(-9, 9), Math.cos(angle) * speed,
                Math.sin(angle) * speed - 35, random(.75, 2.9), random(.55, 1.48));
        }
        for (let index = 0; index < Math.round(42 * strength); index++) {
            spark(random(0, width), random(height * .23, height), random(-55, 55), random(-220, -85),
                random(.65, 2), random(.55, 1.45));
        }
        renderSparks();
    }

    function discardTrail() {
        lastPointer = undefined;
        particles = particles.filter((ember) => !ember.trail);
        if (!particles.length) stopParticles();
    }

    document.addEventListener("archive:bonfire", (event) => {
        unlocked = true;
        reflectTrail();
        celebrate(event.detail ?? {});
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest?.("[data-ember-trail-toggle]") || !unlocked) return;
        trailEnabled = !trailEnabled;
        try {
            window.localStorage.setItem(trailKey, trailEnabled ? "on" : "off");
        } catch {
            // The toggle still works on this page if saving fails.
        }
        if (!trailEnabled) discardTrail();
        reflectTrail();
    });

    document.addEventListener("pointermove", (event) => {
        if (!canTrail() || (event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
        const now = performance.now();
        if (lastPointer && now - lastPointer.time < 21) return;
        prepareLayer();
        if (!context) return;
        const { clientX: x, clientY: y } = event;
        const drift = lastPointer ? clamp((lastPointer.x - x) * 3, -85, 85) : 0;
        lastPointer = { x, time: now };
        for (let index = 0; index < 2; index++) {
            spark(x + random(-4, 4), y + random(-4, 4), drift + random(-34, 34), random(-94, -28),
                random(.75, 1.9), random(.32, .64), true);
        }
        renderSparks();
    }, { passive: true });

    document.addEventListener("pointerdown", (event) => {
        if (!canTrail() || event.pointerType !== "touch") return;
        prepareLayer();
        if (!context) return;
        for (let index = 0; index < 9; index++) {
            spark(event.clientX, event.clientY, random(-110, 110), random(-160, -40), random(.8, 2),
                random(.32, .65), true);
        }
        renderSparks();
    }, { passive: true });

    document.addEventListener("pointerout", (event) => {
        if (!event.relatedTarget) lastPointer = undefined;
    }, { passive: true });

    document.addEventListener("archive:motionchange", () => { if (!canAnimate()) clearEffects(); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearEffects(); });
    window.addEventListener("resize", resize);
    window.addEventListener("pagehide", clearEffects);
    window.addEventListener("pageshow", restore);
    window.addEventListener("storage", (event) => {
        if (event.key !== unlockKey && event.key !== trailKey && event.key !== null) return;
        if (event.key === trailKey && event.newValue === null) trailEnabled = true;
        restore();
        if (!trailEnabled) discardTrail();
    });

    restore();
})();
