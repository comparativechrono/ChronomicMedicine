/* ═══════════════════════════════════════════
   CHRONOMIC MEDICINE — INTERACTIVE DIAGRAMS

   A small engine shared by the homepage carousel, the Research page and
   the Software page. Each diagram is registered under a name:

     Viz.register('name', function (v, opts) {
         const svg = v.svg(560, 360, 'What the diagram shows, for screen readers');
         ...build it with v.s(), v.slider(), v.segmented(), v.caption()...
         return {
             frame(dt, t) { ... },   // every animation frame while it is on screen
             draw() { ... },         // draw the current state as a still picture
         };
     });

   and placed in a page with <div data-viz="name"></div>, or from a script
   with Viz.mount(element, 'name', options). Diagrams only animate while they
   are on screen. If the visitor has asked their device to reduce motion,
   they show a still picture and still respond to the controls.

   Diagrams for research projects are in viz-projects.js, and for software
   in viz-software.js. Colours come from viz.css, so they follow the theme.
   ═══════════════════════════════════════════ */
(function () {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';
    const TAU = Math.PI * 2;
    const registry = Object.create(null);
    const live = new Set();
    const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const reduced = () => !!(motionQuery && motionQuery.matches);
    let uid = 0;

    /* ─── Small helpers ─── */
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const wrap24 = (h) => ((h % 24) + 24) % 24;
    const hourDiff = (a, b) => { let d = wrap24(a - b); if (d > 12) d -= 24; return d; };
    const f1 = (n) => (Math.round(n * 10) / 10).toString();
    function hhmm(h) {
        const q = Math.round(wrap24(h) * 4) / 4;
        const hh = Math.floor(q) % 24, mm = Math.round((q - Math.floor(q)) * 60);
        return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    }
    // Point on a 24-hour dial: 00 at the top, clockwise
    function polar(r, hours, cx, cy) {
        const a = hours / 24 * TAU - Math.PI / 2;
        return [(cx || 0) + r * Math.cos(a), (cy || 0) + r * Math.sin(a)];
    }
    function arc(r, h0, h1, cx, cy) {
        const span = wrap24(h1 - h0) || 24;
        if (span >= 23.999) {
            const [x0, y0] = polar(r, h0, cx, cy), [x1, y1] = polar(r, h0 + 12, cx, cy);
            return `M${f1(x0)} ${f1(y0)} A${r} ${r} 0 1 1 ${f1(x1)} ${f1(y1)} A${r} ${r} 0 1 1 ${f1(x0)} ${f1(y0)}`;
        }
        const [x0, y0] = polar(r, h0, cx, cy), [x1, y1] = polar(r, h1, cx, cy);
        return `M${f1(x0)} ${f1(y0)} A${r} ${r} 0 ${span > 12 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
    }
    // Seeded random numbers, so layouts are the same on every visit
    function rng(seed) {
        let s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function s(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }
    function h(tag, attrs, parent, text) {
        const e = document.createElement(tag);
        if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
        if (text !== undefined) e.textContent = text;
        if (parent) parent.appendChild(e);
        return e;
    }
    function text(parent, x, y, str, attrs) {
        const t = s('text', Object.assign({ x: f1(x), y: f1(y) }, attrs || {}), parent);
        t.textContent = str;
        return t;
    }

    // Research themes and their colours (see viz.css)
    const TONES = { cardiac: 'rose', cancer: 'violet', immunity: 'teal', endocrine: 'amber', pharmacogenomics: 'blue', diagnostics: 'green' };
    const tone = (pillar) => TONES[String(pillar || '').trim().toLowerCase()] || 'accent';

    /* ─── Animation loop: one for the whole page ─── */
    let raf = 0, last = 0;
    function loop(now) {
        raf = 0;
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        let any = false;
        live.forEach((inst) => {
            if (!inst.running()) return;
            any = true;
            inst.t += dt;
            try { inst.api.frame(dt, inst.t); } catch (err) { inst.broken = true; console.error('Diagram "' + inst.name + '" stopped:', err); }
        });
        if (any) raf = requestAnimationFrame(loop);
    }
    function kick() {
        if (raf || reduced() || document.hidden) return;
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', kick);
    if (motionQuery) {
        const onMotion = () => { live.forEach((inst) => inst.redraw()); kick(); };
        if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotion);
        else if (motionQuery.addListener) motionQuery.addListener(onMotion);
    }

    const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            const inst = e.target.__viz;
            if (!inst) return;
            const was = inst.inView;
            inst.inView = e.isIntersecting;
            if (e.isIntersecting && !was) inst.shown();
        });
        kick();
    }, { rootMargin: '60px 0px' }) : null;

    /* ─── The toolkit handed to each diagram ─── */
    function kit(el, inst, opts) {
        const compact = !!opts.compact;
        let stage = null, controls = null, caption = null, lastTouch = -1e9;
        const showFns = [];

        const v = {
            root: el, compact, opts, NS, TAU,
            reduced, clamp, lerp, ease, easeOut, wrap24, hourDiff, hhmm, polar, arc, rng, f1,
            s, h, text,
            svg(w, hgt, label) {
                stage = stage || h('div', { class: 'viz-stage' }, el);
                const svg = s('svg', { viewBox: `0 0 ${w} ${hgt}`, class: 'viz-svg', role: 'img', 'aria-label': label || '' }, stage);
                return svg;
            },
            controls() {
                if (compact) return null;
                if (!controls) controls = h('div', { class: 'viz-controls' }, el);
                return controls;
            },
            caption(html) {
                if (compact) return null;
                if (!caption) caption = h('p', { class: 'viz-caption' }, el);
                caption.innerHTML = html; // only ever our own text
                return caption;
            },
            // A row of buttons, one pressed at a time
            segmented(o) {
                const box = v.controls();
                if (!box) return { set() {}, value: o.value };
                const group = h('div', { class: 'viz-seg', role: 'group', 'aria-label': o.label }, box);
                if (o.label && !o.hideLabel) h('span', { class: 'viz-seg-label' }, group, o.label);
                const btns = o.options.map((opt) => {
                    const b = h('button', { type: 'button', 'aria-pressed': String(opt.value === o.value) }, group, opt.label);
                    b.addEventListener('click', () => {
                        api.set(opt.value);
                        v.touch();
                        if (o.onChange) o.onChange(opt.value);
                        inst.changed();
                    });
                    return b;
                });
                const api = {
                    value: o.value,
                    set(val) {
                        api.value = val;
                        o.options.forEach((opt, i) => btns[i].setAttribute('aria-pressed', String(opt.value === val)));
                    },
                };
                return api;
            },
            slider(o) {
                const box = v.controls();
                if (!box) return { set() {}, value: o.value };
                const id = 'viz-' + (++uid);
                const wrap = h('div', { class: 'viz-slider' }, box);
                const lab = h('label', { for: id }, wrap);
                h('span', { class: 'viz-slider-name' }, lab, o.label);
                const out = h('output', { for: id, class: 'viz-slider-value' }, lab);
                const input = h('input', { type: 'range', id, min: o.min, max: o.max, step: o.step || 'any', value: o.value }, wrap);
                const fmt = o.format || ((x) => String(x));
                const show = () => { out.textContent = fmt(+input.value); input.setAttribute('aria-valuetext', fmt(+input.value)); };
                input.addEventListener('input', () => {
                    show();
                    v.touch();
                    if (o.onInput) o.onInput(+input.value);
                    inst.changed();
                });
                show();
                return {
                    input,
                    get value() { return +input.value; },
                    set(val) { input.value = val; show(); },
                };
            },
            button(o) {
                const box = v.controls();
                if (!box) return null;
                const b = h('button', { type: 'button', class: 'viz-btn' + (o.quiet ? ' viz-btn--quiet' : '') }, box, o.label);
                b.addEventListener('click', () => { v.touch(); o.onClick(); inst.changed(); });
                return b;
            },
            // Note that the visitor did something (pauses the self-running demo for a while)
            touch() { lastTouch = performance.now(); },
            idleFor(ms) { return performance.now() - lastTouch > ms; },
            // true while the diagram should run its own demo: always in compact mode,
            // otherwise until the visitor uses it, and again 10 seconds after they stop
            auto() { return compact || performance.now() - lastTouch > 10000; },
            changed() { inst.changed(); },
            onShow(fn) { showFns.push(fn); },
            _shown() { showFns.forEach((fn) => fn()); },
            // Pointer position in the SVG's own units
            toSVG(svg, e) {
                const pt = svg.createSVGPoint();
                pt.x = e.clientX; pt.y = e.clientY;
                const m = svg.getScreenCTM();
                return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
            },
            // Make a clock hand draggable (pointer and keyboard)
            dial(o) {
                const { svg, cx, cy, knob } = o;
                let dragging = false;
                knob.setAttribute('tabindex', '0');
                knob.setAttribute('role', 'slider');
                knob.setAttribute('aria-label', o.label || 'Time of day');
                knob.setAttribute('aria-valuemin', '0');
                knob.setAttribute('aria-valuemax', '24');
                knob.classList.add('viz-knob');
                const hourAt = (e) => {
                    const p = v.toSVG(svg, e);
                    let a = Math.atan2(p.x - cx, -(p.y - cy));
                    if (a < 0) a += TAU;
                    return a / TAU * 24;
                };
                const grab = (o.hit || []).concat([knob]);
                grab.forEach((g) => g.classList.add('viz-grab'));
                svg.addEventListener('pointerdown', (e) => {
                    const onGrab = grab.some((g) => g === e.target || g.contains(e.target));
                    if (!onGrab && !(o.anywhere && e.pointerType === 'mouse')) return;
                    dragging = true;
                    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
                    svg.classList.add('is-dragging');
                    v.touch();
                    o.onChange(hourAt(e));
                    inst.changed();
                    e.preventDefault();
                });
                svg.addEventListener('pointermove', (e) => {
                    if (!dragging) return;
                    v.touch();
                    o.onChange(hourAt(e));
                    inst.changed();
                });
                const end = () => { if (dragging) { dragging = false; svg.classList.remove('is-dragging'); v.touch(); } };
                svg.addEventListener('pointerup', end);
                svg.addEventListener('pointercancel', end);
                knob.addEventListener('keydown', (e) => {
                    const step = e.shiftKey ? 2 : 0.5;
                    const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[e.key];
                    if (d === undefined) return;
                    v.touch();
                    o.onChange(wrap24((o.get ? o.get() : 0) + d));
                    inst.changed();
                    e.preventDefault();
                });
                return {
                    update(hour) {
                        knob.setAttribute('aria-valuenow', wrap24(hour).toFixed(2));
                        knob.setAttribute('aria-valuetext', hhmm(hour));
                    },
                    get dragging() { return dragging; },
                };
            },
        };
        return v;
    }

    /* ─── Public API ─── */
    function register(name, factory) { registry[name] = factory; }

    function mount(el, name, opts) {
        if (!el) return null;
        if (el.__viz) return el.__viz.handle;
        const factory = registry[name];
        if (!factory) return null;
        opts = Object.assign({}, opts || {});
        el.classList.add('viz', 'viz--' + name);
        if (opts.compact) el.classList.add('viz--compact');
        const inst = { el, name, t: 0, inView: !io, active: true, broken: false, api: {} };
        inst.running = () => inst.active && inst.inView && !inst.broken && !document.hidden && !reduced() && typeof inst.api.frame === 'function';
        inst.redraw = () => { if (inst.api.draw) { try { inst.api.draw(); } catch (err) { console.error(err); } } };
        inst.changed = () => { if (!inst.running()) inst.redraw(); else kick(); };
        const v = kit(el, inst, opts);
        inst.shown = () => { v._shown(); kick(); };
        try {
            inst.api = factory(v, opts) || {};
        } catch (err) {
            console.error('Diagram "' + name + '" could not be built:', err);
            el.classList.add('viz--failed');
            return null;
        }
        el.__viz = inst;
        live.add(inst);
        inst.redraw();
        if (io) io.observe(el);
        inst.handle = {
            el,
            api: inst.api,
            setActive(on) {
                const was = inst.active;
                inst.active = !!on;
                if (on && !was) { inst.shown(); }
                if (on) kick();
            },
        };
        kick();
        return inst.handle;
    }

    function mountAll(root, opts) {
        const found = [];
        (root || document).querySelectorAll('[data-viz]').forEach((el) => {
            const handle = mount(el, el.getAttribute('data-viz'), Object.assign({}, opts || {}, { compact: el.hasAttribute('data-compact') || (opts && opts.compact) }));
            if (handle) found.push(handle);
        });
        return found;
    }

    window.Viz = { register, mount, mountAll, tone, has: (name) => !!registry[name], reduced };
})();
