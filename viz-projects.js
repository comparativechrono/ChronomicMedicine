/* ═══════════════════════════════════════════
   CHRONOMIC MEDICINE — RESEARCH PROJECT DIAGRAMS

   One interactive diagram per kind of project. A project in
   data/projects.csv picks its diagram with the "visual" column:

     heart-clock     heart rate and QT interval through the day
     conserved-gene  a gene shared by plants, insects, fish and people (UBR4)
     repair          DNA mismatch repair and microsatellites (Lynch syndrome)
     chronotype      morning and evening types meeting an infection
     steroids        the cortisol pathway and CYP21A2
     enrichment      is an overlap between two gene lists bigger than chance?
     dosing          when a drug is taken, and how fast it is cleared
     panels          gene panels and super panels
     gene-clock      genes switching on through the day (used if none is given)

   Each diagram also runs by itself on the homepage carousel (compact mode).
   The words under each diagram are in the v.caption(...) call.
   ═══════════════════════════════════════════ */
(function () {
    'use strict';
    if (!window.Viz) return;
    const Viz = window.Viz;

    /* ─── Shared drawing helpers ─── */
    function face(v, g, cx, cy, r, o) {
        o = o || {};
        v.s('circle', { cx, cy, r, class: 'v-face' }, g);
        if (o.dayNight) {
            v.s('path', { d: v.arc(r + o.dayNight, 6, 20, cx, cy), class: 'v-day' }, g);
            v.s('path', { d: v.arc(r + o.dayNight, 20, 6, cx, cy), class: 'v-night' }, g);
        }
        if (o.ticks !== false) {
            for (let i = 0; i < 24; i++) {
                const major = i % 6 === 0;
                const [x1, y1] = v.polar(r - (major ? 11 : 7), i, cx, cy);
                const [x2, y2] = v.polar(r - 2, i, cx, cy);
                v.s('line', { x1: v.f1(x1), y1: v.f1(y1), x2: v.f1(x2), y2: v.f1(y2), class: 'v-tick' + (major ? ' is-major' : '') }, g);
            }
        }
        if (o.labels !== false) {
            [0, 6, 12, 18].forEach((hh) => {
                const [x, y] = v.polar(r - (o.labelInset || 24), hh, cx, cy);
                v.text(g, x, y, String(hh).padStart(2, '0'), { class: 'v-hour' });
            });
        }
    }
    // A clock hand that starts away from the centre, leaving room for a readout
    function hand(v, g, cx, cy, r0, r1, knobR, knobAt) {
        const grp = v.s('g', {}, g);
        v.s('line', { x1: cx, y1: cy - r0, x2: cx, y2: cy - r1, class: 'v-hand' }, grp);
        let knob = null, hit = null;
        if (knobR) {
            hit = v.s('circle', { cx, cy: cy - knobAt, r: Math.max(22, knobR * 2.4), fill: 'transparent' }, grp);
            knob = v.s('circle', { cx, cy: cy - knobAt, r: knobR, class: 'v-knob' }, grp);
        }
        return {
            grp, knob, hit,
            set(hour) { grp.setAttribute('transform', `rotate(${(v.wrap24(hour) * 15).toFixed(2)} ${cx} ${cy})`); },
        };
    }
    function lines(v, parent, x, y, arr, lh, attrs) {
        const t = v.s('text', Object.assign({ x: v.f1(x), y: v.f1(y) }, attrs || {}), parent);
        arr.forEach((str, i) => {
            const ts = v.s('tspan', { x: v.f1(x), dy: i === 0 ? '0' : String(lh) }, t);
            ts.textContent = str;
        });
        return t;
    }
    function setLines(t, arr) {
        const spans = t.querySelectorAll('tspan');
        spans.forEach((sp, i) => { sp.textContent = arr[i] || ''; });
    }
    const gauss = (t, mu, sd, a) => { const z = (t - mu) / sd; return a * Math.exp(-0.5 * z * z); };
    // One heartbeat (P wave, QRS complex, T wave); t in seconds from the start of the beat
    const Q0 = 0.195;
    function ecg(t, qt) {
        const tPeak = Q0 + qt - 0.095;
        return gauss(t, 0.1, 0.022, 0.11) + gauss(t, 0.205, 0.008, -0.09) + gauss(t, 0.225, 0.0095, 1)
             + gauss(t, 0.247, 0.01, -0.24) + gauss(t, tPeak, 0.043, 0.3);
    }
    function beatPath(v, x0, y0, pxPerS, amp, qt, tMax) {
        let d = '';
        for (let t = 0; t <= tMax + 1e-9; t += 0.004) {
            d += (d ? 'L' : 'M') + v.f1(x0 + t * pxPerS) + ' ' + v.f1(y0 - ecg(t, qt) * amp);
        }
        return d;
    }
    function bracket(v, g, cls) {
        const p = v.s('path', { class: cls }, g);
        return {
            set(x0, x1, y) { p.setAttribute('d', `M${v.f1(x0)} ${y - 5} V${y} H${v.f1(x1)} V${y - 5}`); },
        };
    }

    /* ═══ Heart through the day: heart rate and QT interval ═══ */
    Viz.register('heart-clock', function (v) {
        const svg = v.svg(560, 360, 'A 24-hour clock next to a heart trace. Heart rate and the QT interval of each beat change with the time of day.');
        const CX = 150, CY = 180, R = 112;
        const dial = v.s('g', {}, svg);
        face(v, dial, CX, CY, R, { dayNight: 10 });
        v.s('path', { d: v.arc(R + 22, 6.3, 11.7, CX, CY), class: 'hd-risk' }, dial);
        const h = hand(v, dial, CX, CY, 52, R - 16, 9, R);
        const timeT = v.text(svg, CX, CY + 4, '', { class: 'v-num v-mid' });
        v.text(svg, CX, CY + 26, 'time of day', { class: 'v-small v-mid' });
        v.caption('<strong>Drag the hand</strong> to change the time of day. Heart rate and the QT interval, the time the heart’s main chambers take to recharge after each beat, change over 24 hours, and sudden cardiac death is most common in the morning. This project looks for variants in clock genes in people with arrhythmias. Values are typical for a healthy adult.');
        // legend for the morning arc
        v.s('line', { x1: 24, y1: 343, x2: 44, y2: 343, class: 'hd-risk', 'stroke-width': 5 }, svg);
        v.text(svg, 52, 347, 'Sudden cardiac death is most common', { class: 'v-small' });

        // Monitor strip
        const SX = 300, SW = 245, SY = 112, SPEED = 52;
        v.text(svg, SX, 36, 'Heart trace', { class: 'v-title' });
        v.s('rect', { x: SX, y: 48, width: SW, height: 120, rx: 8, class: 'v-panel' }, svg);
        for (let x = SX + 20; x < SX + SW; x += 20) v.s('line', { x1: x, y1: 52, x2: x, y2: 164, class: 'v-grid' }, svg);
        for (let y = 68; y < 168; y += 20) v.s('line', { x1: SX + 4, y1: y, x2: SX + SW - 4, y2: y, class: 'v-grid' }, svg);
        const trace = v.s('path', { class: 'v-ecg' }, svg);
        const cursor = v.s('circle', { r: 2.6, class: 'hd-cursor' }, svg);
        const hrNum = v.text(svg, SX, 204, '', { class: 'v-num-sm' });
        const hrLab = v.text(svg, SX + 40, 204, 'beats per minute', { class: 'v-label' });
        const qtNum = v.text(svg, SX + 168, 204, '', { class: 'v-num-sm hd-qt-label' });
        v.text(svg, SX + 168, 220, 'QT interval', { class: 'v-small' });
        // One beat, with the QT interval marked
        const BX = 300, BY = 300, BPX = 300, BAMP = 52;
        v.text(svg, BX, 238, 'One beat', { class: 'v-title' });
        v.s('line', { x1: BX, y1: BY, x2: BX + 240, y2: BY, class: 'v-faint' }, svg);
        const beat = v.s('path', { class: 'v-ecg' }, svg);
        const qtB = bracket(v, svg, 'hd-qt');
        const qtLab = v.text(svg, 0, BY + 40, 'QT', { class: 'hd-qt-label v-mid' });

        let hour = 8;
        const N = SW - 8;
        const buf = new Float32Array(N);
        let head = 0, carry = 0, phase = 0;

        function sleep(hh) { const d = v.hourDiff(hh, 3); return Math.abs(d) < 8 ? 0.5 * (1 + Math.cos(Math.PI * d / 8)) : 0; }
        function heartRate(hh) { return 66 + 9 * Math.cos(v.TAU * (hh - 15) / 24) - 7 * sleep(hh); }
        function qtAt(hh) { const rr = 60 / heartRate(hh); return (0.405 + 0.008 * sleep(hh)) * Math.sqrt(rr); }
        function sample() {
            const rr = 60 / heartRate(hour);
            phase += 1 / SPEED;
            if (phase >= rr) phase -= rr;
            buf[head] = ecg(phase, qtAt(hour));
            head = (head + 1) % N;
        }
        function fillStatic() { phase = 0; for (let i = 0; i < N; i++) sample(); }
        fillStatic();

        const ctl = v.dial({ svg, cx: CX, cy: CY, knob: h.knob, hit: [h.hit], anywhere: true, label: 'Time of day', get: () => hour, onChange(x) { hour = x; render(); } });

        function drawTrace(gap) {
            let d = '', pen = false;
            for (let i = 0; i < N; i++) {
                const idx = (head + i) % N;
                // leave a short gap just ahead of the newest sample, like a hospital monitor
                if (gap && i < 7) { pen = false; continue; }
                const x = SX + 4 + idx, y = SY - buf[idx] * 46;
                if (idx === 0) pen = false;
                d += (pen ? 'L' : 'M') + x + ' ' + v.f1(y);
                pen = true;
            }
            trace.setAttribute('d', d);
            const last = (head - 1 + N) % N;
            cursor.setAttribute('cx', SX + 4 + last);
            cursor.setAttribute('cy', v.f1(SY - buf[last] * 46));
            cursor.style.opacity = gap ? 1 : 0;
        }
        function render(gap) {
            h.set(hour);
            ctl.update(hour);
            timeT.textContent = v.hhmm(hour);
            const hr = heartRate(hour), qt = qtAt(hour);
            hrNum.textContent = String(Math.round(hr));
            hrLab.setAttribute('x', SX + (hr >= 100 ? 50 : 38));
            qtNum.textContent = (Math.round(qt * 200) * 5) + ' ms';
            beat.setAttribute('d', beatPath(v, BX, BY, BPX, BAMP, qt, 0.78));
            const x0 = BX + Q0 * BPX, x1 = BX + (Q0 + qt) * BPX;
            qtB.set(x0, x1, BY + 22);
            qtLab.setAttribute('x', v.f1((x0 + x1) / 2));
            drawTrace(gap);
        }
        render(false);
        return {
            frame(dt) {
                if (v.auto() && !ctl.dragging) hour = v.wrap24(hour + dt * 1.4);
                carry += dt * SPEED;
                while (carry >= 1) { sample(); carry -= 1; }
                render(true);
            },
            draw() { fillStatic(); render(false); },
        };
    });

    /* ═══ A gene shared across kingdoms (UBR4) and the QT interval ═══ */
    Viz.register('conserved-gene', function (v) {
        const svg = v.svg(560, 360, 'The UBR4 gene in a plant, a fly, a fish and a human, with a heartbeat showing a normal or long QT interval.');
        const SPECIES = [
            { name: 'Arabidopsis', gene: 'BIG', note: ['In this small plant the gene is', 'called BIG. It adjusts the period', 'of the circadian clock.'], gaps: [0.31, 0.62] },
            { name: 'Fruit fly', gene: 'pushover', note: ['In fruit flies the same gene', 'is called pushover.', ''], gaps: [0.18, 0.47, 0.83] },
            { name: 'Zebrafish', gene: 'ubr4', note: ['Zebrafish have ubr4 too, and', 'their hearts keep a daily', 'rhythm of their own.'], gaps: [0.55] },
            { name: 'Human', gene: 'UBR4', note: ['Do variants in human UBR4', 'lengthen the QT interval?', ''], gaps: [0.4] },
        ];
        const ICONS = {
            0: 'M0 15 V-2 M0 4 C-9 1 -12 -7 -7 -12 C-3 -8 -1 -3 0 4 M0 0 C8 -4 12 -10 9 -15 C3 -13 0 -7 0 0 M-11 15 H11',
            1: 'M0 -4 m-4 0 a4 9 0 1 0 8 0 a4 9 0 1 0 -8 0 M0 -13 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M-3 -6 C-14 -14 -16 -3 -4 -1 M3 -6 C14 -14 16 -3 4 -1 M-4 3 L-10 9 M4 3 L10 9',
            2: 'M-15 0 C-9 -9 7 -9 11 0 C7 9 -9 9 -15 0 Z M11 0 L18 -7 L18 7 Z M-8 -2 h0.1',
            3: 'M0 -8 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M-12 15 C-12 3 12 3 12 15',
        };
        const ROW0 = 64, ROWH = 74, BX0 = 84, BX1 = 322;
        const BLOCKS = [0.05, 0.14, 0.26, 0.35, 0.49, 0.58, 0.69, 0.78, 0.9];
        const rows = [];
        const rowsG = v.s('g', {}, svg);
        SPECIES.forEach((sp, i) => {
            const y = ROW0 + i * ROWH;
            const g = v.s('g', { class: 'cg-row', tabindex: '0', role: 'button', 'aria-label': `${sp.name}: ${sp.gene}` }, rowsG);
            v.s('rect', { x: 10, y: y - 32, width: 324, height: 56, rx: 8, class: 'cg-hit' }, g);
            v.s('path', { d: ICONS[i], transform: `translate(38 ${y})`, class: 'cg-icon' }, g);
            const name = v.text(g, BX0, y - 12, '', { class: 'cg-name v-label' });
            const n1 = v.s('tspan', {}, name); n1.textContent = sp.name + '  ';
            const n2 = v.s('tspan', { class: 'v-strong', 'font-style': 'italic' }, name); n2.textContent = sp.gene;
            // protein bar, with small gaps where the sequences differ
            const cuts = [0].concat(sp.gaps, [1]);
            for (let k = 0; k < cuts.length - 1; k++) {
                const a = BX0 + (BX1 - BX0) * cuts[k] + (k ? 3 : 0);
                const b = BX0 + (BX1 - BX0) * cuts[k + 1] - (k < cuts.length - 2 ? 3 : 0);
                v.s('rect', { x: v.f1(a), y: y, width: v.f1(b - a), height: 10, rx: 3, class: 'cg-bar' }, g);
            }
            const blocks = BLOCKS.map((f, k) => v.s('rect', { x: v.f1(BX0 + (BX1 - BX0) * f + ((i * 7 + k * 3) % 3) - 1), y, width: 8, height: 10, rx: 2, class: 'cg-block' }, g));
            const pick = () => { sel = i; v.touch(); render(); v.changed(); };
            g.addEventListener('click', pick);
            g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
            rows.push({ g, blocks });
        });
        const scan = v.s('line', { y1: ROW0 - 22, y2: ROW0 + 3 * ROWH + 18, class: 'v-tone', 'stroke-width': 1.4, opacity: 0.55 }, svg);
        v.text(svg, BX0, ROW0 + 3 * ROWH + 40, 'Matching blocks: parts of the protein shared by all four', { class: 'v-small' });

        // Notes and the heartbeat
        const noteName = v.text(svg, 360, 64, '', { class: 'v-strong', 'font-size': 15 });
        const note = lines(v, svg, 360, 88, ['', '', ''], 18, { class: 'v-label' });
        v.text(svg, 360, 176, 'One heartbeat', { class: 'v-title' });
        const BX = 360, BY = 284, BPX = 228, BAMP = 62;
        v.s('line', { x1: BX, y1: BY, x2: 548, y2: BY, class: 'v-faint' }, svg);
        const beat = v.s('path', { class: 'v-ecg' }, svg);
        const qtB = bracket(v, svg, 'hd-qt');
        const qtLab = v.text(svg, 0, BY + 44, '', { class: 'hd-qt-label v-mid' });

        let sel = 3, qtTarget = 0.4, qt = 0.4, scanX = BX0, tAuto = 0;
        const seg = v.segmented({
            label: 'QT interval', value: 'typical',
            options: [{ value: 'typical', label: 'Typical' }, { value: 'long', label: 'Long QT' }],
            onChange(val) { qtTarget = val === 'long' ? 0.5 : 0.4; },
        });
        v.caption('<em>UBR4</em> is found in plants, insects, fish and people: <strong>select a species</strong>. In Long QT syndrome the heart takes longer to recharge between beats, which can lead to dangerous arrhythmias. This project asks whether variants in <em>UBR4</em> are linked to it.');

        function render() {
            rows.forEach((r, i) => { r.g.classList.toggle('is-on', i === sel); r.g.setAttribute('aria-pressed', String(i === sel)); });
            noteName.textContent = SPECIES[sel].name + ': ' + SPECIES[sel].gene;
            setLines(note, SPECIES[sel].note);
            beat.setAttribute('d', beatPath(v, BX, BY, BPX, BAMP, qt, 0.82));
            const x0 = BX + Q0 * BPX, x1 = BX + (Q0 + qt) * BPX;
            qtB.set(x0, x1, BY + 24);
            qtLab.setAttribute('x', v.f1((x0 + x1) / 2));
            qtLab.textContent = 'QT ' + Math.round(qt * 100) * 10 + ' ms';
            scan.setAttribute('x1', v.f1(scanX)); scan.setAttribute('x2', v.f1(scanX));
            rows.forEach((r) => r.blocks.forEach((b) => {
                const x = +b.getAttribute('x') + 4;
                const near = Math.exp(-Math.pow((x - scanX) / 16, 2));
                b.style.opacity = (0.35 + 0.65 * near).toFixed(2);
            }));
        }
        render();
        return {
            frame(dt, t) {
                scanX += dt * 92;
                if (scanX > BX1 + 40) scanX = BX0 - 20;
                if (v.auto()) {
                    tAuto += dt;
                    if (tAuto > 3.2) {
                        tAuto = 0;
                        sel = (sel + 1) % 4;
                        const val = seg.value === 'long' ? 'typical' : 'long';
                        seg.set(val);
                        qtTarget = val === 'long' ? 0.5 : 0.4;
                    }
                }
                qt += (qtTarget - qt) * Math.min(1, dt * 5);
                render();
            },
            draw() { qt = qtTarget; scanX = BX0 + (BX1 - BX0) * 0.5; render(); },
        };
    });

    /* ═══ Mismatch repair and microsatellites (Lynch syndrome) ═══ */
    Viz.register('repair', function (v) {
        const svg = v.svg(560, 360, 'A cell copying a repeated DNA sequence. Mismatch repair fixes slips; without it the repeat length changes.');
        const r = v.rng(7);
        // Body clock, top left: cells divide in a window of the day
        const DX = 78, DY = 92, DR = 50, DAY = 6;
        const dialG = v.s('g', {}, svg);
        face(v, dialG, DX, DY, DR, { labels: false });
        const windowArc = v.s('path', { d: v.arc(DR + 9, 2, 6, DX, DY), class: 'mr-window' }, dialG);
        const marksG = v.s('g', {}, dialG);
        const dh = hand(v, dialG, DX, DY, 14, DR - 10);
        const cellA = v.s('circle', { cx: DX, cy: DY, r: 8, class: 'mr-cell' }, svg);
        const cellB = v.s('circle', { cx: DX, cy: DY, r: 8, class: 'mr-cell' }, svg);
        v.text(svg, DX, DY + DR + 28, 'Body clock', { class: 'v-small v-mid' });
        const divLab = v.text(svg, DX, DY + DR + 44, 'cell divides', { class: 'v-small v-mid v-tone-text' });

        // The repeat being copied
        const X0 = 192, W = 344, TY = 92, CY2 = 152, UH = 22;
        v.text(svg, X0 - 10, TY + 4, 'Parent', { class: 'v-small v-end' });
        v.text(svg, X0 - 10, CY2 + 4, 'Copy', { class: 'v-small v-end' });
        const makeUnit = () => {
            const g = v.s('g', {}, svg);
            const rect = v.s('rect', { height: UH, rx: 4, class: 'mr-unit' }, g);
            const t = v.text(g, 0, 0, 'CA', { class: 'mr-unit-text' });
            return { g, rect, t };
        };
        const tUnits = Array.from({ length: 16 }, makeUnit);
        const cUnits = Array.from({ length: 16 }, makeUnit);
        const loopPath = v.s('path', { class: 'mr-loop' }, svg);
        const loopUnit = makeUnit();
        const pol = v.s('rect', { height: UH + 12, rx: 8, class: 'mr-pol' }, svg);
        const clampG = v.s('g', {}, svg);
        v.s('rect', { x: -24, y: -12, width: 48, height: 24, rx: 12, class: 'mr-clamp' }, clampG);
        v.text(clampG, 0, 0, 'MMR', { class: 'mr-clamp-text' });
        const result = v.text(svg, X0, 198, '', { class: 'v-label' });

        // Repeat lengths of the most recent copies
        const HX = 238, HY = 326, HS = 42, KEEP = 12;
        v.text(svg, X0, 228, 'Repeats in the last 12 copies', { class: 'v-title' });
        for (let n = 9; n <= 15; n++) v.text(svg, HX + (n - 9) * HS, HY + 24, String(n), { class: 'v-small v-mid' });
        v.s('line', { x1: HX - 22, y1: HY + 8, x2: HX + 6 * HS + 22, y2: HY + 8, class: 'v-faint' }, svg);
        const dots = Array.from({ length: KEEP }, () => v.s('circle', { r: 3.6, class: 'mr-dot' }, svg));

        // L: repeats in the parent; outcome: repeats in the finished copy
        let mode = 'repair', timing = 'step';
        let hour = 22, day = 0, lastDay = -1, phase = 'wait', pt = 0, wait = 1;
        let L = 12, outcome = 12, slip = null, copies = 0, history = [], marks = [];
        const COPY = 2.4, REPAIR = 1.45, SETTLE = 1.1, HOLD = 1.3;

        const segRepair = v.segmented({
            label: 'Mismatch repair', value: 'repair',
            options: [{ value: 'repair', label: 'Working' }, { value: 'lost', label: 'Lost' }],
            onChange(val) { mode = val; restart(); },
        });
        v.segmented({
            label: 'Body clock', value: 'step',
            options: [{ value: 'step', label: 'In step' }, { value: 'disrupted', label: 'Disrupted' }],
            onChange(val) { timing = val; marks = []; },
        });
        v.caption('Each time a cell divides it copies short repeats like CACACA, and the copy can slip. <strong>Mismatch repair</strong> fixes slips. In Lynch syndrome tumours it is lost, so the repeats change length (microsatellite instability). Cell division follows the body clock; this project asks whether a disrupted clock adds to the cancer risk.');

        function restart() { L = 12; outcome = 12; history = []; copies = 0; phase = 'wait'; pt = 0; slip = null; wait = 0.5; }
        function begin() {
            phase = 'copy'; pt = 0;
            slip = { k: 2 + Math.floor(r() * (L - 5)), type: r() < 0.5 ? 'ins' : 'del' };
            marks.push(hour); if (marks.length > 10) marks.shift();
        }
        function finish(len) {
            outcome = len; copies++;
            history.push(len); if (history.length > KEEP) history.shift();
            phase = 'hold'; pt = 0;
        }
        function tick(dt) {
            const before = hour;
            hour = v.wrap24(hour + dt * 24 / DAY);
            if (hour < before) day++;
            pt += dt;
            if (phase === 'wait') {
                if (timing === 'step') { if (hour >= 2 && hour < 6 && lastDay !== day) { lastDay = day; begin(); } }
                else if ((wait -= dt) <= 0) begin();
            } else if (phase === 'copy' && pt >= COPY) {
                phase = mode === 'repair' ? 'repair' : 'settle'; pt = 0;
            } else if (phase === 'repair' && pt >= REPAIR) {
                finish(L);
            } else if (phase === 'settle' && pt >= SETTLE) {
                finish(Math.max(9, Math.min(15, L + (slip.type === 'ins' ? 1 : -1))));
            } else if (phase === 'hold' && pt >= HOLD) {
                L = outcome; phase = 'wait'; pt = 0; wait = 0.4 + r() * 3;
                if (v.auto() && copies % 4 === 0) {
                    mode = mode === 'repair' ? 'lost' : 'repair';
                    segRepair.set(mode); restart();
                }
            }
        }

        const unitW = () => Math.min(28, W / Math.max(L + 1, 12));
        function place(u, x, y, w, show, extra) {
            u.g.style.display = show ? '' : 'none';
            if (!show) return;
            u.rect.setAttribute('x', v.f1(x)); u.rect.setAttribute('y', v.f1(y - UH / 2)); u.rect.setAttribute('width', v.f1(w - 3));
            u.t.setAttribute('x', v.f1(x + (w - 3) / 2)); u.t.setAttribute('y', v.f1(y));
            u.rect.classList.toggle('is-extra', !!extra);
        }
        function render() {
            dh.set(hour);
            windowArc.style.opacity = timing === 'step' ? 1 : 0.15;
            while (marksG.childNodes.length < marks.length) v.s('circle', { r: 3, class: 'mr-dot' }, marksG);
            Array.from(marksG.childNodes).forEach((c, i) => {
                if (i >= marks.length) { c.style.display = 'none'; return; }
                const [x, y] = v.polar(DR + 9, marks[i], DX, DY);
                c.style.display = '';
                c.setAttribute('cx', v.f1(x)); c.setAttribute('cy', v.f1(y));
                c.style.opacity = (0.25 + 0.75 * (i + 1) / marks.length).toFixed(2);
            });
            const split = phase === 'copy' ? Math.sin(Math.PI * Math.min(1, pt / 0.9)) * 9 : 0;
            cellA.setAttribute('cx', v.f1(DX - split)); cellB.setAttribute('cx', v.f1(DX + split));
            divLab.style.opacity = phase === 'copy' && pt < 1.2 ? 1 : 0;

            const w = unitW();
            const p = phase === 'copy' ? Math.min(1, pt / COPY) : 1;
            const slipOn = !!slip && (phase === 'copy' || phase === 'repair' || phase === 'settle') && p * L > slip.k + 0.5;
            let shrink = 1;
            if (phase === 'repair') shrink = 1 - v.ease((pt - 0.5) / 0.5);
            if (phase === 'settle') shrink = 1 - v.ease(pt / 0.6);
            const loopOn = slipOn && shrink > 0.02;
            const del = slip && slip.type === 'del', ins = slip && slip.type === 'ins';

            // parent strand: in a deletion slip one of its repeats bulges out and is skipped
            tUnits.forEach((u, i) => place(u, X0 + i * w, TY + (loopOn && del && i === slip.k ? 24 * shrink : 0), w, i < L, false));

            // the copy
            const resolvedLost = (phase === 'settle' && !loopOn) || (phase === 'hold' && mode === 'lost');
            cUnits.forEach((u, i) => {
                if (phase === 'wait') { place(u, 0, 0, w, false); return; }
                if (resolvedLost) {
                    const len = phase === 'hold' ? outcome : L + (ins ? 1 : -1);
                    place(u, X0 + i * w, CY2, w, i < len, ins && i === slip.k + 1);
                    return;
                }
                const count = phase === 'copy' ? Math.floor(p * L + 1e-6) : L;
                const gap = loopOn && del && i === slip.k;
                place(u, X0 + i * w, CY2, w, i < count && !gap, false);
            });

            // the slipped repeat: a loop on the copy (insertion) or on the parent (deletion)
            const showLoop = loopOn && ins;
            loopPath.style.display = loopOn ? '' : 'none';
            loopUnit.g.style.display = showLoop ? '' : 'none';
            if (loopOn) {
                const cx = X0 + (slip.k + 1) * w - 1.5;
                if (ins) {
                    const top = CY2 - UH / 2 - 26 * shrink;
                    loopPath.setAttribute('d', `M${v.f1(cx - 9)} ${CY2 - UH / 2} Q${v.f1(cx)} ${v.f1(top - 10)} ${v.f1(cx + 9)} ${CY2 - UH / 2}`);
                    place(loopUnit, cx - w / 2 + 1.5, top - 1, w, true, true);
                    loopUnit.g.style.opacity = shrink.toFixed(2);
                } else {
                    const x0 = X0 + slip.k * w;
                    loopPath.setAttribute('d', `M${v.f1(x0 - 2)} ${TY + UH / 2} Q${v.f1(x0 + w / 2)} ${v.f1(TY + UH / 2 + 34 * shrink)} ${v.f1(x0 + w + 1)} ${TY + UH / 2}`);
                }
            }
            // polymerase copying along the strand
            pol.style.display = phase === 'copy' ? '' : 'none';
            if (phase === 'copy') {
                const x = X0 + p * L * w;
                pol.setAttribute('x', v.f1(x - w * 0.7)); pol.setAttribute('y', CY2 - UH / 2 - 6); pol.setAttribute('width', v.f1(w * 1.4));
            }
            // mismatch repair arrives, fixes the slip and leaves
            clampG.style.display = phase === 'repair' && slip ? '' : 'none';
            if (phase === 'repair' && slip) {
                const tx = X0 + (slip.k + 1) * w, ty = ins ? CY2 - 38 : TY + 40;
                const a = v.easeOut(pt / 0.5), b = v.ease((pt - 1.0) / 0.45);
                clampG.setAttribute('transform', `translate(${v.f1(v.lerp(560, tx, a) + b * 80)} ${v.f1(v.lerp(TY + 30, ty, a) - b * 10)})`);
                clampG.style.opacity = (1 - b).toFixed(2);
            }
            // what happened
            let msg = '', bad = false;
            if (phase === 'copy') msg = 'Copying…';
            else if (phase === 'repair') msg = 'Mismatch repair finds the slip';
            else if (phase === 'settle') { msg = 'No repair: the slip stays'; bad = true; }
            else if (copies === 0) msg = timing === 'step' ? 'Waiting for the cell to divide…' : 'Waiting…';
            else if (mode === 'repair') msg = `Copy has ${outcome} repeats: slip fixed`;
            else { msg = `Copy has ${outcome} repeats: ${outcome > L ? 'one gained' : outcome < L ? 'one lost' : 'changed'}`; bad = true; }
            if (phase === 'wait' && copies > 0 && mode === 'lost') msg = `Copy has ${outcome} repeats`;
            result.textContent = msg;
            result.classList.toggle('v-rose-text', bad);

            const counts = {};
            dots.forEach((d, i) => {
                if (i >= history.length) { d.style.display = 'none'; return; }
                const len = Math.min(15, Math.max(9, history[i]));
                const k = counts[len] = (counts[len] || 0) + 1;
                d.style.display = '';
                d.setAttribute('cx', HX + (len - 9) * HS);
                d.setAttribute('cy', HY - (k - 1) * 7.8);
                d.style.opacity = (0.35 + 0.65 * (i + 1) / history.length).toFixed(2);
                d.classList.toggle('v-rose-fill', len !== 12);
            });
        }
        render();
        return {
            frame(dt) { tick(dt); render(); },
            draw() {
                if (!v.reduced()) { render(); return; }
                // a still picture, as if several copies had already been made
                hour = 4;
                marks = timing === 'step' ? [2.4, 3.1, 4.2, 2.8, 5.1] : [1, 7.5, 13, 17.2, 21.4];
                if (mode === 'repair') { history = Array(10).fill(12); L = 12; outcome = 12; }
                else { history = [12, 13, 13, 12, 11, 12, 13, 14, 13, 14]; L = 13; outcome = 14; }
                slip = { k: 5, type: 'ins' }; copies = 10; phase = 'hold'; pt = 0;
                render();
            },
        };
    });

    /* ═══ Morning and evening types meeting an infection ═══ */
    Viz.register('chronotype', function (v) {
        const svg = v.svg(560, 360, 'Two clocks showing body time for a morning type and an evening type exposed to a virus at the same clock time.');
        const PEOPLE = [
            { cx: 140, label: 'Morning type', offset: 1.5, icon: 'sun' },
            { cx: 420, label: 'Evening type', offset: -1.5, icon: 'moon' },
        ];
        const CY = 172, R = 92;
        const immune = (bt) => 0.5 + 0.5 * Math.cos(v.TAU * (bt - 7) / 24); // illustrative
        const clockT = v.text(svg, 280, 44, '', { class: 'v-num-sm v-mid' });
        v.text(svg, 280, 64, 'clock time', { class: 'v-small v-mid' });
        PEOPLE.forEach((p) => {
            const g = v.s('g', {}, svg);
            face(v, g, p.cx, CY, R, { labelInset: 20 });
            for (let j = 0; j < 48; j++) {
                const bt = (j + 0.5) / 2, a = immune(bt);
                const [x1, y1] = v.polar(R + 5, bt, p.cx, CY), [x2, y2] = v.polar(R + 7 + 20 * a, bt, p.cx, CY);
                v.s('line', { x1: v.f1(x1), y1: v.f1(y1), x2: v.f1(x2), y2: v.f1(y2), class: 'ct-bar', opacity: (0.25 + 0.75 * a).toFixed(2) }, g);
            }
            p.hand = hand(v, g, p.cx, CY, 26, R - 14, 7, R - 4);
            p.virus = v.s('g', {}, g);
            v.s('circle', { r: 5.5, class: 'ct-virus' }, p.virus);
            for (let k = 0; k < 8; k++) {
                const a = k / 8 * v.TAU;
                v.s('line', { x1: v.f1(6 * Math.cos(a)), y1: v.f1(6 * Math.sin(a)), x2: v.f1(10 * Math.cos(a)), y2: v.f1(10 * Math.sin(a)), class: 'ct-virus-spike' }, p.virus);
            }
            const iconX = p.cx - 52, iconY = CY - R - 36;
            if (p.icon === 'sun') {
                v.s('circle', { cx: iconX, cy: iconY, r: 5, class: 'v-amber-fill' }, g);
                for (let k = 0; k < 8; k++) {
                    const a = k / 8 * v.TAU;
                    v.s('line', { x1: v.f1(iconX + 8 * Math.cos(a)), y1: v.f1(iconY + 8 * Math.sin(a)), x2: v.f1(iconX + 11 * Math.cos(a)), y2: v.f1(iconY + 11 * Math.sin(a)), class: 'v-amber', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
                }
            } else {
                v.s('path', { d: `M${iconX + 4} ${iconY - 8} a8 8 0 1 0 5 12 a7 7 0 0 1 -5 -12 z`, class: 'v-violet-fill' }, g);
            }
            v.text(g, iconX + 18, iconY + 5, p.label, { class: 'v-strong', 'font-size': 14 });
            p.bodyT = v.text(svg, p.cx, CY + R + 46, '', { class: 'v-label v-mid' });
            v.s('rect', { x: p.cx - 60, y: CY + R + 58, width: 120, height: 6, rx: 3, class: 'ct-meter-bg' }, svg);
            p.meter = v.s('rect', { x: p.cx - 60, y: CY + R + 58, width: 0, height: 6, rx: 3, class: 'ct-meter' }, svg);
            p.ctl = v.dial({ svg, cx: p.cx, cy: CY, knob: p.hand.knob, hit: [p.hand.hit], label: p.label + ': body time at exposure', get: () => wall + p.offset, onChange(bt) { wall = v.wrap24(bt - p.offset); slider.set(wall); render(); } });
        });
        v.text(svg, 280, CY + R + 64, 'immune activity', { class: 'v-small v-mid' });
        v.text(svg, 280, CY + R + 78, '(illustrative)', { class: 'v-small v-mid' });

        let wall = 9;
        const slider = v.slider({ label: 'Time of exposure', min: 0, max: 23.75, step: 0.25, value: wall, format: v.hhmm, onInput(x) { wall = x; } });
        v.caption('At the same clock time, morning and evening types are at different points in their body’s day. <strong>Move the time of exposure</strong> or drag either hand. Immune responses vary across the body’s day, so this project tests whether genetic chronotype affects susceptibility to Covid-19.');

        function render(t) {
            clockT.textContent = v.hhmm(wall);
            PEOPLE.forEach((p) => {
                const bt = v.wrap24(wall + p.offset);
                p.hand.set(bt);
                p.ctl.update(bt);
                const [x, y] = v.polar(R + 16, bt, p.cx, CY);
                const pulse = 1 + 0.12 * Math.sin((t || 0) * 5);
                p.virus.setAttribute('transform', `translate(${v.f1(x)} ${v.f1(y)}) scale(${pulse.toFixed(3)})`);
                p.bodyT.textContent = 'body time ' + v.hhmm(bt);
                p.meter.setAttribute('width', v.f1(120 * immune(bt)));
            });
        }
        render(0);
        return {
            frame(dt, t) {
                if (v.auto() && !PEOPLE.some((p) => p.ctl.dragging)) { wall = v.wrap24(wall + dt * 1.2); slider.set(Math.round(wall * 4) / 4 % 24); }
                render(t);
            },
            draw() { render(0); },
        };
    });

    /* ═══ Cortisol pathway and CYP21A2 ═══ */
    Viz.register('steroids', function (v) {
        const svg = v.svg(560, 360, 'The pathway from cholesterol to cortisol through the CYP21A2 enzyme, with daily profiles of cortisol and 17-OHP.');
        // shape of the daily ACTH drive: rises before waking, peaks after, falls through the day (illustrative)
        function drive(hh) {
            const x = v.wrap24(hh);
            if (x >= 3 && x < 7.5) return 0.1 + 0.9 * (0.5 - 0.5 * Math.cos(Math.PI * (x - 3) / 4.5));
            if (x >= 7.5) return Math.max(0.1, Math.exp(-(x - 7.5) / 6));
            return 0.1;
        }
        const cortisol = (hh, act) => drive(hh) * Math.pow(act, 0.7);
        const ohp = (hh, act) => drive(hh) * (0.18 + 1.35 * Math.pow(1 - act, 1.3));

        const DX = 62, DY = 80, DR = 42;
        const dg = v.s('g', {}, svg);
        face(v, dg, DX, DY, DR, { labels: false });
        for (let j = 0; j < 48; j++) {
            const hh = (j + 0.5) / 2, a = drive(hh);
            const [x1, y1] = v.polar(DR + 3, hh, DX, DY), [x2, y2] = v.polar(DR + 4 + 14 * a, hh, DX, DY);
            v.s('line', { x1: v.f1(x1), y1: v.f1(y1), x2: v.f1(x2), y2: v.f1(y2), class: 'v-tone', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: (0.25 + 0.75 * a).toFixed(2) }, dg);
        }
        const dh = hand(v, dg, DX, DY, 8, DR - 8);
        v.text(svg, DX, DY + DR + 30, 'ACTH drive', { class: 'v-small v-mid' });
        const timeT = v.text(svg, DX, DY + DR + 46, '', { class: 'v-small v-mid v-strong' });

        // Pathway
        const Y = 72, CH = 178, POOL = 320, GATE = 410, CORT = 505, ANDRO_Y = 168;
        v.s('path', { d: `M${CH + 46} ${Y} H${POOL} M${POOL} ${Y} H${GATE - 32} M${GATE + 32} ${Y} H${CORT - 40} M${POOL} ${Y} V${ANDRO_Y - 15}`, class: 'st-path' }, svg);
        const node = (x, y, w, label) => {
            v.s('rect', { x: x - w / 2, y: y - 15, width: w, height: 30, rx: 15, class: 'st-node' }, svg);
            return v.text(svg, x, y + 4.5, label, { class: 'v-label v-mid v-strong' });
        };
        node(CH, Y, 92, 'Cholesterol');
        node(CORT, Y, 80, 'Cortisol');
        node(POOL, ANDRO_Y, 92, 'Androgens');
        const pool = v.s('circle', { cx: POOL, cy: Y, r: 12, class: 'st-pool' }, svg);
        v.text(svg, POOL, Y - 38, '17-OHP', { class: 'v-label v-mid v-strong' });
        const gate = v.s('rect', { x: GATE - 32, y: Y - 13, width: 64, height: 26, rx: 6, class: 'st-gate' }, svg);
        v.text(svg, GATE, Y + 4, 'CYP21A2', { class: 'v-small v-mid v-strong' });
        // the gene, with its promoter, which makes the enzyme
        const GX = 448, GY = 134;
        v.s('path', { d: `M${GATE} ${Y + 14} C${GATE} ${GY - 10} ${GX - 20} ${GY} ${GX - 6} ${GY}`, class: 'v-faint', 'stroke-dasharray': '2 3' }, svg);
        v.s('line', { x1: GX, y1: GY, x2: GX + 92, y2: GY, class: 'v-line' }, svg);
        v.s('rect', { x: GX, y: GY - 7, width: 22, height: 14, rx: 2, class: 'st-promoter' }, svg);
        [[28, 8], [42, 6], [54, 7], [67, 22]].forEach(([x, w]) => v.s('rect', { x: GX + x, y: GY - 6, width: w, height: 12, rx: 1.5, class: 'st-exon' }, svg));
        const variant = v.s('path', { d: `M${GX + 11} ${GY - 10} l-5 -8 h10 z`, class: 'v-rose-fill' }, svg);
        v.text(svg, GX + 46, GY + 22, 'CYP21A2 gene', { class: 'v-small v-mid', 'font-style': 'italic' });
        const varLab = v.text(svg, GX + 11, GY - 24, 'promoter variant', { class: 'v-small v-rose-text v-mid' });

        // Daily profiles
        const CX0 = 60, CX1 = 540, CB = 326, CHT = 92, MAX = 1.42;
        v.s('line', { x1: CX0, y1: CB, x2: CX1, y2: CB, class: 'v-line' }, svg);
        [0, 6, 12, 18, 24].forEach((hh) => {
            const x = CX0 + (CX1 - CX0) * hh / 24;
            v.s('line', { x1: x, y1: CB, x2: x, y2: CB + 4, class: 'v-line' }, svg);
            v.text(svg, x, CB + 18, String(hh).padStart(2, '0') + ':00', { class: 'v-small v-mid' });
        });
        v.s('line', { x1: CX0, y1: 214, x2: CX0 + 18, y2: 214, class: 'st-cortisol' }, svg);
        v.text(svg, CX0 + 24, 218, 'Cortisol', { class: 'v-small' });
        v.s('line', { x1: CX0 + 100, y1: 214, x2: CX0 + 118, y2: 214, class: 'st-ohp' }, svg);
        v.text(svg, CX0 + 124, 218, '17-OHP', { class: 'v-small' });
        v.text(svg, CX1, 218, 'levels are illustrative', { class: 'v-small v-end' });
        const cPath = v.s('path', { class: 'st-cortisol' }, svg);
        const oPath = v.s('path', { class: 'st-ohp' }, svg);
        const cursor = v.s('line', { y1: CB - CHT - 6, y2: CB, class: 'v-faint' }, svg);
        const cDot = v.s('circle', { r: 3.5, class: 'v-blue-fill' }, svg);
        const oDot = v.s('circle', { r: 3.5, class: 'v-amber-fill' }, svg);
        const dotsG = v.s('g', {}, svg);

        let hour = 8, act = 1, mass = 0.6, carryIn = 0, carryC = 0, carryA = 0;
        const particles = [];
        const slider = v.slider({ label: 'CYP21A2 activity', min: 10, max: 100, step: 5, value: 100, format: (x) => x + '%', onInput(x) { act = x / 100; } });
        v.caption('Cortisol is made from cholesterol in the adrenal glands, and peaks each morning. <em>CYP21A2</em> makes the enzyme for one step. <strong>Lower its activity</strong>: cortisol falls, while 17-OHP builds up and spills over into androgens, as in congenital adrenal hyperplasia. This project studies variants in the gene’s promoter, the region that switches it on.');

        const yv = (val) => CB - CHT * val / MAX;
        function curves() {
            let c = '', o = '';
            for (let i = 0; i <= 96; i++) {
                const hh = i / 4, x = v.f1(CX0 + (CX1 - CX0) * hh / 24);
                c += (i ? 'L' : 'M') + x + ' ' + v.f1(yv(cortisol(hh, act)));
                o += (i ? 'L' : 'M') + x + ' ' + v.f1(yv(ohp(hh, act)));
            }
            cPath.setAttribute('d', c); oPath.setAttribute('d', o);
        }
        function spawn(kind) {
            const el = v.s('circle', { r: 2.6, class: 'st-dot' + (kind === 'in' ? ' is-ohp' : kind === 'andro' ? ' is-andro' : '') }, dotsG);
            particles.push({ kind, s: 0, el });
        }
        function render() {
            dh.set(hour);
            timeT.textContent = v.hhmm(hour);
            curves();
            const x = CX0 + (CX1 - CX0) * hour / 24;
            cursor.setAttribute('x1', v.f1(x)); cursor.setAttribute('x2', v.f1(x));
            cDot.setAttribute('cx', v.f1(x)); cDot.setAttribute('cy', v.f1(yv(cortisol(hour, act))));
            oDot.setAttribute('cx', v.f1(x)); oDot.setAttribute('cy', v.f1(yv(ohp(hour, act))));
            pool.setAttribute('r', v.f1(Math.min(30, 9 + 6 * Math.sqrt(mass))));
            gate.style.opacity = (0.35 + 0.65 * act).toFixed(2);
            const vis = act < 0.97 ? 1 : 0;
            variant.style.opacity = vis; varLab.style.opacity = vis;
        }
        function step(dt) {
            hour = v.wrap24(hour + dt * 1.6);
            // pool of 17-OHP: fed by the daily drive, drained by CYP21A2 and, when it backs up, into androgens
            const inflow = 3.2 * drive(hour), toC = 2.4 * act * mass, toA = 0.45 * mass;
            mass = Math.max(0, mass + (inflow - toC - toA) * dt);
            carryIn += inflow * dt * 2.2; carryC += toC * dt * 2.2; carryA += toA * dt * 2.2;
            while (carryIn >= 1) { spawn('in'); carryIn -= 1; }
            while (carryC >= 1) { spawn('cort'); carryC -= 1; }
            while (carryA >= 1) { spawn('andro'); carryA -= 1; }
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.s += dt / (p.kind === 'in' ? 1.0 : 0.9);
                let x, y;
                if (p.kind === 'in') { x = v.lerp(CH + 46, POOL - 8, p.s); y = Y; }
                else if (p.kind === 'cort') { x = v.lerp(POOL + 8, CORT - 40, p.s); y = Y; }
                else { x = POOL; y = v.lerp(Y + 8, ANDRO_Y - 15, p.s); }
                if (p.s >= 1) { p.el.remove(); particles.splice(i, 1); continue; }
                p.el.setAttribute('cx', v.f1(x)); p.el.setAttribute('cy', v.f1(y));
                p.el.style.opacity = (p.s < 0.1 ? p.s * 10 : p.s > 0.85 ? (1 - p.s) / 0.15 : 1).toFixed(2);
            }
            if (particles.length > 160) particles.splice(0, particles.length - 160).forEach((p) => p.el.remove());
        }
        render();
        return {
            frame(dt, t) {
                if (v.auto()) {
                    act = Math.round((0.6 + 0.4 * Math.cos(t * v.TAU / 18)) * 20) / 20;
                    slider.set(Math.round(act * 100));
                }
                step(dt);
                render();
            },
            draw() {
                particles.splice(0).forEach((p) => p.el.remove());
                mass = 3.2 * drive(hour) / (2.4 * act + 0.45);
                render();
            },
        };
    });

    /* ═══ Enrichment: is the overlap between two gene lists bigger than chance? ═══ */
    Viz.register('enrichment', function (v) {
        const svg = v.svg(560, 360, 'Two hundred genes, some linked to rheumatoid arthritis and some rhythmic, with a histogram of overlaps from random shuffles.');
        const N = 200, NRA = 20, NRH = 60, OBS = 11;
        const r = v.rng(42);
        const order = Array.from({ length: N }, (_, i) => i);
        for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        const ra = new Set(order.slice(0, NRA));
        const observed = new Set(order.slice(0, OBS).concat(order.slice(NRA, NRA + NRH - OBS)));
        const genes = [];
        const GX = 40, GY = 76, GS = 12.4;
        for (let i = 0; i < N; i++) {
            const c = v.s('circle', { cx: v.f1(GX + (i % 20) * GS), cy: v.f1(GY + Math.floor(i / 20) * GS), r: 4.1, class: 'en-gene' + (ra.has(i) ? ' is-ra' : '') }, svg);
            genes.push(c);
        }
        const gridLab = v.text(svg, GX - 4, 56, 'Observed', { class: 'v-title' });
        // legend
        v.s('circle', { cx: GX, cy: 222, r: 4.1, class: 'en-gene is-ra' }, svg);
        v.text(svg, GX + 12, 226, 'linked to rheumatoid arthritis (20)', { class: 'v-small' });
        v.s('circle', { cx: GX, cy: 242, r: 4.1, class: 'en-gene is-rhythmic' }, svg);
        v.text(svg, GX + 12, 246, 'rhythmic: follows the body clock (60)', { class: 'v-small' });
        const both = v.text(svg, GX - 4, 300, '', { class: 'v-num' });
        v.text(svg, GX + 34, 292, 'genes in both groups', { class: 'v-label' });
        const bothNote = v.text(svg, GX + 34, 308, '', { class: 'v-small' });
        const pText = v.text(svg, GX - 4, 336, '', { class: 'v-small' });

        // histogram
        const HX = 318, HB = 284, BW = 13, HT = 150;
        v.text(svg, HX, 56, 'Overlap after shuffling', { class: 'v-title' });
        const counts = new Array(21).fill(0);
        const bars = counts.map((_, k) => v.s('rect', { x: HX + k * BW, width: BW - 3, y: HB, height: 0, rx: 1.5, class: 'en-bar' + (k >= OBS ? ' is-extreme' : '') }, svg));
        v.s('line', { x1: HX - 4, y1: HB, x2: HX + 17 * BW, y2: HB, class: 'v-line' }, svg);
        [0, 4, 8, 12, 16].forEach((k) => v.text(svg, HX + k * BW + 5, HB + 16, String(k), { class: 'v-small v-mid' }));
        const ox = HX + OBS * BW + 5, ex = HX + 6 * BW + 5;
        v.s('line', { x1: ox, y1: HB, x2: ox, y2: 108, class: 'en-obs' }, svg);
        v.text(svg, ox + 4, 104, 'observed: 11', { class: 'v-small v-rose-text' });
        v.s('line', { x1: ex, y1: HB, x2: ex, y2: 128, class: 'en-exp' }, svg);
        v.text(svg, ex, 122, 'chance: about 6', { class: 'v-small v-mid' });
        const shuf = v.text(svg, HX, 316, '', { class: 'v-label' });
        const ext = v.text(svg, HX, 334, '', { class: 'v-small' });

        // exact test (hypergeometric upper tail), as Fisher's exact test would give
        function logC(n, k) { let s = 0; for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; }
        let p = 0;
        for (let k = OBS; k <= NRA; k++) p += Math.exp(logC(NRH, k) + logC(N - NRH, NRA - k) - logC(N, NRA));
        pText.textContent = 'Fisher’s exact test: p = ' + p.toFixed(3);

        let total = 0, extreme = 0, pending = 0, current = observed, showObservedAt = 0, autoT = 0, demo = true;
        function shuffleOnce() {
            const pick = new Set();
            while (pick.size < NRH) pick.add(Math.floor(r() * N));
            let k = 0; pick.forEach((i) => { if (ra.has(i)) k++; });
            counts[k]++; total++; if (k >= OBS) extreme++;
            current = pick;
        }
        function run(n) {
            if (v.reduced()) { for (let i = 0; i < n; i++) shuffleOnce(); current = observed; render(); return; }
            pending += n;
        }
        v.button({ label: 'Shuffle once', onClick() { demo = false; run(1); } });
        v.button({ label: 'Shuffle 1,000 times', onClick() { demo = false; run(1000); } });
        v.button({ label: 'Start again', quiet: true, onClick() { demo = false; counts.fill(0); total = 0; extreme = 0; pending = 0; current = observed; render(); } });
        v.caption('Each dot is a gene. Ringed genes are linked to rheumatoid arthritis, whose symptoms are usually worst in the morning; filled genes are rhythmic. Is the overlap bigger than chance? <strong>Shuffle</strong> which genes are rhythmic to see how often chance alone gives an overlap as big. The numbers here are illustrative.');

        function render() {
            genes.forEach((c, i) => c.classList.toggle('is-rhythmic', current.has(i)));
            let k = 0; current.forEach((i) => { if (ra.has(i)) k++; });
            both.textContent = String(k);
            bothNote.textContent = current === observed ? 'in the observed data' : 'in this shuffle';
            gridLab.textContent = current === observed ? 'Observed' : 'Shuffle ' + total.toLocaleString('en-GB');
            const max = Math.max(1, ...counts);
            bars.forEach((b, i) => {
                const hgt = HT * counts[i] / max;
                b.setAttribute('y', v.f1(HB - hgt)); b.setAttribute('height', v.f1(hgt));
            });
            shuf.textContent = total ? `${total.toLocaleString('en-GB')} shuffles` : 'No shuffles yet';
            ext.textContent = total ? `${extreme.toLocaleString('en-GB')} gave an overlap of 11 or more` : 'Try the buttons below';
        }
        render();
        return {
            frame(dt) {
                if (pending > 0) {
                    const n = Math.min(pending, pending > 20 ? Math.ceil(dt * 260) : 1);
                    for (let i = 0; i < n; i++) shuffleOnce();
                    pending -= n;
                    showObservedAt = performance.now() + 1500;
                    render();
                } else if (current !== observed && performance.now() > showObservedAt) {
                    current = observed; render();
                } else if (demo && (v.compact || total < 400)) {
                    // a slow demo until the visitor takes over (on the homepage it starts again at 600)
                    autoT += dt;
                    if (autoT > 0.2) {
                        autoT = 0;
                        if (total >= 600) { counts.fill(0); total = 0; extreme = 0; }
                        shuffleOnce(); showObservedAt = performance.now() + 1200; render();
                    }
                }
            },
            draw() {
                // with reduced motion, show the result of 1,000 shuffles straight away
                if (!total && v.reduced()) { for (let i = 0; i < 1000; i++) shuffleOnce(); }
                current = observed; render();
            },
        };
    });

    /* ═══ Dose timing and genotype ═══ */
    Viz.register('dosing', function (v) {
        const svg = v.svg(560, 360, 'A dial for choosing the time a drug is taken, and a chart of the drug level over the next day.');
        const CX = 138, CY = 176, R = 104;
        const clearance = (hh) => 1 + 0.55 * Math.cos(v.TAU * (hh - 14) / 24); // illustrative daily rhythm
        const g = v.s('g', {}, svg);
        face(v, g, CX, CY, R, {});
        for (let j = 0; j < 48; j++) {
            const hh = (j + 0.5) / 2, a = clearance(hh) / 1.55;
            const [x1, y1] = v.polar(R + 5, hh, CX, CY), [x2, y2] = v.polar(R + 7 + 16 * a, hh, CX, CY);
            v.s('line', { x1: v.f1(x1), y1: v.f1(y1), x2: v.f1(x2), y2: v.f1(y2), class: 'ds-clear', opacity: (0.2 + 0.8 * a).toFixed(2) }, g);
        }
        const h = hand(v, g, CX, CY, 46, R - 18);
        const pillG = v.s('g', {}, g);
        const hit = v.s('circle', { cx: CX, cy: CY - R, r: 24, fill: 'transparent' }, pillG);
        const pill = v.s('g', {}, pillG);
        v.s('rect', { x: CX - 13, y: CY - R - 6, width: 26, height: 12, rx: 6, class: 'ds-pill-b' }, pill);
        v.s('path', { d: `M${CX} ${CY - R - 6} h-7 a6 6 0 0 0 0 12 h7 z`, class: 'ds-pill-a' }, pill);
        const doseT = v.text(svg, CX, CY + 4, '', { class: 'v-num v-mid' });
        v.text(svg, CX, CY + 26, 'dose taken', { class: 'v-small v-mid' });
        v.s('line', { x1: 24, y1: 343, x2: 44, y2: 343, class: 'ds-clear' }, svg);
        v.text(svg, 52, 347, 'How fast the body clears the drug', { class: 'v-small' });

        // concentration chart
        const X0 = 296, X1 = 545, Y0 = 56, Y1 = 266, MAX = 1.3, LO = 0.35, HI = 0.95;
        const yv = (c) => Y1 - (Y1 - Y0) * Math.min(c, MAX) / MAX;
        v.s('rect', { x: X0, y: Y0, width: X1 - X0, height: yv(HI) - Y0, class: 'ds-high' }, svg);
        v.s('rect', { x: X0, y: yv(HI), width: X1 - X0, height: yv(LO) - yv(HI), class: 'ds-band' }, svg);
        v.text(svg, X1 - 6, Y0 + 16, 'too high', { class: 'v-small v-end v-rose-text' });
        v.text(svg, X1 - 6, yv(HI) + 16, 'useful range', { class: 'v-small v-end v-teal-text' });
        v.text(svg, X1 - 6, Y1 - 8, 'too low', { class: 'v-small v-end' });
        v.s('line', { x1: X0, y1: Y1, x2: X1, y2: Y1, class: 'v-line' }, svg);
        v.s('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, class: 'v-line' }, svg);
        [0, 6, 12, 18, 24].forEach((k) => {
            const x = X0 + (X1 - X0) * k / 24;
            v.text(svg, x, Y1 + 16, k + ' h', { class: 'v-small v-mid' });
        });
        v.text(svg, X0, 36, 'Drug level after the dose', { class: 'v-title' });
        const area = v.s('path', { class: 'ds-area' }, svg);
        const curve = v.s('path', { class: 'ds-curve' }, svg);
        const inRange = v.text(svg, X0, 316, '', { class: 'v-num-sm' });
        v.text(svg, X0 + 64, 316, 'in the useful range', { class: 'v-label' });
        const over = v.text(svg, X0, 336, '', { class: 'v-small v-rose-text' });

        const GENO = { slow: 0.3, typical: 1, fast: 2.6 };
        let dose = 8, geno = 'typical', autoT = 0;
        const seg = v.segmented({
            label: 'Genotype', value: geno,
            options: [{ value: 'slow', label: 'Slow' }, { value: 'typical', label: 'Typical' }, { value: 'fast', label: 'Fast' }],
            onChange(val) { geno = val; },
        });
        const ctl = v.dial({ svg, cx: CX, cy: CY, knob: pill, hit: [hit], anywhere: true, label: 'Time the dose is taken', get: () => dose, onChange(x) { dose = Math.round(x * 4) / 4 % 24; render(); } });
        v.caption('<strong>Drag the pill</strong> to choose when the dose is taken, and pick a genotype. How fast the body clears a drug can change with the time of day, and gene variants make some people slow or fast metabolisers. Together they change how long the drug stays in its useful range. The model is illustrative.');

        function simulate() {
            const k0 = 0.12 * GENO[geno], ka = 1.0, dt = 0.05;
            let gut = 1.15, c = 0, tin = 0, thigh = 0, d = '', a = '';
            for (let i = 0; i <= 480; i++) {
                const t = i * dt;
                if (i) {
                    const k = k0 * clearance(dose + t);
                    const absorbed = ka * gut * dt;
                    gut -= absorbed; c += absorbed - k * c * dt;
                    if (c >= LO && c <= HI) tin += dt;
                    if (c > HI) thigh += dt;
                }
                const x = v.f1(X0 + (X1 - X0) * t / 24), y = v.f1(yv(c));
                d += (i ? 'L' : 'M') + x + ' ' + y;
            }
            a = d + `L${X1} ${Y1} L${X0} ${Y1} Z`;
            curve.setAttribute('d', d); area.setAttribute('d', a);
            return { tin, thigh };
        }
        function render() {
            h.set(dose); pillG.setAttribute('transform', `rotate(${(dose * 15).toFixed(2)} ${CX} ${CY})`);
            ctl.update(dose);
            doseT.textContent = v.hhmm(dose);
            const res = simulate();
            inRange.textContent = (Math.round(res.tin * 2) / 2).toFixed(1) + ' h';
            over.textContent = res.thigh > 0.25 ? 'and above it for ' + (Math.round(res.thigh * 2) / 2).toFixed(1) + ' h' : '';
        }
        render();
        return {
            frame(dt) {
                if (v.auto() && !ctl.dragging) {
                    dose = v.wrap24(dose + dt * 1.1);
                    autoT += dt;
                    if (autoT > 7) { autoT = 0; geno = geno === 'typical' ? 'slow' : geno === 'slow' ? 'fast' : 'typical'; seg.set(geno); }
                    render();
                }
            },
            draw() { render(); },
        };
    });

    /* ═══ Gene panels and super panels ═══ */
    Viz.register('panels', function (v) {
        const svg = v.svg(560, 360, 'A grid of genes with three gene panels, and patients who are diagnosed only if their gene is on the panel used.');
        const COLS = 14, ROWS = 7, X0 = 22, Y0 = 72, S = 21, CELL = 18;
        const PANELS = [
            { c0: 0, c1: 4, r0: 0, r1: 4, label: 'Panel 1', lx: 0, ly: -10 },
            { c0: 5, c1: 9, r0: 2, r1: 6, label: 'Panel 2', lx: 0, ly: 1 },
            { c0: 10, c1: 13, r0: 0, r1: 3, label: 'Panel 3', lx: 0, ly: -10 },
        ];
        const inPanel = (c, rr, p) => c >= p.c0 && c <= p.c1 && rr >= p.r0 && rr <= p.r1;
        const which = (c, rr) => PANELS.findIndex((p) => inPanel(c, rr, p));
        const cells = [];
        for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) {
            cells.push({ c, rr, panel: which(c, rr), el: v.s('rect', { x: X0 + c * S, y: Y0 + rr * S, width: CELL, height: CELL, rx: 3, class: 'gp-gene' }, svg) });
        }
        const panelEls = PANELS.map((p) => {
            const x = X0 + p.c0 * S - 4, y = Y0 + p.r0 * S - 4, w = (p.c1 - p.c0) * S + CELL + 8, hh = (p.r1 - p.r0) * S + CELL + 8;
            const el = v.s('rect', { x, y, width: w, height: hh, rx: 6, class: 'gp-panel' }, svg);
            const labY = p.ly < 0 ? y + p.ly : y + hh + 14;
            v.text(svg, x + 2, labY, p.label, { class: 'v-small' });
            return el;
        });
        v.text(svg, X0, 36, 'Genes', { class: 'v-title' });
        v.text(svg, 372, 36, 'Patients', { class: 'v-title' });
        // patients and the gene that causes each one's condition (fixed, so the picture is the same each time)
        const r = v.rng(5);
        const pickIn = (test) => { const pool = cells.filter(test); return pool[Math.floor(r() * pool.length)]; };
        const causes = [];
        const want = [[0, 9], [1, 6], [2, 5], [-1, 4]];
        want.forEach(([pi, n]) => { for (let k = 0; k < n; k++) { let c; do { c = pickIn((x) => x.panel === pi); } while (causes.includes(c)); causes.push(c); } });
        for (let i = causes.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [causes[i], causes[j]] = [causes[j], causes[i]]; }
        const linksG = v.s('g', {}, svg);
        const people = causes.map((cell, i) => {
            const x = 384 + (i % 6) * 31, y = 82 + Math.floor(i / 6) * 42;
            const g = v.s('g', { class: 'gp-person' }, svg);
            v.s('circle', { cx: x, cy: y - 7, r: 5.5 }, g);
            v.s('path', { d: `M${x - 10} ${y + 13} C${x - 10} ${y + 1} ${x + 10} ${y + 1} ${x + 10} ${y + 13}` }, g);
            cell.el.classList.add('is-cause');
            const link = v.s('path', { class: 'gp-link', d: `M${X0 + cell.c * S + CELL / 2} ${Y0 + cell.rr * S + CELL / 2} L${x - 12} ${y}` }, linksG);
            link.style.opacity = 0;
            g.addEventListener('pointerenter', () => { hover = i; render(); });
            g.addEventListener('pointerleave', () => { hover = -1; render(); });
            return { g, cell, link, shown: 0 };
        });
        const big = v.text(svg, 372, 278, '', { class: 'v-num' });
        const ofT = v.text(svg, 410, 278, '', { class: 'v-label' });
        v.s('rect', { x: 372, y: 292, width: 170, height: 6, rx: 3, class: 'ct-meter-bg' }, svg);
        const bar = v.s('rect', { x: 372, y: 292, width: 0, height: 6, rx: 3, class: 'v-tone-fill' }, svg);
        const note = v.text(svg, X0, 262, '', { class: 'v-label' });

        let mode = 'one', hover = -1, reveal = 0, shownBar = 0, autoT = 0;
        const seg = v.segmented({
            label: 'Test with', value: 'one',
            options: [{ value: 'one', label: 'One panel' }, { value: 'super', label: 'Super panel' }],
            onChange(val) { mode = val; reveal = 0; },
        });
        v.caption('A gene panel can only find a cause among the genes it includes, so a patient whose condition doesn’t match the panel they were tested with can be missed. This project combines related panels into <strong>super panels</strong>, so that testing covers more of the population. The numbers here are illustrative.');

        const tested = (cell) => mode === 'super' ? cell.panel >= 0 : cell.panel === 0;
        function render() {
            cells.forEach((cell) => cell.el.classList.toggle('is-tested', tested(cell)));
            panelEls.forEach((el, i) => el.classList.toggle('is-tested', mode === 'super' || i === 0));
            let found = 0;
            people.forEach((p, i) => {
                const ok = tested(p.cell);
                const on = ok && (v.reduced() || i < reveal * people.length + 0.5);
                if (on) found++;
                p.g.classList.toggle('is-found', on);
                const flash = ok && !v.reduced() && Math.abs(reveal * people.length - i) < 2.5 && reveal < 1;
                p.link.style.opacity = (hover === i || flash) ? 0.75 : 0;
            });
            shownBar = found;
            big.textContent = String(found);
            ofT.textContent = `of ${people.length} patients diagnosed`;
            ofT.setAttribute('x', found >= 10 ? 412 : 398);
            bar.setAttribute('width', v.f1(170 * found / people.length));
            note.textContent = mode === 'super' ? 'Panels 1–3 tested together' : 'Only Panel 1 tested';
        }
        render();
        return {
            frame(dt) {
                if (reveal < 1) { reveal = Math.min(1, reveal + dt * 0.8); render(); }
                if (v.auto()) {
                    autoT += dt;
                    if (autoT > 4.5) { autoT = 0; mode = mode === 'one' ? 'super' : 'one'; seg.set(mode); reveal = 0; }
                }
            },
            draw() { reveal = 1; render(); },
        };
    });

    /* ═══ Genes switching on through the day (default) ═══ */
    Viz.register('gene-clock', function (v) {
        const svg = v.svg(560, 360, 'A 24-hour clock with bars for genes that peak at different times of day.');
        const CX = 280, CY = 180, R = 118;
        const g = v.s('g', {}, svg);
        face(v, g, CX, CY, R, { dayNight: 10 });
        const r = v.rng(9);
        const bars = Array.from({ length: 60 }, (_, j) => ({ peak: v.wrap24((j + 0.5) * 0.4 + (r() - 0.5) * 0.3), amp: 0.5 + r() * 0.5, el: v.s('line', { class: 'gc-bar' }, g) }));
        const h = hand(v, g, CX, CY, 56, R - 16, 9, R);
        const timeT = v.text(svg, CX, CY + 8, '', { class: 'v-num v-mid' });
        let hour = 6;
        const ctl = v.dial({ svg, cx: CX, cy: CY, knob: h.knob, hit: [h.hit], anywhere: true, label: 'Time of day', get: () => hour, onChange(x) { hour = x; render(); } });
        v.caption('Many genes switch on at a set time of day. <strong>Drag the hand</strong>: the longest bars are the genes most active at that time.');
        function render() {
            h.set(hour); ctl.update(hour);
            timeT.textContent = v.hhmm(hour);
            bars.forEach((b) => {
                const d = v.hourDiff(hour, b.peak);
                const a = Math.pow((1 + Math.cos(d / 24 * v.TAU)) / 2, 8) * b.amp;
                const [x1, y1] = v.polar(R + 14, b.peak, CX, CY), [x2, y2] = v.polar(R + 18 + 40 * a, b.peak, CX, CY);
                b.el.setAttribute('x1', v.f1(x1)); b.el.setAttribute('y1', v.f1(y1));
                b.el.setAttribute('x2', v.f1(x2)); b.el.setAttribute('y2', v.f1(y2));
                b.el.style.opacity = (0.2 + 0.8 * a).toFixed(2);
            });
        }
        render();
        return {
            frame(dt) { if (v.auto() && !ctl.dragging) { hour = v.wrap24(hour + dt * 1.3); render(); } },
            draw() { render(); },
        };
    });

    /* ═══ Overview dial for the Research page ═══
       opts.projects: [{ id, short, pillar, tone }], opts.onHighlight(index) */
    Viz.register('project-dial', function (v, opts) {
        const list = opts.projects || [];
        const svg = v.svg(360, 360, '');
        svg.setAttribute('aria-hidden', 'true');
        svg.removeAttribute('role');
        const CX = 180, CY = 180, R = 140;
        face(v, svg, CX, CY, R, { dayNight: 10, labelInset: 24 });
        const n = Math.max(1, list.length);
        const hourOf = (i) => (i + 0.5) * 24 / n;
        list.forEach((p, i) => {
            const [x, y] = v.polar(R - 40, hourOf(i), CX, CY), [x2, y2] = v.polar(R, hourOf(i), CX, CY);
            v.s('line', { x1: v.f1(x), y1: v.f1(y), x2: v.f1(x2), y2: v.f1(y2), class: 'pd-spoke' }, svg);
        });
        const handG = v.s('g', {}, svg);
        v.s('line', { x1: CX, y1: CY - 74, x2: CX, y2: CY - R + 18, class: 'v-hand' }, handG);
        const dots = list.map((p, i) => {
            const [x, y] = v.polar(R, hourOf(i), CX, CY);
            const g = v.s('g', { class: 'tone-' + p.tone }, svg);
            const c = v.s('circle', { cx: v.f1(x), cy: v.f1(y), r: 11, class: 'pd-dot', style: 'fill: var(--tone)' }, g);
            v.text(g, x, y + 0.5, String(i + 1), { class: 'pd-num' });
            g.addEventListener('pointerenter', () => highlight(i, true));
            g.addEventListener('pointerleave', () => release());
            g.addEventListener('click', () => { if (p.id) location.hash = p.id; });
            g.style.cursor = 'pointer';
            return { g, c };
        });
        const title = lines(v, svg, CX, CY - 8, ['', ''], 24, { class: 'pd-centre' });
        const sub = v.text(svg, CX, CY + 40, '', { class: 'pd-sub' });

        let active = 0, angle = hourOf(0) * 15, target = angle, hold = false, timer = 0;
        function split(str) {
            const words = String(str).split(/\s+/); let a = '', b = '';
            words.forEach((w) => { if ((a + ' ' + w).trim().length <= 17 && !b) a = (a + ' ' + w).trim(); else b = (b + ' ' + w).trim(); });
            return [a, b];
        }
        function highlight(i, fromUser) {
            if (i < 0 || i >= list.length) return;
            active = i;
            if (fromUser) { hold = true; v.touch(); }
            let to = hourOf(i) * 15;
            while (to - angle > 180) to -= 360;
            while (to - angle < -180) to += 360;
            target = to;
            if (v.reduced()) angle = target;
            render();
            if (opts.onHighlight) opts.onHighlight(i);
        }
        function release() { hold = false; v.touch(); }
        function render() {
            handG.setAttribute('transform', `rotate(${angle.toFixed(2)} ${CX} ${CY})`);
            dots.forEach((d, i) => { d.c.setAttribute('r', i === active ? 15 : 11); d.g.style.opacity = i === active ? 1 : 0.7; });
            const p = list[active] || {};
            const [a, b] = split(p.short || '');
            setLines(title, b ? [a, b] : [a, '']);
            title.setAttribute('y', b ? CY - 14 : CY);
            sub.textContent = p.pillar || '';
            sub.setAttribute('y', b ? CY + 40 : CY + 26);
        }
        highlight(0, false);
        return {
            highlight, release,
            frame(dt) {
                angle += (target - angle) * Math.min(1, dt * 6);
                if (!hold && v.auto()) {
                    timer += dt;
                    if (timer > 2.8) { timer = 0; highlight((active + 1) % list.length, false); }
                }
                render();
            },
            draw() { angle = target; render(); },
        };
    });
})();
