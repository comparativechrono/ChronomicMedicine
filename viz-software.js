/* ═══════════════════════════════════════════
   CHRONOMIC MEDICINE — SOFTWARE PAGE DIAGRAMS

     pedigree   a family pedigree drawing itself (Pedigree Studio)
     formats    how the Pedigree Studio packages convert between file formats
     pednet     a family read as a graph: its loop, kinship and mode of inheritance (PedNet)
     nugap      the ν-gap between two simple models, computed live
     workbench  a tour of the Bioinformatics workbench's tabs

   The words under each diagram are in the v.caption(...) call.
   ═══════════════════════════════════════════ */
(function () {
    'use strict';
    if (!window.Viz) return;
    const Viz = window.Viz;

    /* ═══ Pedigree Studio: a pedigree drawing itself ═══ */
    Viz.register('pedigree', function (v) {
        const svg = v.svg(560, 330, 'A three-generation family pedigree drawn with standard symbols, as in Pedigree Studio.');
        const S = 14; // half the size of a symbol
        const people = [
            { id: 'I1', who: 'Father, deceased', sex: 'm', x: 230, y: 62, deceased: true },
            { id: 'I2', who: 'Mother', sex: 'f', x: 330, y: 62 },
            { id: 'II1', who: 'Sister', sex: 'f', x: 130, y: 152 },
            { id: 'II2', who: 'Sister', sex: 'f', x: 225, y: 152, affected: true },
            { id: 'II3', who: 'Proband', sex: 'm', x: 320, y: 152, affected: true, proband: true },
            { id: 'II4', who: 'Partner', sex: 'f', x: 430, y: 152 },
            { id: 'III1', who: 'Son', sex: 'm', x: 330, y: 248, affected: true },
            { id: 'III2', who: 'Daughter', sex: 'f', x: 420, y: 248 },
            { id: 'III3', who: 'Child, sex not known', sex: 'u', x: 510, y: 248 },
        ];
        // lines in drawing order: [path, step at which it appears]
        const LINES = [
            ['M244 62 H316', 1],                         // partnership I
            ['M280 62 V106 M130 106 H320 M130 106 V138 M225 106 V138 M320 106 V138', 2], // descent and sibship
            ['M334 152 H416', 4],                        // partnership II
            ['M375 152 V200 M330 200 H510 M330 200 V234 M420 200 V234 M510 200 V234', 5],
        ];
        const order = { I1: 0, I2: 0, II1: 3, II2: 3, II3: 3, II4: 4, III1: 6, III2: 6, III3: 6 };
        const linesG = v.s('g', {}, svg);
        const lineEls = LINES.map(([d, st]) => {
            const el = v.s('path', { d, class: 'pg-line' }, linesG);
            return { el, st };
        });
        ['I', 'II', 'III'].forEach((g, i) => v.text(svg, 38, [66, 156, 252][i], g, { class: 'v-label v-mid v-strong', 'font-family': 'var(--serif)' }));
        const nodes = people.map((p) => {
            const g = v.s('g', { class: 'pg-person', tabindex: '0', role: 'button' }, svg);
            let shape;
            if (p.sex === 'm') shape = v.s('rect', { x: p.x - S, y: p.y - S, width: S * 2, height: S * 2, class: 'pg-sym' }, g);
            else if (p.sex === 'f') shape = v.s('circle', { cx: p.x, cy: p.y, r: S, class: 'pg-sym' }, g);
            else shape = v.s('path', { d: `M${p.x} ${p.y - S - 2} L${p.x + S + 2} ${p.y} L${p.x} ${p.y + S + 2} L${p.x - S - 2} ${p.y} Z`, class: 'pg-sym' }, g);
            if (p.deceased) v.s('line', { x1: p.x - S - 5, y1: p.y + S + 5, x2: p.x + S + 5, y2: p.y - S - 5, class: 'pg-line' }, g);
            if (p.proband) {
                // standard notation: an arrow to the lower-left corner of the symbol, with P at its tail
                const tipX = p.x - S - 2, tipY = p.y + S + 2, tailX = tipX - 20, tailY = tipY + 20;
                const len = Math.hypot(tipX - tailX, tipY - tailY);
                const ux = (tipX - tailX) / len, uy = (tipY - tailY) / len; // direction of the arrow
                const HEAD = 9, HALF = 4.5;
                const baseX = tipX - ux * HEAD, baseY = tipY - uy * HEAD;    // where the head meets the line
                v.s('path', { d: `M${v.f1(tailX)} ${v.f1(tailY)} L${v.f1(baseX)} ${v.f1(baseY)}`, class: 'pg-line' }, g);
                v.s('path', { d: `M${v.f1(tipX)} ${v.f1(tipY)} L${v.f1(baseX - uy * HALF)} ${v.f1(baseY + ux * HALF)} L${v.f1(baseX + uy * HALF)} ${v.f1(baseY - ux * HALF)} Z`, class: 'pg-arrow' }, g);
                v.text(g, tailX - 12, tailY + 10, 'P', { class: 'v-label v-strong' });
            }
            const toggle = () => { p.affected = !p.affected; v.touch(); render(); v.changed(); };
            g.addEventListener('click', toggle);
            g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
            return { p, g, shape };
        });
        // exports
        const exportG = v.s('g', {}, svg);
        [['PNG', 'image'], ['JSON', 'session']].forEach(([fmt, what], i) => {
            const x = 470 + i * 46, y = 36;
            v.s('path', { d: `M${x} ${y} h26 l8 8 v30 h-34 z`, class: 'pg-file' }, exportG);
            v.text(exportG, x + 17, y + 26, fmt, { class: 'v-small v-mid v-strong', 'font-size': 9.5 });
            v.text(exportG, x + 17, y + 52, what, { class: 'v-small v-mid', 'font-size': 10 });
        });
        v.caption('<strong>Select anyone</strong> to mark them as affected or unaffected. Pedigree Studio draws the standard symbols for sex, affected status, partnerships, twins, consanguinity and more, and saves pedigrees as PNG images or JSON files.');

        let t = 0;
        const STEP = 0.55, CYCLE = 15;
        function render() {
            const st = v.reduced() ? 99 : t / STEP;
            lineEls.forEach(({ el, st: s0 }) => {
                const k = Math.max(0, Math.min(1, st - s0));
                el.style.opacity = k > 0 ? 1 : 0;
                el.style.strokeDasharray = '600';
                el.style.strokeDashoffset = String(600 * (1 - v.easeOut(k)));
            });
            nodes.forEach(({ p, g }) => {
                const k = Math.max(0, Math.min(1, st - order[p.id]));
                const sc = 0.6 + 0.4 * v.easeOut(k);
                g.style.opacity = k.toFixed(2);
                g.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${sc.toFixed(3)}) translate(${-p.x} ${-p.y})`);
                g.classList.toggle('is-affected', !!p.affected);
                g.setAttribute('aria-label', `${p.who}, ${p.affected ? 'affected' : 'unaffected'}. Select to change.`);
            });
            const ek = Math.max(0, Math.min(1, st - 8));
            exportG.style.opacity = ek.toFixed(2);
        }
        render();
        return {
            frame(dt) {
                if (v.auto() || t < CYCLE - 3) t += dt;
                if (t > CYCLE && v.auto()) t = 0;
                render();
            },
            draw() { render(); },
        };
    });

    /* ═══ File formats and the packages that convert between them ═══
       highlight(name) shows one package's routes; opts.onHighlight(name) is told when the visitor points at one */
    Viz.register('formats', function (v, opts) {
        const svg = v.svg(760, 360, 'A map of the file formats. Pedigree Studio sessions sit in the middle, and our Python packages convert them to and from PED files, the GA4GH Pedigree standard and Phenopackets. Abusua Pedigree Studio sessions convert to and from the GA4GH Pedigree too, and all the converters use pedigree-ga4gh for the GA4GH files.');
        const uid = 'fm' + Math.random().toString(36).slice(2, 8);
        const defs = v.s('defs', {}, svg);
        const marker = v.s('marker', { id: uid, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
        v.s('path', { d: 'M0 0 L10 5 L0 10 z', class: 'fm-arrowhead' }, marker);
        const N = {
            ped: { x: 120, y: 176, w: 150, label: 'PED / MPED files' },
            studio: { x: 380, y: 176, w: 196, label: 'Pedigree Studio session', main: true },
            abusua: { x: 300, y: 46, w: 172, label: 'Abusua session' },
            ga4gh: { x: 646, y: 96, w: 172, label: 'GA4GH Pedigree' },
            pheno: { x: 646, y: 232, w: 172, label: 'Phenopackets' },
        };
        // [packages, path, label x, label y, anchor, arrows ('end' or 'both'), packages that also light the route,
        //  label on a background (for a label that sits on its line)]
        const GA = ['pedigree-ga4gh'];
        const ROUTES = [
            [['studio2ped'], 'M282 164 C250 138 230 138 199 160', 240, 132, 'middle', 'end'],
            [['ped2studio'], 'M196 190 C230 216 250 216 280 192', 240, 232, 'middle', 'end'],
            [['studio2ga4gh'], 'M466 156 C496 110 516 90 558 90', 492, 86, 'end', 'end', GA],
            [['ga4gh2studio'], 'M560 108 C532 110 506 144 478 164', 548, 142, 'start', 'end', GA],
            [['studio2ga4gh'], 'M466 196 C496 242 516 252 558 250', 488, 270, 'end', 'end', GA],
            [['ga4gh2studio'], 'M560 216 C532 212 506 200 478 188', 552, 190, 'start', 'end', GA],
            [['abusua2ga4gh', 'ga4gh2abusua'], 'M388 46 C460 30 540 36 580 75', 490, 22, 'middle', 'both', GA],
            [['phenopacket-toolkit'], 'M646 117 L646 211', 646, 168, 'middle', 'both', GA, true],
            [['pedigree-ga4gh'], 'M650 77 C630 30 738 30 718 77', 684, 20, 'middle', 'end'],
            [['hponorm', 'mondonorm'], 'M612 251 C592 302 700 302 680 251', 646, 314, 'middle', 'end'],
            [['mpedtools'], 'M86 195 C66 242 174 242 154 195', 120, 256, 'middle', 'end'],
        ];
        const routesG = v.s('g', {}, svg);
        const routes = ROUTES.map(([names, d, lx, ly, anchor, arrows, also, onLine]) => {
            const g = v.s('g', { class: 'fm-route' }, routesG);
            v.s('path', { d, class: 'fm-hit' }, g); // a wider, invisible line that is easier to point at
            const path = v.s('path', { d, class: 'fm-edge', 'marker-end': `url(#${uid})`, 'marker-start': arrows === 'both' ? `url(#${uid})` : null }, g);
            const dots = [0, 0.33, 0.66].map((o) => ({ o, el: v.s('circle', { r: 2.6, class: 'fm-dot' }, g) }));
            const label = names.join(', ');
            if (onLine) v.s('rect', { x: lx - label.length * 3.6 - 8, y: ly - 13, width: label.length * 7.2 + 16, height: 18, rx: 9, class: 'fm-labelbg' }, g);
            v.text(g, lx, ly, label, { class: 'v-mono fm-label', 'text-anchor': anchor });
            g.addEventListener('pointerenter', () => { set(names[0]); if (opts.onHighlight) opts.onHighlight(names); });
            g.addEventListener('pointerleave', () => { set(null); if (opts.onHighlight) opts.onHighlight(null); });
            return { names, lights: names.concat(also || []), g, path, dots, len: 0 };
        });
        Object.values(N).forEach((n) => {
            v.s('rect', { x: n.x - n.w / 2, y: n.y - 19, width: n.w, height: 38, rx: 19, class: 'fm-node' + (n.main ? ' is-main' : '') }, svg);
            v.text(svg, n.x, n.y + 4.5, n.label, { class: 'v-label v-mid v-strong' });
        });
        v.text(svg, 646, 332, 'disease and phenotype terms matched', { class: 'v-small v-mid' });
        v.text(svg, 646, 347, 'to the MONDO and HPO ontologies', { class: 'v-small v-mid' });
        v.text(svg, 120, 274, 'check, merge, split, convert', { class: 'v-small v-mid' });

        let active = null, t = 0;
        function set(name) {
            active = name;
            routes.forEach((r) => {
                const on = !!name && r.lights.includes(name);
                r.g.classList.toggle('is-on', on);
                r.g.classList.toggle('is-off', !!name && !on);
            });
            if (v.reduced()) place(0);
        }
        function place(speed) {
            routes.forEach((r) => {
                if (!r.len) r.len = r.path.getTotalLength();
                r.dots.forEach((d) => {
                    const boost = active && r.lights.includes(active) ? 2.2 : 1;
                    const f = (t * speed * boost / Math.max(60, r.len) + d.o) % 1;
                    const pt = r.path.getPointAtLength(f * r.len);
                    d.el.setAttribute('cx', v.f1(pt.x)); d.el.setAttribute('cy', v.f1(pt.y));
                });
            });
        }
        return {
            highlight: set,
            frame(dt) { t += dt; place(60); },
            draw() { place(0); },
        };
    });

    /* ═══ nugap: the ν-gap between two first-order models ═══ */
    Viz.register('nugap', function (v) {
        const svg = v.svg(560, 320, 'Responses of two simple systems, A and B, to the same input, and a gauge showing the nu-gap between them.');
        // chordal distance between two complex numbers
        function chordal(ar, ai, br, bi) {
            const dr = ar - br, di = ai - bi;
            return Math.sqrt(dr * dr + di * di) / Math.sqrt((1 + ar * ar + ai * ai) * (1 + br * br + bi * bi));
        }
        // ν-gap between k1/(τ1 s + 1) and k2/(τ2 s + 1): the largest chordal distance over frequency
        // (for these stable first-order systems with positive gain the winding condition holds)
        function nuGap(k1, t1, k2, t2) {
            let best = chordal(k1, 0, k2, 0);
            for (let i = 0; i <= 360; i++) {
                const w = Math.pow(10, -3 + 6 * i / 360);
                const d1 = 1 + w * w * t1 * t1, d2 = 1 + w * w * t2 * t2;
                const c = chordal(k1 / d1, -k1 * w * t1 / d1, k2 / d2, -k2 * w * t2 / d2);
                if (c > best) best = c;
            }
            return best;
        }
        const PX0 = 50, PX1 = 330, PY0 = 40, PY1 = 236, TMAX = 10;
        v.text(svg, PX0, 26, 'Response to the same input', { class: 'v-title' });
        v.s('line', { x1: PX0, y1: PY1, x2: PX1, y2: PY1, class: 'v-line' }, svg);
        v.s('line', { x1: PX0, y1: PY0, x2: PX0, y2: PY1, class: 'v-line' }, svg);
        v.text(svg, PX1, PY1 + 18, 'time', { class: 'v-small v-end' });
        const input = v.s('path', { class: 'ng-input' }, svg);
        v.text(svg, PX0 + 8, PY1 + 34, 'input switched on', { class: 'v-small' });
        v.s('path', { d: `M${PX0 + (PX1 - PX0) / TMAX} ${PY1 + 8} v12`, class: 'v-faint' }, svg);
        const pathA = v.s('path', { class: 'ng-a' }, svg);
        const pathB = v.s('path', { class: 'ng-b' }, svg);
        const labA = v.text(svg, 0, 0, 'A', { class: 'v-strong ng-a-text', 'font-size': 14 });
        const labB = v.text(svg, 0, 0, 'B', { class: 'v-strong ng-b-text', 'font-size': 14 });

        // gauge
        const GX = 452, GY = 176, GR = 84;
        const gaugePt = (f, r) => [GX - r * Math.cos(Math.PI * f), GY - r * Math.sin(Math.PI * f)];
        const [a0x, a0y] = gaugePt(0, GR), [a1x, a1y] = gaugePt(1, GR);
        v.s('path', { d: `M${a0x} ${a0y} A${GR} ${GR} 0 0 1 ${a1x} ${a1y}`, class: 'ng-track' }, svg);
        const fill = v.s('path', { class: 'ng-fill' }, svg);
        [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
            const [x1, y1] = gaugePt(f, GR + 6), [x2, y2] = gaugePt(f, GR + 12), [tx, ty] = gaugePt(f, GR + 24);
            v.s('line', { x1: v.f1(x1), y1: v.f1(y1), x2: v.f1(x2), y2: v.f1(y2), class: 'v-tick' }, svg);
            v.text(svg, tx, ty + 4, String(f), { class: 'v-small v-mid' });
        });
        const needle = v.s('line', { x1: GX, y1: GY, x2: GX - GR + 14, y2: GY, class: 'ng-needle' }, svg);
        v.s('circle', { cx: GX, cy: GY, r: 4, class: 'v-hub' }, svg);
        const value = v.text(svg, GX, GY + 40, '', { class: 'v-num v-mid' });
        v.text(svg, GX, GY + 60, 'ν-gap between A and B', { class: 'v-small v-mid' });
        v.text(svg, GX - GR, GY + 84, '0: same dynamics', { class: 'v-small' });
        v.text(svg, GX + GR, GY + 84, '1: unrelated', { class: 'v-small v-end' });

        const B = { speed: 0, gain: 0, level: 0 }; // speed and gain as powers of two
        let shown = 0, yLo = -0.3, yHi = 1.3, demoT = 0;
        const fmtX = (x) => '×' + Math.pow(2, x).toFixed(2).replace(/\.?0+$/, '');
        const sSpeed = v.slider({ label: 'B: response time', min: -2, max: 2, step: 0.1, value: 0, format: fmtX, onInput(x) { B.speed = x; } });
        const sGain = v.slider({ label: 'B: strength of response', min: -2, max: 2, step: 0.1, value: 0, format: fmtX, onInput(x) { B.gain = x; } });
        const sLevel = v.slider({ label: 'B: level', min: -1, max: 1, step: 0.1, value: 0, format: (x) => (x > 0 ? '+' : '') + x.toFixed(1), onInput(x) { B.level = x; } });
        v.button({ label: 'Reset', quiet: true, onClick() { B.speed = 0; B.gain = 0; B.level = 0; sSpeed.set(0); sGain.set(0); sLevel.set(0); } });
        v.caption('Change how condition B responds to the same input as A. <strong>Moving its level</strong> doesn’t change the ν-gap, because nugap compares dynamics rather than expression levels. <strong>Changing how fast or how strongly it responds</strong> does. The ν-gap is calculated live for these two simple models.');

        function response(t, k, tau, lvl) { return lvl + (t < 1 ? 0 : k * (1 - Math.exp(-(t - 1) / tau))); }
        function render(dt) {
            const kB = Math.pow(2, B.gain), tB = Math.pow(2, B.speed);
            const target = nuGap(1, 1, kB, tB);
            shown = dt ? shown + (target - shown) * Math.min(1, dt * 8) : target;
            // axis range follows the curves
            const hi = Math.max(1, kB + B.level, B.level) + 0.35, lo = Math.min(0, B.level) - 0.35;
            yHi = dt ? yHi + (hi - yHi) * Math.min(1, dt * 5) : hi;
            yLo = dt ? yLo + (lo - yLo) * Math.min(1, dt * 5) : lo;
            const X = (t) => PX0 + (PX1 - PX0) * t / TMAX, Y = (y) => PY1 - (PY1 - PY0) * (y - yLo) / (yHi - yLo);
            let a = '', b = '';
            for (let i = 0; i <= 120; i++) {
                const t = TMAX * i / 120;
                a += (i ? 'L' : 'M') + v.f1(X(t)) + ' ' + v.f1(Y(response(t, 1, 1, 0)));
                b += (i ? 'L' : 'M') + v.f1(X(t)) + ' ' + v.f1(Y(response(t, kB, tB, B.level)));
            }
            pathA.setAttribute('d', a); pathB.setAttribute('d', b);
            input.setAttribute('d', `M${X(0)} ${PY1 - 6} H${X(1)} V${PY1 - 18} H${X(TMAX)}`);
            const ya = Y(response(TMAX, 1, 1, 0)), yb = Y(response(TMAX, kB, tB, B.level));
            const apart = Math.abs(ya - yb) < 14 ? (ya < yb ? -7 : 7) : 0;
            labA.setAttribute('x', X(TMAX) + 8); labA.setAttribute('y', v.f1(ya + 5 + apart));
            labB.setAttribute('x', X(TMAX) + 8); labB.setAttribute('y', v.f1(yb + 5 - apart));
            const f = Math.max(0, Math.min(1, shown));
            const [nx, ny] = gaugePt(f, GR - 14);
            needle.setAttribute('x2', v.f1(nx)); needle.setAttribute('y2', v.f1(ny));
            const [fx, fy] = gaugePt(f, GR);
            fill.setAttribute('d', f < 0.005 ? '' : `M${a0x} ${a0y} A${GR} ${GR} 0 0 1 ${v.f1(fx)} ${v.f1(fy)}`);
            value.textContent = shown.toFixed(2);
        }
        render(0);
        return {
            frame(dt) {
                if (v.auto()) {
                    // a slow demo: B speeds up and slows down, then shifts its level
                    demoT += dt;
                    const ph = (demoT % 16) / 16;
                    B.speed = ph < 0.5 ? 1.5 * Math.sin(ph * 2 * Math.PI) : 0;
                    B.level = ph >= 0.5 ? 0.8 * Math.sin((ph - 0.5) * 2 * Math.PI) : 0;
                    B.gain = 0;
                    sSpeed.set(Math.round(B.speed * 10) / 10); sLevel.set(Math.round(B.level * 10) / 10); sGain.set(0);
                }
                render(dt);
            },
            draw() { render(0); },
        };
    });

    /* ═══ PedNet: a family read as a graph ═══
       The family is PedNet's example consanguineous.ped. The relationships, kinship coefficients and probabilities
       are what PedNet 2.0.0 works out for it (graph.relationship, graph.inbreeding, infer_mode, classify_by_patterns). */
    Viz.register('pednet', function (v) {
        const svg = v.svg(560, 330, 'A four-generation family in which two of the four children of first cousins are affected, as PedNet analyses it: the loop that the cousins’ marriage makes, how closely each person is related to the proband, and the probability of each mode of inheritance.');
        const S = 11; // half the size of a symbol
        const COUSINS = 'the parents are cousins';
        const people = [
            { id: 'I-1', sex: 'm', x: 150, y: 52, rel: 'great-grandfather', why: ['twice over: through', 'both IV-1’s parents'], kin: 0.125, frac: '1/8' },
            { id: 'I-2', sex: 'f', x: 210, y: 52, rel: 'great-grandmother', why: ['twice over: through', 'both IV-1’s parents'], kin: 0.125, frac: '1/8' },
            { id: 'II-3', sex: 'f', x: 60, y: 122, rel: 'grandmother', kin: 0.125, frac: '1/8' },
            { id: 'II-1', sex: 'm', x: 120, y: 122, rel: 'grandfather', why: ['and great-uncle, through', 'IV-1’s mother'], kin: 0.1875, frac: '3/16', loop: true },
            { id: 'II-2', sex: 'f', x: 240, y: 122, rel: 'grandmother', why: ['and great-aunt, through', 'IV-1’s father'], kin: 0.1875, frac: '3/16', loop: true },
            { id: 'II-4', sex: 'm', x: 300, y: 122, rel: 'grandfather', kin: 0.125, frac: '1/8' },
            { id: 'III-1', sex: 'm', x: 150, y: 192, rel: 'father', why: ['more than ¼, as', COUSINS], kin: 0.28125, frac: '9/32', loop: true },
            { id: 'III-2', sex: 'f', x: 210, y: 192, rel: 'mother', why: ['more than ¼, as', COUSINS], kin: 0.28125, frac: '9/32', loop: true },
            { id: 'IV-1', sex: 'm', x: 105, y: 266, affected: true, proband: true },
            { id: 'IV-2', sex: 'f', x: 155, y: 266, affected: true, rel: 'sister', why: ['more than ¼, as', COUSINS], kin: 0.28125, frac: '9/32' },
            { id: 'IV-3', sex: 'm', x: 205, y: 266, rel: 'brother', why: ['more than ¼, as', COUSINS], kin: 0.28125, frac: '9/32' },
            { id: 'IV-4', sex: 'f', x: 255, y: 266, rel: 'sister', why: ['more than ¼, as', COUSINS], kin: 0.28125, frac: '9/32' },
        ];
        // PedNet's answer for the family, from exact likelihoods (infer_mode), most probable first
        const MODES = [['AR', 0.928], ['XLR', 0.027], ['AD', 0.026], ['XLD', 0.020]];

        ['I', 'II', 'III', 'IV'].forEach((g, i) => v.text(svg, 22, [56, 126, 196, 270][i], g, { class: 'v-label v-mid v-strong', 'font-family': 'var(--serif)' }));
        const loop = v.s('path', { d: 'M150 181 V157 H90 V122 H109 M120 111 V87 H240 V111 M251 122 H270 V157 H210 V181 M199 192 H161', class: 'pn-loop' }, svg);
        [
            'M161 52 H199',                                                   // I-1 and I-2
            'M180 52 V87 M120 87 H240 M120 87 V111 M240 87 V111',             // their son and daughter
            'M71 122 H109', 'M251 122 H289',                                  // who marry outside the family
            'M90 122 V157 H150 V181', 'M270 122 V157 H210 V181',              // and have III-1 and III-2
            'M161 190 H199 M161 194 H199',                                    // first cousins: a double line
            'M180 194 V229 M105 229 H255 M105 229 V255 M155 229 V255 M205 229 V255 M255 229 V255',
        ].forEach((d) => v.s('path', { d, class: 'pg-line' }, svg));

        const halo = v.s('circle', { r: S + 6, class: 'pn-halo' }, svg);
        let view = 'loop', picked = 3, since = 0;
        const nodes = people.map((p, i) => {
            const g = v.s('g', { class: 'pg-person', tabindex: '0', role: 'button' }, svg);
            if (p.sex === 'm') v.s('rect', { x: p.x - S, y: p.y - S, width: S * 2, height: S * 2, class: 'pg-sym' }, g);
            else v.s('circle', { cx: p.x, cy: p.y, r: S, class: 'pg-sym' }, g);
            if (p.affected) g.classList.add('is-affected');
            if (p.proband) {
                // the standard arrow to the lower-left corner, with P at its tail
                const tipX = p.x - S - 2, tipY = p.y + S + 2;
                v.s('path', { d: `M${tipX - 15} ${tipY + 15} L${tipX - 5} ${tipY + 5}`, class: 'pg-line' }, g);
                v.s('path', { d: `M${tipX} ${tipY} L${tipX - 8.5} ${tipY + 2.1} L${tipX - 2.1} ${tipY + 8.5} Z`, class: 'pg-arrow' }, g);
                v.text(g, tipX - 26, tipY + 24, 'P', { class: 'v-label v-strong' });
            }
            v.text(g, p.x, p.y + S + 13, p.id, { class: 'v-small v-mid', 'font-size': 9.5 }); // below, clear of the lines
            const pick = () => { picked = i; setView('kin'); v.touch(); render(); v.changed(); };
            g.addEventListener('click', pick);
            g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
            return g;
        });

        // the panel on the right: one group of text for each view
        const X = 360;
        const panel = v.s('g', {}, svg);
        const title = v.text(panel, X, 46, '', { class: 'v-title' });
        const big = v.text(panel, X, 92, '', { class: 'v-num' });
        const small = v.text(panel, X, 92, '', { class: 'v-label' });
        const lines = [0, 1, 2, 3].map((k) => v.text(panel, X, 124 + k * 19, '', { class: k < 1 ? 'v-strong' : '' }));
        const hint = v.text(panel, X, 292, '', { class: 'v-small' });
        const bars = MODES.map(([mode, p], k) => {
            const y = 72 + k * 26;
            const g = v.s('g', {}, svg);
            v.text(g, X, y + 4, mode, { class: 'v-strong', 'font-size': 12 });
            v.s('rect', { x: X + 38, y: y - 6, width: 112, height: 11, rx: 5.5, class: 'pn-track' }, g);
            const bar = v.s('rect', { x: X + 38, y: y - 6, width: 0, height: 11, rx: 5.5, class: 'pn-bar' }, g);
            v.text(g, X + 190, y + 4, p.toFixed(2), { class: 'v-end', 'font-size': 12 });
            return { g, bar, p };
        });

        const seg = v.segmented({
            label: 'Show', value: view,
            options: [{ label: 'Loops', value: 'loop' }, { label: 'Kinship', value: 'kin' }, { label: 'Mode of inheritance', value: 'mode' }],
            onChange(val) { setView(val); render(); },
        });
        v.caption('PedNet reads a family as a graph. <strong>Select anyone</strong> to see how they are related to the proband, IV-1, and their kinship coefficient, which counts every line of descent between them: in this family the children of first cousins are related to their great-grandparents through both parents. The probabilities of the modes of inheritance (AD and AR autosomal dominant and recessive, XLD and XLR X-linked) are PedNet’s own answer for the family.');

        function setView(val) {
            if (val !== view) { view = val; since = 0; }
            seg.set(view);
        }
        function show(el, text) { el.textContent = text; }
        function render() {
            const k = v.reduced() ? 1 : v.easeOut(Math.min(1, since / 0.9));
            // the loop through the cousins' parents and grandparents
            loop.style.opacity = view === 'loop' ? '' : '0';
            loop.style.strokeDasharray = '900';
            loop.style.strokeDashoffset = String(view === 'loop' ? 900 * (1 - k) : 900);
            nodes.forEach((g, i) => {
                g.classList.toggle('is-loop', view === 'loop' && !!people[i].loop);
                const p = people[i];
                g.setAttribute('aria-label', p.proband ? 'IV-1, the proband, affected. Select to see their inbreeding coefficient.'
                    : `${p.id}, IV-1’s ${p.rel}${p.affected ? ', affected' : ''}. Select to see their kinship with IV-1.`);
            });
            const who = people[picked];
            halo.style.opacity = view === 'kin' ? '1' : '0';
            halo.setAttribute('cx', who.x); halo.setAttribute('cy', who.y);
            bars.forEach((b) => { b.g.style.opacity = view === 'mode' ? '1' : '0'; b.bar.setAttribute('width', v.f1(112 * b.p * (view === 'mode' ? k : 0))); });
            show(small, '');
            if (view === 'loop') {
                show(title, 'Loops'); show(big, '1');
                ['a loop from consanguinity:', 'III-1 and III-2 are cousins,', 'so their four children are', 'inbred, with F = 1/16'].forEach((s, i) => show(lines[i], s));
                show(hint, '');
            } else if (view === 'kin') {
                if (who.proband) {
                    show(title, 'Inbreeding of IV-1'); show(big, '0.0625');
                    ['IV-1, the proband: F = 1/16', 'the chance that his two', 'copies of a gene came from', 'one ancestor, down both sides'].forEach((s, i) => show(lines[i], s));
                } else {
                    show(title, 'Kinship with IV-1'); show(big, who.kin < 0.2 ? who.kin.toString() : who.kin.toFixed(3));
                    // the fraction after the number, wherever the number ends
                    const width = big.getComputedTextLength ? big.getComputedTextLength() : 0;
                    small.setAttribute('x', v.f1(X + (width || 80) + 10));
                    show(small, who.frac);
                    const why = who.why || ['', ''];
                    [`${who.id} is IV-1’s ${who.rel}`, why[0], why[1], ''].forEach((s, i) => show(lines[i], s));
                }
                show(hint, 'Select anyone in the family');
            } else {
                show(title, 'Mode of inheritance'); show(big, '');
                ['', 'From exact likelihoods. The', 'pattern of affected people', 'alone gives AR 0.94'].forEach((s, i) => show(lines[i], s));
                show(hint, '');
            }
            // in the mode view the text goes below the bars
            lines.forEach((el, i) => el.setAttribute('y', (view === 'mode' ? 166 : 124) + i * 19));
        }
        render();
        const ORDER = ['loop', 'kin', 'mode'], LENGTH = { loop: 6, kin: 9, mode: 6 }, PICKS = [3, 6, 0, 9];
        return {
            frame(dt) {
                since += dt;
                if (v.auto()) {
                    // the demo: each view in turn, and in the kinship view a few people one after another
                    if (since > LENGTH[view]) setView(ORDER[(ORDER.indexOf(view) + 1) % ORDER.length]);
                    if (view === 'kin') picked = PICKS[Math.min(PICKS.length - 1, Math.floor(since / (LENGTH.kin / PICKS.length)))];
                }
                render();
            },
            draw() { render(); },
        };
    });

    /* ═══ Bioinformatics workbench: a tour of its tabs ═══ */
    Viz.register('workbench', function (v) {
        const svg = v.svg(560, 340, 'A browser window showing the Bioinformatics workbench: a terminal, notebooks, Galaxy, a genome browser, a 3D structure and a network.');
        v.s('rect', { x: 6, y: 6, width: 548, height: 328, rx: 12, class: 'wb-window' }, svg);
        v.s('path', { d: 'M6 40 H554', class: 'v-faint' }, svg);
        [0, 1, 2].forEach((i) => v.s('circle', { cx: 24 + i * 15, cy: 23, r: 4.5, class: 'wb-dot' }, svg));
        v.s('rect', { x: 92, y: 13, width: 380, height: 20, rx: 10, class: 'wb-url' }, svg);
        v.text(svg, 282, 27, 'comparativechrono.github.io/bioinformatics-workbench', { class: 'v-small v-mid', 'font-size': 10.5 });
        const TABS = ['Terminal', 'Notebook', 'Galaxy', 'Genomes', '3D', 'Networks'];
        const tabEls = TABS.map((name, i) => {
            const x = 18 + i * 88;
            const g = v.s('g', { class: 'wb-tab', tabindex: '0', role: 'tab', 'aria-label': name }, svg);
            v.s('rect', { x, y: 48, width: 82, height: 24, rx: 12, class: 'wb-tab-bg' }, g);
            v.text(g, x + 41, 64, name, { class: 'v-small v-mid' });
            const pick = () => { show(i); v.touch(); v.changed(); };
            g.addEventListener('click', pick);
            g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
            return g;
        });
        const scenes = TABS.map(() => v.s('g', { class: 'wb-scene' }, svg));
        const AREA = { x: 22, y: 86, w: 516, h: 232 };

        // Terminal: real programs, typed one after another
        const TERM = [
            ['$ ', 'fastp -i reads.fq.gz -o trimmed.fq.gz'],
            ['  ', '✓ trimmed.fq.gz'],
            ['$ ', 'minimap2 -a ref.fa trimmed.fq.gz > aln.sam'],
            ['$ ', 'samtools sort -o aln.bam aln.sam'],
            ['$ ', 'samtools index aln.bam'],
            ['$ ', 'bcftools mpileup -f ref.fa aln.bam | bcftools call -mv -o calls.vcf'],
            ['  ', '✓ calls.vcf'],
        ];
        const termLines = TERM.map((l, i) => v.text(scenes[0], AREA.x + 6, AREA.y + 18 + i * 26, '', { class: 'v-mono wb-term' + (l[0] === '  ' ? ' is-out' : '') }));
        const caret = v.s('rect', { width: 7, height: 13, class: 'wb-caret' }, scenes[0]);

        // Notebook: a cell and its chart
        const nb = scenes[1];
        v.s('rect', { x: AREA.x, y: AREA.y, width: AREA.w, height: 62, rx: 6, class: 'wb-cell' }, nb);
        v.text(nb, AREA.x + 10, AREA.y + 20, 'In [1]:', { class: 'v-mono v-small' });
        v.text(nb, AREA.x + 70, AREA.y + 20, "counts = pd.read_csv('counts.csv', index_col=0)", { class: 'v-mono wb-code' });
        v.text(nb, AREA.x + 70, AREA.y + 42, "counts.sum().plot.bar()", { class: 'v-mono wb-code' });
        const nbBars = [0.55, 0.8, 0.62, 0.95, 0.7, 0.45].map((hgt, i) => ({ hgt, el: v.s('rect', { x: AREA.x + 90 + i * 58, width: 36, rx: 3, class: 'wb-bar' }, nb) }));
        v.s('line', { x1: AREA.x + 74, y1: AREA.y + 216, x2: AREA.x + 450, y2: AREA.y + 216, class: 'v-line' }, nb);

        // Galaxy: tool form and a history filling with results
        const gx = scenes[2];
        v.text(gx, AREA.x, AREA.y + 12, 'Tools', { class: 'v-title' });
        ['fastp', 'minimap2', 'samtools', 'bcftools call', 'featureCounts', 'MACS3'].forEach((t, i) => v.text(gx, AREA.x, AREA.y + 38 + i * 24, t, { class: 'v-small' + (i === 1 ? ' v-strong' : '') }));
        v.s('rect', { x: AREA.x + 120, y: AREA.y, width: 210, height: 200, rx: 8, class: 'wb-cell' }, gx);
        v.text(gx, AREA.x + 134, AREA.y + 24, 'Map with minimap2', { class: 'v-label v-strong' });
        ['Reference genome', 'Reads', 'Preset'].forEach((f, i) => {
            v.text(gx, AREA.x + 134, AREA.y + 54 + i * 44, f, { class: 'v-small' });
            v.s('rect', { x: AREA.x + 134, y: AREA.y + 60 + i * 44, width: 182, height: 18, rx: 4, class: 'wb-field' }, gx);
        });
        v.text(gx, AREA.x + 352, AREA.y + 12, 'History', { class: 'v-title' });
        const hist = ['1: reads.fq.gz', '2: trimmed.fq.gz', '3: aln.bam', '4: calls.vcf'].map((t, i) => {
            const g = v.s('g', {}, gx);
            v.s('rect', { x: AREA.x + 352, y: AREA.y + 26 + i * 40, width: 160, height: 30, rx: 6, class: 'wb-hist' }, g);
            v.text(g, AREA.x + 362, AREA.y + 45 + i * 40, t, { class: 'v-small v-strong' });
            return g;
        });

        // Genome browser: a gene, reads and a variant
        const gb = scenes[3];
        v.s('line', { x1: AREA.x, y1: AREA.y + 14, x2: AREA.x + AREA.w, y2: AREA.y + 14, class: 'v-line' }, gb);
        for (let i = 0; i <= 8; i++) {
            const x = AREA.x + i * AREA.w / 8;
            v.s('line', { x1: x, y1: AREA.y + 10, x2: x, y2: AREA.y + 18, class: 'v-line' }, gb);
            const anchor = i === 0 ? 'start' : i === 8 ? 'end' : 'middle';
            if (i % 2 === 0) v.text(gb, x, AREA.y + 4, (12.40 + i * 0.01).toFixed(2) + ' Mb', { class: 'v-small', 'text-anchor': anchor, 'font-size': 9.5 });
        }
        v.s('line', { x1: AREA.x + 30, y1: AREA.y + 44, x2: AREA.x + 490, y2: AREA.y + 44, class: 'v-line' }, gb);
        [[30, 60], [150, 50], [260, 70], [400, 90]].forEach(([x, w]) => v.s('rect', { x: AREA.x + x, y: AREA.y + 36, width: w, height: 16, rx: 2, class: 'wb-exon' }, gb));
        const VAR = AREA.x + 300;
        const rr = v.rng(3);
        const reads = [];
        for (let row = 0; row < 7; row++) {
            let x = AREA.x + rr() * 40;
            while (x < AREA.x + AREA.w - 40) {
                const w = 70 + rr() * 60;
                const el = v.s('rect', { x: v.f1(x), y: AREA.y + 72 + row * 20, width: v.f1(Math.min(w, AREA.x + AREA.w - x)), height: 12, rx: 2, class: 'wb-read' }, gb);
                const hasVar = x < VAR && x + w > VAR && rr() < 0.6;
                const mark = hasVar ? v.s('rect', { x: VAR, y: AREA.y + 72 + row * 20, width: 5, height: 12, class: 'wb-var' }, gb) : null;
                reads.push({ el, mark, x });
                x += w + 6 + rr() * 30;
            }
        }

        // 3D: a turning alpha helix
        const helixG = scenes[4];
        const back = v.s('path', { class: 'wb-helix is-back' }, helixG);
        const front = v.s('path', { class: 'wb-helix' }, helixG);

        // Networks: nodes and edges, with a hub
        const net = scenes[5];
        const NODES = [[280, 200], [200, 150], [360, 150], [180, 250], [380, 250], [280, 110], [120, 190], [440, 190], [240, 290], [330, 290], [140, 110], [430, 110]];
        const EDGES = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 6], [2, 7], [3, 8], [4, 9], [5, 10], [5, 11], [1, 5], [2, 5], [8, 9], [6, 10], [7, 11], [0, 8], [0, 9]];
        EDGES.forEach(([a, b]) => v.s('line', { x1: NODES[a][0], y1: NODES[a][1], x2: NODES[b][0], y2: NODES[b][1], class: 'wb-edge' }, net));
        const netNodes = NODES.map(([x, y], i) => v.s('circle', { cx: x, cy: y, r: i === 0 ? 11 : 7, class: 'wb-node' + (i === 0 ? ' is-hub' : '') }, net));

        let tab = 0, t = 0, auto = 0;
        function show(i) {
            tab = i; t = 0;
            tabEls.forEach((g, k) => { g.classList.toggle('is-on', k === i); g.setAttribute('aria-selected', String(k === i)); });
            scenes.forEach((s, k) => { s.style.display = k === i ? '' : 'none'; });
            render();
        }
        v.caption('<strong>Select a tab.</strong> Real bioinformatics programs compiled to WebAssembly, Python and R notebooks, Galaxy, and viewers for genomes, protein structures and networks, all running in the browser.');

        function render() {
            const still = v.reduced();
            if (tab === 0) {
                let chars = still ? 1e9 : t * 34;
                TERM.forEach((l, i) => {
                    const full = l[0] + l[1];
                    const n = Math.max(0, Math.min(full.length, Math.floor(chars)));
                    termLines[i].textContent = full.slice(0, n);
                    chars -= full.length + 10;
                });
                const last = termLines.reduce((acc, el, i) => (el.textContent ? i : acc), 0);
                let bb = null;
                try { bb = termLines[last].getBBox(); } catch (e) { bb = null; }
                caret.setAttribute('x', v.f1(bb ? bb.x + bb.width + 2 : AREA.x + 6));
                caret.setAttribute('y', v.f1(AREA.y + 7 + last * 26));
                caret.style.opacity = still || Math.floor(t * 2) % 2 === 0 ? 1 : 0;
            } else if (tab === 1) {
                nbBars.forEach((b, i) => {
                    const k = still ? 1 : v.easeOut((t - 0.5 - i * 0.12) / 0.7);
                    const hgt = 130 * b.hgt * k;
                    b.el.setAttribute('y', v.f1(AREA.y + 216 - hgt)); b.el.setAttribute('height', v.f1(Math.max(0, hgt)));
                });
            } else if (tab === 2) {
                hist.forEach((g, i) => {
                    const k = still ? 1 : Math.min(1, Math.max(0, t - 0.5 - i * 0.7) / 0.4);
                    g.style.opacity = k.toFixed(2);
                    g.classList.toggle('is-done', still || t > 0.9 + i * 0.7);
                });
            } else if (tab === 3) {
                reads.forEach((r, i) => {
                    const k = still ? 1 : v.easeOut((t - (i % 9) * 0.06) / 0.6);
                    r.el.style.opacity = k.toFixed(2);
                    if (r.mark) r.mark.style.opacity = still || t > 1.2 ? 1 : 0;
                });
            } else if (tab === 4) {
                // a helix along a slanted axis, turning about that axis
                const ang = still ? 0.6 : t * 1.3;
                let fb = '', bk = '', fl = -2, bl = -2;
                for (let i = 0; i <= 240; i++) {
                    const sAx = i / 240, u = sAx * 6 * v.TAU + ang, ax = -200 + 400 * sAx;
                    const X = 280 + ax + 20 * Math.sin(u), Y = 202 + ax * 0.2 + 54 * Math.cos(u);
                    const cmd = v.f1(X) + ' ' + v.f1(Y);
                    if (Math.sin(u) >= 0) { fb += (fl === i - 1 ? 'L' : 'M') + cmd; fl = i; }
                    else { bk += (bl === i - 1 ? 'L' : 'M') + cmd; bl = i; }
                }
                front.setAttribute('d', fb); back.setAttribute('d', bk);
            } else if (tab === 5) {
                netNodes.forEach((c, i) => {
                    const pulse = still ? 0 : Math.sin(t * 2.4 - i * 0.6);
                    c.setAttribute('r', v.f1((i === 0 ? 11 : 7) + (i === 0 ? 2 : 1) * Math.max(0, pulse)));
                });
            }
        }
        show(0);
        return {
            frame(dt) {
                t += dt;
                if (v.auto()) {
                    auto += dt;
                    if (auto > 6) { auto = 0; show((tab + 1) % TABS.length); }
                } else auto = 0;
                render();
            },
            draw() { render(); },
        };
    });
})();
