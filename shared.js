/* ═══════════════════════════════════════════
   CHRONOMIC MEDICINE — SHARED JS
   CSV loading, nav, scroll reveal and footer year.
   (Light/dark theme is in theme.js.)
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
            else if (ch !== '\r') c += ch;
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
// Escape text from the CSV files before putting it into the page
function esc(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getInitials(name) {
    return name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\s+/i, '').split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Nav ─── */
function initNav() {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!nav) return;

    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && links) {
        const setOpen = (open) => {
            links.classList.toggle('open', open);
            toggle.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', String(open));
        };
        toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
        links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && links.classList.contains('open')) { setOpen(false); toggle.focus(); }
        });
    }

    // Footer year
    const yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();
}

/* ─── Scroll Reveal ─── */
let revealObserver = null;
function initReveal() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        return;
    }
    if (!revealObserver) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
            });
        // threshold 0 so that very tall sections (a long publication list on a phone) still appear
        }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    }
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
});
