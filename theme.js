/* ═══════════════════════════════════════════
   CHRONOMIC MEDICINE — LIGHT / DARK THEME

   By default the site follows the visitor's local time:
   light from 07:00 to 19:00, dark the rest of the time.
   (The same rule is in the small script in each page's <head>,
   which sets the theme before the page is drawn.)

   Anyone can override it with the sun/moon button or the
   Auto / Light / Dark control in the footer. Their choice is kept
   in localStorage ('cm-theme') and applies on every page,
   including the undergraduate presentation.

   Buttons:  [data-theme-toggle]        switches light <-> dark
             [data-theme-choice="auto"]  (or "light" / "dark")
   Pages can listen for the 'themechange' event on document.
   ═══════════════════════════════════════════ */
(function () {
    'use strict';

    var KEY = 'cm-theme';
    var DAY_START = 7;   // 07:00
    var DAY_END = 19;    // 19:00
    var COLOURS = { dark: '#060a14', light: '#ffffff' };
    var root = document.documentElement;

    function stored() {
        try {
            var v = localStorage.getItem(KEY);
            return v === 'light' || v === 'dark' ? v : null;
        } catch (e) { return null; }
    }
    function store(v) {
        try {
            if (v) localStorage.setItem(KEY, v);
            else localStorage.removeItem(KEY);
        } catch (e) { /* private browsing: the choice lasts for this page only */ }
    }
    function byClock(date) {
        var h = (date || new Date()).getHours();
        return h >= DAY_START && h < DAY_END ? 'light' : 'dark';
    }
    function preference() { return stored() || 'auto'; }
    function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

    // The sweep turns around the homepage clock when it is on screen,
    // otherwise around the middle of the window.
    function sweepCentre() {
        var w = window.innerWidth, h = window.innerHeight;
        var el = document.querySelector('[data-sweep-centre]');
        if (el) {
            var r = el.getBoundingClientRect();
            if (r.width && r.bottom > 0 && r.top < h) return [r.left + r.width / 2, r.top + r.height / 2];
        }
        return [w / 2, h / 2];
    }

    function sync() {
        var theme = current();
        var pref = preference();
        var label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        var toggles = document.querySelectorAll('[data-theme-toggle]');
        for (var i = 0; i < toggles.length; i++) {
            toggles[i].setAttribute('aria-label', label);
            toggles[i].setAttribute('title', label);
        }
        var choices = document.querySelectorAll('[data-theme-choice]');
        for (var j = 0; j < choices.length; j++) {
            choices[j].setAttribute('aria-pressed', String(choices[j].getAttribute('data-theme-choice') === pref));
        }
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', COLOURS[theme]);
    }

    function apply(theme, animate) {
        if (theme === current() && root.hasAttribute('data-theme')) { sync(); return; }
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var commit = function () {
            root.setAttribute('data-theme', theme);
            sync();
            document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
        };
        if (!animate || reduce) { commit(); return; }

        if (document.startViewTransition && window.CSS && CSS.registerProperty) {
            var p = sweepCentre();
            root.style.setProperty('--vt-x', p[0] + 'px');
            root.style.setProperty('--vt-y', p[1] + 'px');
            root.classList.add('theme-sweep');
            var t = document.startViewTransition(commit);
            var done = function () { root.classList.remove('theme-sweep'); };
            t.finished.then(done, done);
        } else {
            root.classList.add('theme-fade');
            commit();
            setTimeout(function () { root.classList.remove('theme-fade'); }, 520);
        }
    }

    // pref: 'auto' | 'light' | 'dark'
    function choose(pref, animate) {
        store(pref === 'auto' ? null : pref);
        apply(pref === 'auto' ? byClock() : pref, animate !== false);
        sync();
    }
    function toggle() { choose(current() === 'dark' ? 'light' : 'dark'); }

    window.CMTheme = {
        current: current,
        preference: preference,
        choose: choose,
        toggle: toggle,
        byClock: byClock,
        dayStart: DAY_START,
        dayEnd: DAY_END,
    };

    function init() {
        if (!root.hasAttribute('data-theme')) root.setAttribute('data-theme', stored() || byClock());

        document.addEventListener('click', function (e) {
            var b = e.target.closest && e.target.closest('[data-theme-toggle], [data-theme-choice]');
            if (!b) return;
            e.preventDefault();
            if (b.hasAttribute('data-theme-toggle')) toggle();
            else choose(b.getAttribute('data-theme-choice'));
        });

        // A visitor on automatic who comes back to the tab after 07:00 or 19:00
        // sees the page change over. Pages can opt out with data-theme-follow="off".
        if (root.getAttribute('data-theme-follow') !== 'off') {
            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible' && !stored()) apply(byClock(), true);
            });
        }
        // Keep other open tabs in step with a new choice
        window.addEventListener('storage', function (e) {
            if (e.key === KEY) apply(stored() || byClock(), true);
        });
        sync();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
