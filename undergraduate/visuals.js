/* ═══════════════════════════════════════════════════════════════
   UNDERGRADUATE PROJECTS — SCENE ANIMATIONS
   One controller per scene, registered by the scene's id:
     init(scene)          build SVG content once
     enter(scene, opts)   scene arrives on screen
     step(scene, n)       build step n reached (see data-steps)
     frame(dt, t)         called every animation frame while on screen
     leave(scene)         scene leaves the screen
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    const Deck = window.Deck;
    if (!Deck) return;

    const NS = 'http://www.w3.org/2000/svg';
    const TAU = Math.PI * 2;
    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const reduced = () => Deck.reduced();
    const f1 = (n) => (Math.round(n * 10) / 10).toString();

    function svgEl(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }
    // Small seeded random generator so layouts are identical every time
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
    function gauss(r) {
        let u = 0, v = 0;
        while (u === 0) u = r();
        while (v === 0) v = r();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
    }
    const wrap24 = (h) => ((h % 24) + 24) % 24;
    const hourDiff = (a, b) => { let d = wrap24(a - b); if (d > 12) d -= 24; return d; };
    // Position on a 24-hour dial: 00 at the top, clockwise
    function polar(r, hours) {
        const a = hours / 24 * TAU - Math.PI / 2;
        return [r * Math.cos(a), r * Math.sin(a)];
    }
    function arcPath(r, h0, h1) {
        const span = wrap24(h1 - h0) || 24;
        const [x0, y0] = polar(r, h0);
        const [x1, y1] = polar(r, h1);
        return `M${f1(x0)} ${f1(y0)} A${r} ${r} 0 ${span > 12 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
    }
    function sectorPath(r, h0, h1) {
        const span = wrap24(h1 - h0) || 24;
        const [x0, y0] = polar(r, h0);
        const [x1, y1] = polar(r, h1);
        return `M0 0 L${f1(x0)} ${f1(y0)} A${r} ${r} 0 ${span > 12 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)} Z`;
    }
    function hhmm(h) {
        const q = Math.floor(wrap24(h) * 4) / 4;
        const hh = Math.floor(q);
        const mm = Math.round((q - hh) * 60);
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
    function mixHex(a, b, t) {
        const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
        const ch = (p, s) => (p >> s) & 255;
        const m = (s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
        return `rgb(${m(16)}, ${m(8)}, ${m(0)})`;
    }
    // Apply a state change without CSS transitions (used when a scene re-enters)
    function snap(el, fn) {
        el.classList.add('is-snapping');
        fn();
        void el.getBoundingClientRect();
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-snapping')));
    }
    const snapStyle = document.createElement('style');
    snapStyle.textContent = '.is-snapping, .is-snapping * { transition: none !important; }';
    document.head.appendChild(snapStyle);

    // Jump to a project scene, or to the dissertations screen with that card highlighted
    function openOption(o) {
        const scene = o.closest('.scene');
        if (!scene) return;
        Deck.goToId(scene.id);
        if (o !== scene) {
            $$('.ds-card.is-highlight').forEach((c) => c.classList.remove('is-highlight'));
            o.classList.add('is-highlight');
            setTimeout(() => o.classList.remove('is-highlight'), 4500);
        }
    }
    const options = () => $$('[data-option]');

    /* ═══ Helix clock: a 24-hour dial whose rim is a DNA double helix ═══ */
    function HelixClock(svg, opts) {
        opts = opts || {};
        const R = 205, A = 30, TWISTS = 14, RUNGS = 112, K = 420;
        const tickLayer = $('.hc-ticks', svg);
        for (let i = 0; i < 24; i++) {
            const major = i % 6 === 0;
            const [x1, y1] = polar(major ? 284 : 292, i);
            const [x2, y2] = polar(302, i);
            svgEl('line', { x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2), class: 'hc-tick' + (major ? ' is-major' : '') }, tickLayer);
        }
        const strands = {
            b1: $('.hc-back.s1', svg), b2: $('.hc-back.s2', svg),
            f1: $('.hc-front.s1', svg), f2: $('.hc-front.s2', svg),
        };
        const rungLayer = $('.hc-rungs', svg);
        const colours = ['#e8c36e', '#5ed6c0', '#7fb4ff', '#ff8a9a'];
        const r = rng(opts.seed || 11);
        const rungs = [];
        for (let j = 0; j < RUNGS; j++) {
            rungs.push({
                theta: (j + 0.5) / RUNGS * TAU,
                line: svgEl('line', { class: 'hc-rung', stroke: colours[Math.floor(r() * 4)] }, rungLayer),
            });
        }
        const handEl = $('.hc-hand', svg);
        const tailEl = $('.hc-hand-tail', svg);
        let phase = opts.phase || 0;
        let hour = opts.hour != null ? opts.hour : 6;
        const speed = opts.speed != null ? opts.speed : 1;      // clock hours per second
        const twist = opts.twist != null ? opts.twist : 0.75;   // helix rotation, radians per second

        function point(theta, sign) {
            const rr = R + sign * A * Math.sin(TWISTS * theta + phase);
            const a = theta - Math.PI / 2;
            return [rr * Math.cos(a), rr * Math.sin(a)];
        }
        function render() {
            const d = { b1: '', b2: '', f1: '', f2: '' };
            const lastK = { b1: -2, b2: -2, f1: -2, f2: -2 };
            let p1 = point(0, 1), p2 = point(0, -1);
            for (let k = 1; k <= K; k++) {
                const th = k / K * TAU;
                const q1 = point(th, 1), q2 = point(th, -1);
                const front1 = Math.cos(TWISTS * ((k - 0.5) / K * TAU) + phase) > 0;
                const k1 = front1 ? 'f1' : 'b1';
                const k2 = front1 ? 'b2' : 'f2';
                if (lastK[k1] !== k - 1) d[k1] += `M${f1(p1[0])} ${f1(p1[1])}`;
                d[k1] += `L${f1(q1[0])} ${f1(q1[1])}`;
                lastK[k1] = k;
                if (lastK[k2] !== k - 1) d[k2] += `M${f1(p2[0])} ${f1(p2[1])}`;
                d[k2] += `L${f1(q2[0])} ${f1(q2[1])}`;
                lastK[k2] = k;
                p1 = q1; p2 = q2;
            }
            for (const key in strands) strands[key].setAttribute('d', d[key]);

            const handTheta = wrap24(hour) / 24 * TAU;
            for (const rg of rungs) {
                const u = TWISTS * rg.theta + phase;
                const [x1, y1] = point(rg.theta, 1);
                const [x2, y2] = point(rg.theta, -1);
                const behind = ((handTheta - rg.theta) % TAU + TAU) % TAU;   // how far the hand has passed this rung
                const trail = behind < 1.8 ? Math.exp(-behind / 0.38) : 0;
                const opacity = Math.min(1, 0.14 + 0.46 * Math.abs(Math.sin(u)) + trail * 0.9);
                const ln = rg.line;
                ln.setAttribute('x1', f1(x1)); ln.setAttribute('y1', f1(y1));
                ln.setAttribute('x2', f1(x2)); ln.setAttribute('y2', f1(y2));
                ln.setAttribute('stroke-opacity', opacity.toFixed(2));
                ln.setAttribute('stroke-width', (2 + trail * 2.4).toFixed(2));
            }
            const deg = (wrap24(hour) * 15).toFixed(2);
            handEl.setAttribute('transform', `rotate(${deg})`);
            tailEl.setAttribute('transform', `rotate(${deg})`);
        }
        render();
        return {
            frame(dt) { phase += dt * twist; hour += dt * speed; render(); },
            set(h) { hour = h; render(); },
        };
    }

    /* ═══ 1 · Title ═══ */
    let startClock = null;
    Deck.register('start', {
        init(scene) { startClock = HelixClock($('.helix-clock', scene), { hour: 6, speed: 1, seed: 11 }); },
        frame(dt) { if (!reduced()) startClock.frame(dt); },
    });

    /* ═══ 2 · The menu: projects by day, dissertations by night ═══ */
    (function () {
        const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
        const count = (n, w) => `${words[n] || n} ${w}${n === 1 ? '' : 's'}`;
        const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
        const items = [];
        let handEl = null;
        let handHour = 6;
        let target = 6;

        function show(it, on) {
            it.btn.classList.toggle('is-shown', on);
            it.dot.classList.toggle('is-shown', on);
            it.spoke.classList.toggle('is-shown', on);
        }
        function render() {
            handEl.setAttribute('transform', `rotate(${(handHour * 15).toFixed(2)})`);
            items.forEach((it) => show(it, handHour >= it.hour - 0.15));
        }

        Deck.register('menu', {
            init(scene) {
                const svg = $('.mn-svg', scene);
                const ticks = $('.mn-ticks', svg);
                for (let i = 0; i < 24; i++) {
                    const major = i % 6 === 0;
                    const [x1, y1] = polar(major ? 186 : 193, i);
                    const [x2, y2] = polar(200, i);
                    svgEl('line', { x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2), class: 'mn-tick' + (major ? ' is-major' : '') }, ticks);
                }
                $('.mn-night', svg).setAttribute('d', sectorPath(200, 18, 6));
                $('.mn-day', svg).setAttribute('d', sectorPath(200, 6, 18));
                handEl = $('.mn-hand', svg);

                const all = options();
                const projects = all.filter((o) => o.dataset.option === 'project');
                const diss = all.filter((o) => o.dataset.option === 'dissertation');
                projects.forEach((o, k) => { o._hour = 6 + 12 * (k + 0.5) / projects.length; });
                diss.forEach((o, k) => { o._hour = 18 + 12 * (k + 0.5) / diss.length; });

                const title = `${cap(count(projects.length, 'project'))}, ${count(diss.length, 'dissertation')}`;
                $('#menuTitle').textContent = title;
                scene.dataset.title = title;
                const dissTitle = $('#dissTitle');
                if (dissTitle) {
                    dissTitle.textContent = cap(count(diss.length, 'dissertation'));
                    dissTitle.closest('.scene').dataset.title = dissTitle.textContent;
                }

                const marks = $('.mn-marks', svg);
                const list = $('#menuOptions');
                projects.concat(diss).forEach((o) => {
                    const h = o._hour;
                    const cat = o.dataset.cat;
                    const [dx, dy] = polar(200, h);
                    const [sx, sy] = polar(228, h);
                    const spoke = svgEl('line', { x1: f1(dx), y1: f1(dy), x2: f1(sx), y2: f1(sy), class: 'mn-spoke', 'data-cat': cat }, marks);
                    const dot = svgEl('circle', { cx: f1(dx), cy: f1(dy), r: 7, class: 'mn-dot', 'data-cat': cat }, marks);

                    const a = h / 24 * TAU - Math.PI / 2;
                    const [px, py] = polar(232, h);
                    const c = Math.cos(a), s = Math.sin(a);
                    let anchor;
                    if (c > 0.3) anchor = 'translate(0.2rem, -50%)';
                    else if (c < -0.3) anchor = 'translate(calc(-100% - 0.2rem), -50%)';
                    else if (s < 0) anchor = 'translate(-50%, calc(-100% - 0.2rem))';
                    else anchor = 'translate(-50%, 0.2rem)';
                    const li = document.createElement('li');
                    li.style.setProperty('--x', (50 + px / 520 * 100).toFixed(2) + '%');
                    li.style.setProperty('--y', (50 + py / 520 * 100).toFixed(2) + '%');
                    li.style.setProperty('--anchor', anchor);
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'menu-opt';
                    b.dataset.cat = cat;
                    b.textContent = o.dataset.short || o.dataset.title;
                    b.addEventListener('click', () => openOption(o));
                    li.appendChild(b);
                    list.appendChild(li);
                    items.push({ hour: h, btn: b, dot, spoke });
                });
            },
            enter(scene) {
                handHour = 6; target = 6;
                if (reduced()) { handHour = target = 30; }
                snap(scene, render);
            },
            step(scene, n) {
                if (reduced()) { handHour = target = 30; render(); return; }
                target = n >= 2 ? 30 : n >= 1 ? 18 : 6;
            },
            frame(dt) {
                if (handHour === target) return;
                const dir = Math.sign(target - handHour);
                handHour += dir * Math.min(Math.abs(target - handHour), dt * 8.5);
                render();
            },
        });
    })();

    /* ═══ 3 · Genome zoom: chromosomes → one gene → one letter ═══ */
    (function () {
        // [name, length in Mb, centromere position as a fraction from the p-arm end] (GRCh38, rounded)
        const CHR = [
            ['1', 248.9, 0.496], ['2', 242.2, 0.388], ['3', 198.3, 0.458], ['4', 190.2, 0.263],
            ['5', 181.5, 0.269], ['6', 170.8, 0.350], ['7', 159.3, 0.377], ['8', 145.1, 0.311],
            ['9', 138.4, 0.311], ['10', 133.8, 0.297], ['11', 135.1, 0.395], ['12', 133.3, 0.266],
            ['13', 114.4, 0.155], ['14', 107.0, 0.161], ['15', 102.0, 0.186], ['16', 90.3, 0.408],
            ['17', 83.3, 0.301], ['18', 80.4, 0.230], ['19', 58.6, 0.447], ['20', 64.4, 0.436],
            ['21', 46.7, 0.257], ['22', 50.8, 0.295], ['X', 156.0, 0.388], ['Y', 57.2, 0.182],
        ];
        const W = 20;
        const PX_PER_MB = 196 / 249;
        const ZOOM = { x: 96, y: 34, h: 448 };
        const SEQ = 'GCTGAAGCGCATCCGGAAGT';
        const VARIANT = 9;
        let scene = null, chrs = [], focus = null, labels = null, marker = null, scan = null, bases = [], scanT = -1;

        function chrPath(h, c) {
            const r = W / 2, n = W * 0.2, d = 5;
            return `M${-r} ${r} A${r} ${r} 0 0 1 ${r} ${r} L${r} ${c - d} Q${n} ${c} ${r} ${c + d} ` +
                   `L${r} ${h - r} A${r} ${r} 0 0 1 ${-r} ${h - r} L${-r} ${c + d} Q${-n} ${c} ${-r} ${c - d} Z`;
        }
        function setVariant(on) {
            const v = bases[VARIANT];
            v.g.classList.toggle('is-variant', on);
            v.t.textContent = on ? 'T' : v.ch;
        }
        function apply(n) {
            const zoomed = n >= 1;
            chrs.forEach((c) => {
                c.grp.classList.toggle('is-dim', zoomed && c !== focus);
                c.grp.classList.toggle('is-focus', zoomed && c === focus);
            });
            const s = ZOOM.h / focus.h;
            focus.grp.style.transform = zoomed
                ? `translate(${ZOOM.x}px, ${ZOOM.y}px) scale(${s.toFixed(3)})`
                : `translate(${focus.x}px, ${focus.y}px)`;
            labels.style.opacity = zoomed ? '0' : '1';
            marker.style.opacity = zoomed ? '1' : '0';
            if (n >= 3) {
                if (reduced()) { scanT = 1; placeScan(1); setVariant(true); }
                else if (scanT < 0) { scanT = 0; setVariant(false); }
            } else { scanT = -1; setVariant(false); placeScan(0); }
        }
        function placeScan(t) {
            const x = 290 + t * (VARIANT + 0.5) * 25;
            scan.setAttribute('transform', `translate(${f1(x)} 0)`);
            scan.style.opacity = t >= 1 ? '0' : '0.8';
        }

        Deck.register('genomic-medicine', {
            init(s) {
                scene = s;
                const svg = $('.gm-svg', scene);
                const karyo = $('.gm-karyo', svg);
                labels = svgEl('g', { class: 'gm-labels' }, karyo);
                labels.style.transition = 'opacity .6s';
                CHR.forEach(([name, mb, cen], i) => {
                    const row = i < 12 ? 0 : 1;
                    const col = row ? i - 12 : i;
                    const x = 62 + col * 63;
                    const y = row ? 296 : 26;
                    const h = mb * PX_PER_MB;
                    const c = Math.min(Math.max(cen * h, W / 2 + 7), h - W / 2 - 7);
                    const grp = svgEl('g', { class: 'gm-chr' }, karyo);
                    grp.style.transform = `translate(${x}px, ${y}px)`;
                    svgEl('path', { d: chrPath(h, c), class: 'gm-chr-body', 'vector-effect': 'non-scaling-stroke' }, grp);
                    svgEl('text', { x, y: f1(y + h + 20), class: 'gm-chr-label' }, labels).textContent = name;
                    chrs.push({ name, grp, x, y, h });
                });
                focus = chrs[2];
                const markY = 0.195 * focus.h;            // short arm, about where 3p22 sits
                marker = svgEl('rect', { x: -W / 2 - 5, y: f1(markY - 1.6), width: W + 10, height: 3.2, rx: 1.6, class: 'gm-marker' }, focus.grp);
                marker.style.opacity = '0';
                marker.style.transition = 'opacity .6s .6s';

                const s2 = ZOOM.h / focus.h;
                const mx = ZOOM.x + (W / 2 + 5) * s2;
                const my = ZOOM.y + markY * s2;
                $('.gm-zoom1', svg).setAttribute('points', `${f1(mx)},${f1(my - 5)} 290,136 290,164 ${f1(mx)},${f1(my + 5)}`);

                const r = rng(5);
                const exons = [];
                let cur = 0;
                for (let i = 0; i < 11; i++) {
                    const w = 12 + r() * 26;
                    exons.push([cur, w]);
                    cur += w + 16 + r() * 30;
                }
                const scale = 490 / (cur - 16);
                const ex = $('.gm-exons', svg);
                exons.forEach(([x0, w], i) => {
                    svgEl('rect', { x: f1(296 + x0 * scale), y: 138, width: f1(w * scale), height: 24, rx: 3, class: 'gm-exon' + (i === 6 ? ' is-target' : '') }, ex);
                });
                const tx = 296 + exons[6][0] * scale;
                const tw = exons[6][1] * scale;
                $('.gm-zoom2', svg).setAttribute('points', `${f1(tx)},162 ${f1(tx + tw)},162 790,302 290,302`);

                const baseLayer = $('.gm-bases', svg);
                [...SEQ].forEach((ch, i) => {
                    const g = svgEl('g', { class: 'gm-base' }, baseLayer);
                    svgEl('rect', { x: 291.5 + i * 25, y: 304, width: 22, height: 56, rx: 4 }, g);
                    const t = svgEl('text', { x: 302.5 + i * 25, y: 341 }, g);
                    t.textContent = ch;
                    bases.push({ g, t, ch });
                });
                scan = $('.gm-scan', svg);
            },
            enter(s, opts) { scanT = -1; snap(scene, () => apply(opts.step)); },
            step(s, n) { apply(n); },
            frame(dt) {
                if (scanT < 0 || scanT >= 1) return;
                scanT = Math.min(1, scanT + dt / 1.3);
                const eased = 1 - Math.pow(1 - scanT, 2);
                placeScan(eased);
                if (scanT >= 1) setVariant(true);
            },
        });
    })();

    /* ═══ 4 · Solve a patient: the variant funnel ═══ */
    (function () {
        // How many dots drop out after each stage; the last one is the diagnosis
        const DROP = [300, 84, 30, 5, 1];
        const BANDS = [[26, 326], [120, 330], [208, 333], [286, 338]];
        const SOLVED = [1, 4, 8];
        const NEXT = 6;
        let scene = null, dots = [], people = [], stages = [], glow = null, tally = null;

        const halfWidth = (y) => (y <= 336 ? 210 - 178 * (y - 14) / 322 : 32);
        function sampleIn(r, y0, y1) {
            for (let tries = 0; tries < 300; tries++) {
                const y = y0 + r() * (y1 - y0);
                const x = 230 + (r() * 2 - 1) * 210;
                if (Math.abs(x - 230) <= halfWidth(y) - 8) return [x, y];
            }
            return [230, (y0 + y1) / 2];
        }
        function apply(n) {
            dots.forEach((d) => {
                const visible = d.level >= n;
                const p = d.pos[Math.min(n, d.pos.length - 1)];
                d.c.style.transform = `translate(${f1(p[0])}px, ${f1(p[1] + (visible ? 0 : 18))}px)`;
                d.c.classList.toggle('is-out', !visible);
                d.c.classList.toggle('is-one', n >= 4 && d.level === 4);
            });
            stages.forEach((li, k) => {
                li.classList.toggle('is-now', k === n);
                li.classList.toggle('is-done', k < n);
            });
            glow.classList.toggle('is-on', n >= 4);
            people[NEXT].classList.toggle('is-new', n >= 4);
            tally.textContent = n >= 4 ? String(SOLVED.length + 1) : String(SOLVED.length);
        }

        Deck.register('solve', {
            init(s) {
                scene = s;
                const pg = $('.fn-people', scene);
                for (let i = 0; i < 10; i++) {
                    const x = 26 + i * 52;
                    const g = svgEl('g', { class: 'fn-person' + (SOLVED.includes(i) ? ' is-solved' : '') }, pg);
                    svgEl('circle', { cx: x, cy: 24, r: 11, class: 'fn-shape' }, g);
                    svgEl('path', { d: `M${x - 19} 78 C${x - 19} 42 ${x + 19} 42 ${x + 19} 78 Z`, class: 'fn-shape' }, g);
                    const badge = svgEl('g', { class: 'fn-badge' }, g);
                    svgEl('circle', { cx: x + 15, cy: 13, r: 9 }, badge);
                    svgEl('path', { d: `M${x + 10.5} 13.5 l3 3 l6 -6.5` }, badge);
                    people.push(g);
                }
                tally = $('.fn-tally .n', scene);
                stages = $$('.fn-stages li', scene);
                glow = $('.fn-glow', scene);

                const r = rng(42);
                const levels = [];
                DROP.forEach((count, level) => { for (let k = 0; k < count; k++) levels.push(level); });
                for (let i = levels.length - 1; i > 0; i--) {          // shuffle
                    const j = Math.floor(r() * (i + 1));
                    [levels[i], levels[j]] = [levels[j], levels[i]];
                }
                const field = $('.fn-field', scene);
                levels.forEach((level) => {
                    const final = level === 4;
                    const c = svgEl('circle', { cx: 0, cy: 0, r: final ? 7 : 4, class: 'fn-dot' }, field);
                    c.style.opacity = final ? '1' : (0.5 + r() * 0.45).toFixed(2);
                    const pos = [];
                    for (let st = 0; st <= Math.min(level, 3); st++) pos.push(sampleIn(r, BANDS[st][0], BANDS[st][1]));
                    if (final) pos.push([230, 372]);
                    dots.push({ c, level, pos });
                });
                // the final dot sits on top
                const last = dots.find((d) => d.level === 4);
                field.appendChild(last.c);
            },
            enter(s, opts) { snap(scene, () => apply(opts.step)); },
            step(s, n) { apply(n); },
        });
    })();

    /* ═══ 5 · Chronomic medicine: a draggable day ═══ */
    (function () {
        // Typical times for a day-active adult (see the Sources panel on this screen)
        const EVENTS = [
            { h: 4.5, label: ['Body temperature', 'at its lowest'] },
            { h: 8, label: ['Cortisol', 'peaks'] },
            { h: 9, label: ['Heart attacks', 'most common'], r: 304 },
            { h: 18, label: ['Body temperature', 'at its highest'] },
            { h: 21, label: ['Melatonin', 'starts to rise'] },
        ];
        let svg = null, hand = null, knob = null, hit = null, timeText = null, sun = null, moon = null;
        const bars = [];
        const events = [];
        let hour = 6;
        let dragging = false;
        let resumeAt = 0;

        function render() {
            const h = wrap24(hour);
            const rot = `rotate(${(h * 15).toFixed(2)})`;
            hand.setAttribute('transform', rot);
            knob.setAttribute('transform', rot);
            hit.setAttribute('transform', rot);
            timeText.textContent = hhmm(h);
            knob.setAttribute('aria-valuenow', h.toFixed(2));
            knob.setAttribute('aria-valuetext', hhmm(h));
            for (const b of bars) {
                const d = hourDiff(h, b.peak);
                const g = Math.pow((1 + Math.cos(d / 24 * TAU)) / 2, 9) * b.amp;
                const [x1, y1] = polar(106, b.peak);
                const [x2, y2] = polar(112 + 8 + 70 * g, b.peak);
                b.line.setAttribute('x1', f1(x1)); b.line.setAttribute('y1', f1(y1));
                b.line.setAttribute('x2', f1(x2)); b.line.setAttribute('y2', f1(y2));
                b.line.setAttribute('stroke-opacity', (0.22 + 0.78 * g).toFixed(2));
            }
            for (const ev of events) ev.g.classList.toggle('is-near', Math.abs(hourDiff(h, ev.h)) < 1.2);
            const day = h >= 6 && h < 20;
            sun.style.opacity = day ? '1' : '0';
            moon.style.opacity = day ? '0' : '1';
        }
        function hourFromPointer(e) {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const p = pt.matrixTransform(svg.getScreenCTM().inverse());
            let ang = Math.atan2(p.x, -p.y);
            if (ang < 0) ang += TAU;
            return ang / TAU * 24;
        }

        Deck.register('chronomic', {
            init(scene) {
                svg = $('.cd-svg', scene);
                hand = $('.cd-hand', svg);
                knob = $('.cd-knob', svg);
                timeText = $('.cd-time', svg);
                sun = $('.cd-sun', svg);
                moon = $('.cd-moon', svg);
                hit = svgEl('circle', { r: 46, cy: -250, class: 'cd-hit', fill: 'transparent' });
                svg.insertBefore(hit, knob);

                const ticks = $('.cd-ticks', svg);
                for (let i = 0; i < 24; i++) {
                    const major = i % 6 === 0;
                    const [x1, y1] = polar(major ? 236 : 242, i);
                    const [x2, y2] = polar(250, i);
                    svgEl('line', { x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2), class: 'cd-tick' + (major ? ' is-major' : '') }, ticks);
                }
                $('.cd-night', svg).setAttribute('d', arcPath(266, 20, 6));
                $('.cd-day', svg).setAttribute('d', arcPath(266, 6, 20));

                const r = rng(9);
                const barLayer = $('.cd-bars', svg);
                for (let j = 0; j < 48; j++) {
                    bars.push({
                        peak: wrap24((j + 0.5) / 2 + (r() - 0.5) * 0.35),
                        amp: 0.55 + r() * 0.45,
                        line: svgEl('line', { class: 'cd-bar' }, barLayer),
                    });
                }
                const evLayer = $('.cd-events', svg);
                EVENTS.forEach((ev) => {
                    const g = svgEl('g', { class: 'cd-event' }, evLayer);
                    const [dx, dy] = polar(266, ev.h);
                    svgEl('circle', { cx: f1(dx), cy: f1(dy), r: 7, class: 'cd-event-dot' }, g);
                    const [tx, ty] = polar(ev.r || 290, ev.h);
                    const c = Math.cos(ev.h / 24 * TAU - Math.PI / 2);
                    const anchor = c > 0.25 ? 'start' : c < -0.25 ? 'end' : 'middle';
                    const x = tx + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0);
                    const text = svgEl('text', { x: f1(x), y: f1(ty - 14), 'text-anchor': anchor }, g);
                    [hhmm(ev.h)].concat(ev.label).forEach((line, i) => {
                        const ts = svgEl('tspan', { x: f1(x), dy: i === 0 ? '0' : '21' }, text);
                        if (i === 0) ts.setAttribute('class', 't');
                        ts.textContent = line;
                    });
                    events.push({ h: ev.h, g });
                });

                svg.addEventListener('pointerdown', (e) => {
                    if (e.pointerType !== 'mouse' && !e.target.closest('.cd-hit, .cd-knob')) return;
                    dragging = true;
                    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
                    svg.classList.add('is-dragging');
                    hour = hourFromPointer(e);
                    render();
                    e.preventDefault();
                });
                svg.addEventListener('pointermove', (e) => {
                    if (!dragging) return;
                    hour = hourFromPointer(e);
                    render();
                });
                const end = () => {
                    if (!dragging) return;
                    dragging = false;
                    svg.classList.remove('is-dragging');
                    resumeAt = performance.now() + 2600;
                    knob.blur();
                };
                svg.addEventListener('pointerup', end);
                svg.addEventListener('pointercancel', end);
                knob.addEventListener('keydown', (e) => {
                    const delta = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key];
                    if (delta === undefined) return;
                    hour = wrap24(hour + delta);
                    resumeAt = performance.now() + 5000;
                    render();
                    e.preventDefault();
                    e.stopPropagation();
                });
                render();
            },
            enter() { hour = 6; dragging = false; resumeAt = performance.now() + 900; render(); },
            frame(dt, t) {
                if (dragging || reduced() || performance.now() < resumeAt) return;
                hour += dt * 1.15;
                render();
            },
        });
    })();

    /* ═══ 6 · Missing heritability: larks, owls and modifiers ═══ */
    (function () {
        let scene = null;
        const hist = [];
        const tiles = [];
        const pairBits = { fills: [], clockVars: [] };
        let scan = null;
        let scanX = -1;
        let clock = 0;

        function showHistogram(animate) {
            hist.forEach((d) => {
                d.c.style.transitionDelay = animate ? `${d.i * 28 + d.k * 34}ms` : '0ms';
                d.c.classList.toggle('is-up', false);
            });
        }
        function hideHistogram() {
            snap(scene, () => hist.forEach((d) => d.c.classList.add('is-up')));
        }
        function showPair(animate) {
            pairBits.fills.forEach((f) => {
                f.el.style.transitionDelay = animate ? '250ms' : '0ms';
                f.el.style.transform = `scaleX(${f.value})`;
            });
            pairBits.clockVars.forEach((c, i) => {
                c.style.transitionDelay = animate ? `${1100 + i * 160}ms` : '0ms';
                c.style.opacity = '1';
                c.style.transform = 'scale(1)';
            });
        }
        function hidePair() {
            snap(scene, () => {
                pairBits.fills.forEach((f) => { f.el.style.transform = 'scaleX(0)'; });
                pairBits.clockVars.forEach((c) => { c.style.opacity = '0'; c.style.transform = 'scale(0.2)'; });
            });
        }
        function startScan() {
            tiles.forEach((t) => { t.on = false; t.el.classList.remove('is-rhythmic'); t.el.style.fillOpacity = ''; });
            scanX = reduced() ? 999 : 0;
        }
        function applyStep(n, animate) {
            if (n === 0) showHistogram(animate); else hideHistogram();
            if (n === 1) showPair(animate); else hidePair();
            if (n === 2) startScan(); else scanX = -1;
        }

        Deck.register('heritability', {
            init(s) {
                scene = s;
                const svg = $('.hr-svg', scene);
                // Chronotype histogram
                const hg = $('.hr-hist', svg);
                const cols = 17;
                for (let i = 0; i < cols; i++) {
                    const z = (i - 8) / 3.1;
                    const n = Math.round(13.5 * Math.exp(-z * z / 2));
                    for (let k = 0; k < n; k++) {
                        const c = svgEl('circle', { cx: 80 + i * 40, cy: 408 - k * 20.5, r: 8.5, class: 'hr-dot is-up', fill: mixHex('#e8c36e', '#b8a2ff', i / (cols - 1)) }, hg);
                        hist.push({ c, i, k });
                    }
                }

                // Two patients, same variant
                const pg = $('.hr-pair', svg);
                const people = [
                    { cx: 210, sev: 0.24, word: 'Mild', clock: [0.14, 0.7], icon: 'sun' },
                    { cx: 590, sev: 0.86, word: 'Severe', clock: [0.24, 0.58, 0.88], icon: 'moon' },
                ];
                people.forEach((p) => {
                    const g = svgEl('g', {}, pg);
                    svgEl('text', { x: p.cx - 100, y: 42, class: 'hr-text-muted' }, g).textContent = 'Severity';
                    svgEl('text', { x: p.cx + 100, y: 42, class: 'hr-text', 'text-anchor': 'end' }, g).textContent = p.word;
                    svgEl('rect', { x: p.cx - 100, y: 54, width: 200, height: 14, rx: 7, class: 'hr-sev-track' }, g);
                    const fill = svgEl('rect', { x: p.cx - 100, y: 54, width: 200, height: 14, rx: 7, class: 'hr-sev-fill' }, g);
                    fill.style.transform = 'scaleX(0)';
                    pairBits.fills.push({ el: fill, value: p.sev });
                    const person = svgEl('g', { class: 'hr-person' }, g);
                    svgEl('circle', { cx: p.cx, cy: 142, r: 28 }, person);
                    svgEl('path', { d: `M${p.cx - 52} 262 C${p.cx - 52} 172 ${p.cx + 52} 172 ${p.cx + 52} 262 Z` }, person);
                    if (p.icon === 'sun') svgEl('circle', { cx: p.cx + 52, cy: 112, r: 10, class: 'hr-sun' }, g);
                    else svgEl('path', { d: `M${p.cx + 48} 100 a13 13 0 1 0 12 18 a10 10 0 1 1 -12 -18 z`, class: 'hr-moon' }, g);
                    svgEl('rect', { x: p.cx - 150, y: 300, width: 300, height: 26, rx: 13, class: 'hr-chrom' }, g);
                    svgEl('rect', { x: p.cx - 150 + 0.42 * 300 - 3.5, y: 294, width: 7, height: 38, rx: 3.5, class: 'hr-var' }, g);
                    p.clock.forEach((f) => {
                        const c = svgEl('circle', { cx: p.cx - 150 + f * 300, cy: 313, r: 7.5, class: 'hr-clockvar' }, g);
                        c.style.transformBox = 'fill-box';
                        c.style.transformOrigin = 'center';
                        c.style.transition = 'opacity .5s, transform .6s cubic-bezier(.16,1,.3,1)';
                        c.style.opacity = '0';
                        c.style.transform = 'scale(0.2)';
                        pairBits.clockVars.push(c);
                    });
                    svgEl('text', { x: p.cx, y: 360, class: 'hr-text-muted', 'text-anchor': 'middle' }, g).textContent =
                        p.icon === 'sun' ? 'a morning lark' : 'a night owl';
                });

                // Gene panel tiles
                const tg = $('.hr-tiles', svg);
                const r = rng(31);
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 8; col++) {
                        const el = svgEl('rect', { x: 40 + col * 46, y: 66 + row * 46, width: 36, height: 36, rx: 6, class: 'hr-tile' }, tg);
                        tiles.push({ el, col, rhythmic: r() < 0.42, phase: r() * TAU, on: false });
                    }
                }
                scan = svgEl('rect', { x: 0, y: 58, width: 46, height: 238, rx: 6, class: 'hr-scan' }, tg);
                scan.style.opacity = '0';
            },
            enter(s, opts) { applyStep(opts.step, true); },
            step(s, n) { applyStep(n, true); },
            leave() { scanX = -1; },
            frame(dt) {
                clock += dt;
                if (scanX >= 0) {
                    if (scanX < 999) {
                        scanX += dt * 190;
                        scan.setAttribute('x', f1(36 + Math.min(scanX, 368)));
                        scan.style.opacity = scanX < 368 ? '1' : '0';
                    }
                    for (const t of tiles) {
                        if (!t.on && t.rhythmic && 40 + t.col * 46 + 18 < 36 + scanX) {
                            t.on = true;
                            t.el.classList.add('is-rhythmic');
                        }
                        if (t.on) {
                            const v = reduced() ? 0.65 : 0.2 + 0.75 * (1 + Math.sin(clock * TAU / 2.6 + t.phase)) / 2;
                            t.el.style.fillOpacity = v.toFixed(2);
                        }
                    }
                }
            },
        });
    })();

    /* ═══ 7 · Human cell clock: desynchronised cells, one pulse, synchrony ═══ */
    (function () {
        const CX = 225, CY = 250, R_DISH = 188;
        const PLOT = { x: 478, y: 88, w: 322, h: 250, span: 96 };
        const SIM_SPEED = 3;           // simulated hours per second
        let scene = null, cells = [], samples = [], simT = 0, pulseAt = null, rippleStart = -1, nextSample = 0;
        let trace = null, ripple = null, mark = null, markLabel = null, clockText = null, clockSub = null, btnLabel = null, caption = null;
        const gridLines = [];
        let userStarted = false;
        const r = rng(77);

        function desync() {
            simT = 0; pulseAt = null; rippleStart = -1; samples = []; nextSample = 0;
            // Spread phases evenly (in a random order) so that, out of step, the average really is flat
            const order = cells.map((c, i) => i);
            for (let i = order.length - 1; i > 0; i--) {
                const j = Math.floor(r() * (i + 1));
                [order[i], order[j]] = [order[j], order[i]];
            }
            cells.forEach((c, i) => { c.phi = TAU * (order[i] + r()) / cells.length; c.reset = false; });
            btnLabel.textContent = 'Add a hormone pulse';
            caption.textContent = 'Out of step, the cells’ rhythms cancel out.';
        }
        function pulse() {
            if (pulseAt !== null) return;
            pulseAt = simT;
            rippleStart = performance.now();
            cells.forEach((c) => { c.reset = false; });
            btnLabel.textContent = 'Start again';
            caption.textContent = 'One pulse and they tick together: now each clock gene can be timed.';
        }
        const levelOf = (c, t) => (1 + Math.cos(c.phi + TAU * t / c.period)) / 2;
        function step(dtSim, rippleR) {
            simT += dtSim;
            if (pulseAt !== null) {
                for (const c of cells) {
                    if (!c.reset && c.dist <= rippleR) {
                        c.reset = true;
                        c.phi = 0.25 * gauss(r) - TAU * simT / c.period;   // peak expression right now
                    }
                }
            }
            while (nextSample <= simT) {
                let m = 0;
                for (const c of cells) m += levelOf(c, nextSample);
                samples.push([nextSample, m / cells.length]);
                nextSample += 0.5;
            }
            const cutoff = simT - PLOT.span - 2;
            while (samples.length && samples[0][0] < cutoff) samples.shift();
        }
        function draw() {
            for (const c of cells) {
                const v = levelOf(c, simT);
                c.el.setAttribute('fill-opacity', (0.1 + 0.85 * v).toFixed(2));
            }
            const t0 = Math.max(0, simT - PLOT.span);
            const X = (t) => PLOT.x + (t - t0) / PLOT.span * PLOT.w;
            const Y = (v) => PLOT.y + PLOT.h - 22 - v * (PLOT.h - 44);
            let d = '';
            samples.forEach(([t, v], i) => {
                if (t < t0) return;
                d += (d ? 'L' : 'M') + f1(X(t)) + ' ' + f1(Y(v));
            });
            trace.setAttribute('d', d);
            const firstGrid = Math.ceil(t0 / 24) * 24;
            gridLines.forEach((ln, i) => {
                const t = firstGrid + i * 24;
                const on = t <= t0 + PLOT.span;
                ln.setAttribute('x1', f1(X(t))); ln.setAttribute('x2', f1(X(t)));
                ln.style.opacity = on ? '1' : '0';
            });
            if (pulseAt !== null && pulseAt >= t0) {
                const x = f1(X(pulseAt));
                mark.setAttribute('x1', x); mark.setAttribute('x2', x);
                mark.setAttribute('opacity', '1');
                markLabel.setAttribute('x', f1(X(pulseAt) + 6));
                markLabel.setAttribute('opacity', '1');
            } else {
                mark.setAttribute('opacity', '0');
                markLabel.setAttribute('opacity', '0');
            }
            if (pulseAt === null) {
                clockText.textContent = `${Math.floor(simT)} h`;
                clockSub.textContent = 'in culture';
            } else {
                clockText.textContent = `${Math.floor(simT - pulseAt)} h`;
                clockSub.textContent = 'after the pulse';
            }
        }
        function staticResult() {
            desync();
            step(18, 0);
            pulse();
            step(0.001, 999);
            for (let i = 0; i < 140; i++) step(0.5, 999);
            ripple.style.opacity = '0';
            draw();
        }

        Deck.register('cells', {
            init(s) {
                scene = s;
                const svg = $('.cl-svg', scene);
                trace = $('.cl-trace', svg);
                ripple = $('.cl-ripple', svg);
                mark = $('.cl-pulse-mark', svg);
                markLabel = $('.cl-pulse-label', svg);
                clockText = $('.cl-clock', svg);
                clockSub = $('.cl-clock-sub', svg);
                btnLabel = $('#pulseBtn span');
                caption = $('#cellCaption');
                $('.cl-axis-label[text-anchor="end"]', svg).textContent = 'grid lines every 24 h';

                const grid = $('.cl-grid', svg);
                for (let i = 0; i < 5; i++) gridLines.push(svgEl('line', { y1: PLOT.y + 4, y2: PLOT.y + PLOT.h - 4, class: 'cl-gridline' }, grid));

                const layer = $('.cl-cells', svg);
                const placed = [];
                const pr = rng(12);
                let guard = 0;
                while (placed.length < 62 && guard++ < 6000) {
                    const a = pr() * TAU, rad = Math.sqrt(pr()) * (R_DISH - 22);
                    const x = CX + rad * Math.cos(a), y = CY + rad * Math.sin(a);
                    if (placed.every(([px, py]) => (px - x) ** 2 + (py - y) ** 2 > 35 * 35)) placed.push([x, y]);
                }
                placed.forEach(([x, y]) => {
                    const g = svgEl('g', { transform: `translate(${f1(x)} ${f1(y)}) rotate(${Math.round(pr() * 180)})` }, layer);
                    const el = svgEl('ellipse', { rx: f1(12.5 + pr() * 4.5), ry: f1(9 + pr() * 3.5), class: 'cl-cell', fill: '#5ed6c0' }, g);
                    svgEl('circle', { r: 4.2, cx: f1((pr() - 0.5) * 4), class: 'cl-nucleus' }, g);
                    cells.push({ el, dist: Math.hypot(x - CX, y - CY), period: 24 + 1.1 * gauss(pr), phi: 0, reset: false });
                });

                $('#pulseBtn').addEventListener('click', () => {
                    userStarted = true;
                    if (pulseAt === null) pulse();
                    else { desync(); draw(); }
                });
                desync();
                draw();
            },
            enter() {
                userStarted = false;
                if (reduced()) { staticResult(); return; }
                desync();
                for (let i = 0; i < 16; i++) step(0.5, 0);   // a little pre-history so the trace isn’t empty
                draw();
            },
            step(s, n) { if (n >= 1 && pulseAt === null) pulse(); },
            frame(dt) {
                if (reduced() && !userStarted) return;
                let rippleR = 0;
                if (rippleStart >= 0) {
                    const p = (performance.now() - rippleStart) / 950;
                    rippleR = Math.min(1, p) * (R_DISH + 10);
                    ripple.setAttribute('r', f1(Math.max(1, rippleR)));
                    ripple.style.opacity = p < 1 ? String(0.9 * (1 - p)) : '0';
                    if (p >= 1.2) rippleStart = -1;
                } else if (pulseAt !== null) rippleR = 999;
                step(dt * SIM_SPEED, rippleR);
                draw();
            },
        });
    })();

    /* ═══ 8 · Native Workbench: pipeline, run record, benchmark ═══ */
    (function () {
        const NODES = ['Sequencing reads', 'Quality control', 'Alignment', 'Variant calling'];
        const LOG = [
            ['▸', 'run started: input reads loaded'],
            ['✓', 'quality control: tool, version and settings recorded'],
            ['✓', 'alignment: reference genome and parameters recorded'],
            ['✓', 'variant calling: output files checksummed'],
            ['✓', 'run record saved: rerun it anywhere for the same result'],
        ];
        const CYCLE = 14;
        let t = 0;
        const nodes = [], packets = [], lines = [];
        let fills = [], match = null, pillars = [];

        function render() {
            packets.forEach((p, k) => {
                const u = ((t * 0.16) + k / packets.length) % 1;
                const x = 205 + u * 520;
                p.setAttribute('cx', f1(x));
            });
            nodes.forEach((n, i) => {
                const busy = packets.some((p) => {
                    const x = +p.getAttribute('cx');
                    return x > n.x - 6 && x < n.x + n.w + 6;
                });
                n.g.classList.toggle('is-busy', busy);
            });
            lines.forEach((ln, i) => ln.classList.toggle('is-shown', t > 0.6 + i * 1.25));
            const pw = Math.min(1, Math.max(0, (t - 6.6) / 2.9));
            const pl = Math.min(1, Math.max(0, (t - 6.6) / 2.75));
            fills[0].style.transform = `scaleX(${pw.toFixed(3)})`;
            fills[1].style.transform = `scaleX(${pl.toFixed(3)})`;
            match.classList.toggle('is-shown', t > 9.8);
            pillars.forEach((li, i) => li.classList.toggle('is-lit', t > 10.2 + i * 0.55));
        }

        Deck.register('workbench', {
            init(scene) {
                const svg = $('.wb-svg', scene);
                const linkLayer = $('.wb-links', svg);
                const nodeLayer = $('.wb-nodes', svg);
                const packetLayer = $('.wb-packets', svg);
                svg.insertBefore(packetLayer, nodeLayer);          // packets pass behind the nodes
                const w = 162, gap = 32, x0 = 44, y = 78, h = 62;
                NODES.forEach((label, i) => {
                    const x = x0 + i * (w + gap);
                    const g = svgEl('g', { class: 'wb-node' }, nodeLayer);
                    svgEl('rect', { x, y, width: w, height: h, rx: 10 }, g);
                    const words = label.split(' ');
                    const text = svgEl('text', { x: x + w / 2, y: words.length > 1 ? y + 27 : y + 36 }, g);
                    if (words.length > 1) {
                        svgEl('tspan', { x: x + w / 2, dy: 0 }, text).textContent = words[0];
                        svgEl('tspan', { x: x + w / 2, dy: 19 }, text).textContent = words.slice(1).join(' ');
                    } else text.textContent = label;
                    nodes.push({ g, x, w });
                    if (i > 0) svgEl('line', { x1: x - gap - 2, y1: y + h / 2, x2: x + 2, y2: y + h / 2, class: 'wb-link' }, linkLayer);
                });
                for (let k = 0; k < 5; k++) packets.push(svgEl('circle', { cy: y + h / 2, r: 5.5, class: 'wb-packet' }, packetLayer));

                const logLayer = $('.wb-log', svg);
                LOG.forEach(([mark, msg], i) => {
                    const text = svgEl('text', { x: 64, y: 216 + i * 23, class: 'wb-log-line' }, logLayer);
                    const m = svgEl('tspan', { class: mark === '✓' ? 'ok' : '' }, text);
                    m.textContent = mark + ' ';
                    svgEl('tspan', {}, text).textContent = msg;
                    lines.push(text);
                });
                fills = $$('.wb-bench-fill', svg);
                match = $('.wb-match', svg);
                pillars = $$('.wb-pillars li', scene);
                render();
            },
            enter() { t = reduced() ? 12 : 0; render(); },
            frame(dt) {
                if (reduced()) return;
                t = (t + dt) % CYCLE;
                render();
            },
        });
    })();

    /* ═══ 9 · Dissertations ═══ */
    Deck.register('dissertations', {
        leave() { $$('.ds-card.is-highlight').forEach((c) => c.classList.remove('is-highlight')); },
    });

    /* ═══ 10 · Come and talk to us ═══ */
    let joinClock = null;
    Deck.register('join', {
        init(scene) {
            joinClock = HelixClock($('.helix-clock', scene), { hour: 21, speed: 0.35, seed: 23, phase: 1.3 });
            const ul = $('#joinJump');
            options().forEach((o) => {
                const li = document.createElement('li');
                const b = document.createElement('button');
                b.type = 'button';
                b.dataset.cat = o.dataset.cat;
                b.textContent = o.dataset.short || o.dataset.title;
                b.addEventListener('click', () => openOption(o));
                li.appendChild(b);
                ul.appendChild(li);
            });
        },
        frame(dt) { if (!reduced()) joinClock.frame(dt); },
    });
})();
