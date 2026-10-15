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

/* ─── News (homepage cards and the News page) ─── */
// A translated story has a language code in the language column (fr → "French")
function languageName(code) {
    try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code; }
    catch { return code; }
}
// Links to other sites open in a new tab. A translated title is marked with its
// language so that screen readers pronounce it properly.
function newsLink(n, text) {
    const title = n.language ? `<span lang="${esc(n.language)}">${esc(text)}</span>` : esc(text);
    if (!n.link) return title;
    const external = /^https?:\/\//i.test(n.link) && !/^https?:\/\/(www\.)?comparativechrono\.org/i.test(n.link);
    return `<a href="${esc(n.link)}"${external ? ' target="_blank" rel="noopener"' : ''}>${title}` +
        (external ? '<span class="news-ext" aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span>' : '') + '</a>';
}
function newsMeta(n) {
    return `<p class="news-meta"><time datetime="${esc(n.date)}">${esc(formatDate(n.date))}</time>` +
        (n.tag ? `<span class="news-tag">${esc(n.tag)}</span>` : '') +
        (n.language ? `<span class="news-lang">In ${esc(languageName(n.language))}</span>` : '') + '</p>';
}
function newsEntry(n) {
    return `<article class="news-entry">${newsMeta(n)}<h3 class="news-entry-title">${newsLink(n, n.title)}</h3>` +
        (n.summary ? `<p class="news-entry-summary">${esc(n.summary)}</p>` : '') + '</article>';
}
function newsCard(n) {
    return `<article class="news-card">${newsMeta(n)}<h3 class="news-card-title">${newsLink(n, n.title)}</h3>` +
        (n.summary ? `<p class="news-card-summary">${esc(n.summary)}</p>` : '') + '</article>';
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
