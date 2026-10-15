/* ═══════════════════════════════════════════════════════════════
   UNDERGRADUATE PROJECTS — PRESENTATION ENGINE
   Navigation (keys, clicker, swipe, buttons), clock-wipe transitions,
   step builds, the mini dial, overview, details drawer, timer.
   Scene animations live in visuals.js and register with Deck.register().
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const root = document.documentElement;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarseQuery = window.matchMedia('(pointer: coarse)');
    const canSweep = !!(window.CSS && CSS.registerProperty);
    if (!canSweep) root.classList.add('no-sweep');

    const syncMediaClasses = () => {
        root.classList.toggle('reduce-motion', motionQuery.matches);
        root.classList.toggle('touch', coarseQuery.matches);
    };
    syncMediaClasses();
    motionQuery.addEventListener && motionQuery.addEventListener('change', syncMediaClasses);
    coarseQuery.addEventListener && coarseQuery.addEventListener('change', syncMediaClasses);

    const deckEl = document.getElementById('deck');
    const scenes = Array.from(deckEl.querySelectorAll(':scope > .scene'));
    const N = scenes.length;
    const controllers = new Map();

    const hand = document.getElementById('sweepHand');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const announcer = document.getElementById('announcer');
    const drawer = document.getElementById('drawer');
    const drawerBody = document.getElementById('drawerBody');
    const overview = document.getElementById('overview');
    const help = document.getElementById('help');
    const blackout = document.getElementById('blackout');
    const timerEl = document.getElementById('timer');

    let index = -1;
    let step = 0;
    let autoTimer = 0;
    let transition = null;
    let drawerOpener = null;

    const reduced = () => motionQuery.matches;
    const stepsOf = (s) => parseInt(s.dataset.steps || '0', 10) || 0;
    const autoplayOf = (s) => (s.dataset.autoplay || '').trim();

    function call(scene, method, ...args) {
        const c = controllers.get(scene.id);
        if (c && typeof c[method] === 'function') {
            try { return c[method](scene, ...args); } catch (err) { console.error('[deck]', scene.id, method, err); }
        }
    }

    /* ─── Time-of-day mapping: the talk runs from dawn to midnight ─── */
    const hourOf = (i) => 6 + 18 * (N > 1 ? i / (N - 1) : 0);

    function paintSky() {
        scenes.forEach((s, i) => {
            const h = hourOf(i);
            const st = s.style;
            if (h <= 18) {
                const a = Math.PI * (h - 6) / 12;              // 0 at dawn, π at dusk
                st.setProperty('--sun-x', (50 - 46 * Math.cos(a)).toFixed(1) + '%');
                st.setProperty('--sun-y', (100 - 82 * Math.sin(a)).toFixed(1) + '%');
                st.setProperty('--sun-a', (0.045 + 0.075 * Math.sin(a) + (h < 8 ? 0.03 : 0)).toFixed(3));
                st.setProperty('--moon-a', '0');
            } else {
                const f = (h - 18) / 6;                          // 0 at dusk, 1 at midnight
                st.setProperty('--sun-x', '98%');
                st.setProperty('--sun-y', '104%');
                st.setProperty('--sun-a', Math.max(0, 0.06 - f * 0.08).toFixed(3));
                st.setProperty('--moon-x', (85 - 50 * f).toFixed(1) + '%');
                st.setProperty('--moon-y', (22 - 14 * f).toFixed(1) + '%');
                st.setProperty('--moon-a', (0.03 + 0.05 * f).toFixed(3));
            }
        });
    }

    /* ─── Mini dial (top right) ─── */
    const miniDots = document.getElementById('miniDots');
    const miniHand = document.getElementById('miniHand');
    function buildMiniDial() {
        const NS = 'http://www.w3.org/2000/svg';
        scenes.forEach((s, i) => {
            const a = hourOf(i) / 24 * Math.PI * 2 - Math.PI / 2;
            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', (20 * Math.cos(a)).toFixed(2));
            c.setAttribute('cy', (20 * Math.sin(a)).toFixed(2));
            c.setAttribute('r', '2.1');
            c.setAttribute('class', 'md-dot');
            miniDots.appendChild(c);
        });
    }
    function updateChrome() {
        const dots = miniDots.children;
        for (let i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('is-past', i < index);
            dots[i].classList.toggle('is-now', i === index);
        }
        miniHand.style.transform = `rotate(${hourOf(index) * 15}deg)`;
        prevBtn.disabled = index <= 0;
        nextBtn.disabled = index >= N - 1 && step >= stepsOf(scenes[index]);
        const items = overview.querySelectorAll('.overview-list button');
        items.forEach((b, i) => b.setAttribute('aria-current', i === index ? 'true' : 'false'));
    }

    /* ─── Steps inside a scene ─── */
    function applyStep(scene, n, notify) {
        scene.dataset.step = String(n);
        scene.querySelectorAll('[data-show-at]').forEach((el) => {
            el.classList.toggle('is-shown', parseInt(el.dataset.showAt, 10) <= n);
        });
        scene.querySelectorAll('[data-step-only]').forEach((el) => {
            el.classList.toggle('is-current', parseInt(el.dataset.stepOnly, 10) === n);
        });
        if (notify) call(scene, 'step', n);
    }

    function scheduleAuto(first) {
        clearTimeout(autoTimer);
        const s = scenes[index];
        if (!s || step >= stepsOf(s)) return;
        const ap = autoplayOf(s);
        if (ap === 'off') return;
        const every = parseInt(ap || '1800', 10);
        const delay = first ? parseInt(s.dataset.autoplayStart || String(every), 10) : every;
        autoTimer = setTimeout(() => {
            if (isPanelOpen()) { scheduleAuto(false); return; }
            advanceStep();
        }, delay);
    }

    function advanceStep() {
        const s = scenes[index];
        if (step >= stepsOf(s)) return false;
        step += 1;
        applyStep(s, step, true);
        scheduleAuto(false);
        updateChrome();
        return true;
    }

    function retreatStep() {
        const s = scenes[index];
        if (step <= 0 || autoplayOf(s) !== 'off') return false;
        step -= 1;
        applyStep(s, step, true);
        updateChrome();
        return true;
    }

    /* ─── Moving between scenes ─── */
    function finishTransition() {
        if (!transition) return;
        clearTimeout(transition.timer);
        transition.from.classList.remove('is-leaving');
        transition.to.classList.remove('is-entering', 'is-reverse');
        hand.classList.remove('is-running', 'is-reverse');
        transition = null;
    }

    function go(target, opts) {
        opts = opts || {};
        const i = Math.max(0, Math.min(N - 1, target));
        if (i === index && !opts.force) return;
        const dir = opts.dir || (i > index ? 1 : -1);
        const from = index >= 0 ? scenes[index] : null;
        const to = scenes[i];

        finishTransition();
        clearTimeout(autoTimer);
        if (from && from.contains(document.activeElement)) document.activeElement.blur();

        if (from) {
            call(from, 'leave');
            from.inert = true;
            from.setAttribute('aria-hidden', 'true');
        }

        index = i;
        const total = stepsOf(to);
        const manual = autoplayOf(to) === 'off';
        // Going backwards into a manual build shows its last step; with reduced motion, automatic builds start finished
        step = ((dir < 0 && manual) || (reduced() && !manual)) ? total : 0;
        to.inert = false;
        to.removeAttribute('aria-hidden');
        to.scrollTop = 0;
        applyStep(to, step, false);

        if (from && from !== to && !opts.instant) {
            from.classList.remove('is-active');
            from.classList.add('is-leaving');
            to.classList.add('is-active', 'is-entering');
            to.classList.toggle('is-reverse', dir < 0);
            hand.classList.remove('is-running', 'is-reverse');
            void hand.offsetWidth;                                   // restart the hand animation
            hand.classList.add('is-running');
            hand.classList.toggle('is-reverse', dir < 0);
            const ms = (reduced() || !canSweep) ? 400 : 960;
            transition = { from, to, timer: setTimeout(finishTransition, ms + 40) };
        } else {
            if (from) from.classList.remove('is-active');
            to.classList.add('is-active');
        }

        call(to, 'enter', { dir, step });
        scheduleAuto(true);
        updateChrome();

        const url = i === 0 ? location.pathname + location.search : '#' + to.id;
        try { history.replaceState(null, '', url); } catch (e) { /* file:// in some browsers */ }
        announcer.textContent = `${i + 1} of ${N}: ${to.dataset.title || ''}`;
    }

    function next() {
        if (!advanceStep()) {
            if (index < N - 1) go(index + 1, { dir: 1 });
        }
    }
    function prev() {
        if (!retreatStep()) {
            if (index > 0) go(index - 1, { dir: -1 });
        }
    }
    function goToId(id) {
        const i = scenes.findIndex((s) => s.id === id);
        if (i >= 0) go(i);
        return i;
    }

    /* ─── Overview, help, drawer, blackout ─── */
    function buildOverview() {
        const list = document.getElementById('overviewList');
        scenes.forEach((s, i) => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.type = 'button';
            const cat = s.dataset.cat;
            b.innerHTML = `<span>${cat ? `<span class="cat-dot" data-cat="${cat}"></span>` : ''}${s.dataset.title || s.id}</span>`;
            b.addEventListener('click', () => { closeOverlay(overview); go(i); });
            li.appendChild(b);
            list.appendChild(li);
        });
    }

    let lastFocus = null;
    function openOverlay(o) {
        closeDrawer(true);
        [overview, help].forEach((x) => { if (x !== o) closeOverlay(x, true); });
        lastFocus = document.activeElement;
        o.classList.add('is-open');
        o.setAttribute('aria-hidden', 'false');
        deckEl.inert = true;
        const focusTarget = o === overview ? o.querySelector('[aria-current="true"]') : o.querySelector('[data-close]');
        (focusTarget || o.querySelector('button')).focus({ preventScroll: true });
    }
    function closeOverlay(o, silent) {
        if (!o.classList.contains('is-open')) return;
        o.classList.remove('is-open');
        o.setAttribute('aria-hidden', 'true');
        deckEl.inert = false;
        if (!silent && lastFocus && document.contains(lastFocus) && !lastFocus.closest('.scene[inert]')) lastFocus.focus({ preventScroll: true });
        else if (document.activeElement) document.activeElement.blur();
    }
    const toggleOverlay = (o) => (o.classList.contains('is-open') ? closeOverlay(o) : openOverlay(o));

    function openDrawer(id, opener) {
        const src = document.getElementById(id);
        if (!src) return;
        drawerBody.innerHTML = src.innerHTML;
        drawerBody.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
        drawerOpener = opener || null;
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        drawer.querySelector('.drawer-panel').scrollTop = 0;
        deckEl.inert = true;
        drawer.querySelector('.drawer-close').focus({ preventScroll: true });
    }
    function closeDrawer(silent) {
        if (!drawer.classList.contains('is-open')) return;
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        deckEl.inert = false;
        if (!silent && drawerOpener && document.contains(drawerOpener)) drawerOpener.focus({ preventScroll: true });
        drawerOpener = null;
    }

    const isPanelOpen = () => drawer.classList.contains('is-open') || overview.classList.contains('is-open') || help.classList.contains('is-open');

    function toggleBlackout(force) {
        const on = typeof force === 'boolean' ? force : !blackout.classList.contains('is-on');
        blackout.classList.toggle('is-on', on);
    }

    function toggleFullscreen() {
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
        } catch (e) { /* not supported (e.g. iPhone) */ }
    }

    /* ─── Talk timer (T) ─── */
    let timerStart = 0;
    let timerTick = 0;
    function renderTimer() {
        const sec = Math.floor((Date.now() - timerStart) / 1000);
        timerEl.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
        timerEl.classList.toggle('is-late', sec >= 480 && sec < 600);
        timerEl.classList.toggle('is-over', sec >= 600);
    }
    function toggleTimer(restart) {
        if (restart || !timerStart) timerStart = Date.now();
        const show = restart ? true : timerEl.hidden;
        timerEl.hidden = !show;
        clearInterval(timerTick);
        if (show) { renderTimer(); timerTick = setInterval(renderTimer, 1000); }
    }

    /* ─── Input ─── */
    function onKey(e) {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key;

        if (blackout.classList.contains('is-on')) {
            if (!/^(Shift|Control|Alt|Meta|CapsLock|Tab)$/.test(k)) {    // any key brings the screen back
                toggleBlackout(false);
                e.preventDefault();
            }
            return;
        }
        if (drawer.classList.contains('is-open')) {
            if (k === 'Escape') { closeDrawer(); e.preventDefault(); }
            return;
        }
        if (overview.classList.contains('is-open') || help.classList.contains('is-open')) {
            const open = overview.classList.contains('is-open') ? overview : help;
            if (k === 'Escape' || (open === overview && k.toLowerCase() === 'o') || (open === help && (k === '?' || k.toLowerCase() === 'h'))) {
                closeOverlay(open); e.preventDefault();
            }
            return;
        }

        const t = e.target;
        const onControl = t && t.closest && t.closest('button, a, input, select, textarea, [role="slider"]');
        switch (k) {
            case 'ArrowRight': case 'ArrowDown': case 'PageDown':
                next(); break;
            case ' ': case 'Enter': case 'Spacebar':
                if (onControl) return;
                next(); break;
            case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
                prev(); break;
            case 'Home': go(0); break;
            case 'End': go(N - 1); break;
            case 'o': case 'O': toggleOverlay(overview); break;
            case '?': case 'h': case 'H': toggleOverlay(help); break;
            case 'f': case 'F': case 'F5': toggleFullscreen(); break;
            case 'b': case 'B': case '.': toggleBlackout(); break;
            case 't': case 'T': toggleTimer(e.shiftKey); break;
            default: return;
        }
        e.preventDefault();
    }

    let lastPointerType = 'mouse';
    let swipe = null;
    function onPointerDown(e) {
        lastPointerType = e.pointerType || 'mouse';
        if (e.pointerType === 'mouse') return;
        swipe = { x: e.clientX, y: e.clientY, t: Date.now(), target: e.target };
    }
    function onPointerUp(e) {
        if (!swipe || e.pointerType === 'mouse') { swipe = null; return; }
        const dx = e.clientX - swipe.x;
        const dy = e.clientY - swipe.y;
        const quick = Date.now() - swipe.t < 900;
        const blocked = swipe.target.closest && swipe.target.closest('.cd-svg, [data-no-swipe]');
        swipe = null;
        if (quick && !blocked && Math.abs(dx) > 55 && Math.abs(dx) > 1.6 * Math.abs(dy)) {
            if (dx < 0) next(); else prev();
        }
    }
    function onDeckClick(e) {
        if (lastPointerType !== 'mouse' || e.button !== 0) return;
        if (e.target.closest('a, button, input, label, select, textarea, [role="slider"], .cd-svg, .menu-options, .join-jump, .qr')) return;
        const sel = window.getSelection && window.getSelection();
        if (sel && String(sel).length) return;
        next();
    }

    /* ─── Images that fail to load (e.g. offline): show their name instead ─── */
    function guardImages() {
        document.querySelectorAll('img[data-fallback]').forEach((img) => {
            const swap = () => {
                const span = document.createElement('span');
                span.className = 'gel-fallback';
                span.textContent = img.dataset.fallback;
                img.replaceWith(span);
            };
            if (img.complete && img.naturalWidth === 0 && img.currentSrc) swap();
            else img.addEventListener('error', swap, { once: true });
        });
    }

    /* ─── Animation loop: only the scene on screen gets frames ─── */
    let last = performance.now();
    function loop(now) {
        const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
        last = now;
        if (!document.hidden && index >= 0) {
            const s = scenes[index];
            const c = controllers.get(s.id);
            if (c && c.frame) {
                try { c.frame(dt, now / 1000, s); } catch (err) { console.error('[deck]', s.id, 'frame', err); }
            }
        }
        requestAnimationFrame(loop);
    }

    /* ─── Public API for visuals.js ─── */
    window.Deck = {
        scenes,
        register(id, ctrl) { controllers.set(id, ctrl); },
        go, goToId, next, prev,
        openDrawer,
        reduced,
        get index() { return index; },
        get step() { return step; },
        hourOf,
    };

    function start() {
        scenes.forEach((s) => {
            s.inert = true;
            s.setAttribute('aria-hidden', 'true');
            s.setAttribute('role', 'group');
            s.setAttribute('aria-roledescription', 'slide');
            if (s.dataset.title) s.setAttribute('aria-label', s.dataset.title);
        });
        paintSky();
        controllers.forEach((c, id) => {
            const s = document.getElementById(id);
            if (s && typeof c.init === 'function') {
                try { c.init(s); } catch (err) { console.error('[deck]', id, 'init', err); }
            }
        });
        buildMiniDial();
        buildOverview();
        guardImages();

        document.addEventListener('keydown', onKey);
        deckEl.addEventListener('pointerdown', onPointerDown, { passive: true });
        deckEl.addEventListener('pointerup', onPointerUp, { passive: true });
        deckEl.addEventListener('pointercancel', () => { swipe = null; }, { passive: true });
        deckEl.addEventListener('click', onDeckClick);
        prevBtn.addEventListener('click', prev);
        nextBtn.addEventListener('click', next);
        document.getElementById('dialBtn').addEventListener('click', () => toggleOverlay(overview));
        document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
        blackout.addEventListener('click', () => toggleBlackout(false));
        drawer.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeDrawer()));
        [overview, help].forEach((o) => {
            o.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeOverlay(o)));
            o.addEventListener('click', (e) => { if (e.target === o) closeOverlay(o); });
        });
        document.addEventListener('click', (e) => {
            const b = e.target.closest('[data-details]');
            if (b) { e.preventDefault(); openDrawer(b.dataset.details, b); }
        });
        window.addEventListener('hashchange', () => {
            const id = decodeURIComponent(location.hash.slice(1));
            const i = scenes.findIndex((s) => s.id === id);
            if (i >= 0 && i !== index) go(i);
        });

        const startId = decodeURIComponent(location.hash.slice(1));
        const startIndex = Math.max(0, scenes.findIndex((s) => s.id === startId));
        go(startIndex, { instant: true, force: true });
        requestAnimationFrame(loop);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else setTimeout(start, 0);
})();
