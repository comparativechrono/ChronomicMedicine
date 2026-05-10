/* ═══════════════════════════════════════════
   CHRONOMIC MEDICINE — SHARED JS
   ═══════════════════════════════════════════ */

/* ─── CSV Parser ─── */
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = csvLine(lines[0]);
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = csvLine(line);
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = (vals[i] || '').trim());
        return obj;
    });
}
function csvLine(line) {
    const r = []; let c = '', q = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) {
            if (ch === '"' && line[i+1] === '"') { c += '"'; i++; }
            else if (ch === '"') q = false;
            else c += ch;
        } else {
            if (ch === '"') q = true;
            else if (ch === ',') { r.push(c); c = ''; }
            else c += ch;
        }
    }
    r.push(c);
    return r;
}

async function loadCSV(p) {
    try { const r = await fetch(p); if (!r.ok) return []; return parseCSV(await r.text()); }
    catch { return []; }
}

/* ─── Helpers ─── */
function getInitials(name) {
    return name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\s+/i, '').split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Nav ─── */
function initNav() {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!nav) return;

    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('open');
            toggle.classList.toggle('open');
        });
        links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            links.classList.remove('open');
            toggle.classList.remove('open');
        }));
    }

    // Footer year
    const yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();
}

/* ─── Scroll Reveal ─── */
function initReveal() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
});
