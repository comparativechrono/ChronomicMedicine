# Undergraduate projects — interactive presentation

Live at **https://comparativechrono.org/undergraduate/** (linked from the site nav as “Undergraduates”).

It is a presentation and a web page at the same time: present it from a laptop in the lecture theatre, and students can open the same link (or scan the QR code on the first and last screens) to follow along and read the full project descriptions and papers later.

## Presenting

Open the page, press **F** for full screen, then use a clicker or the arrow keys.

| Key | Does |
| --- | --- |
| → · Space · Page Down | Next build step, or next screen (works with presentation clickers) |
| ← · Page Up | Previous screen (steps back through manual builds) |
| O | All screens (jump anywhere; also the small dial, top right) |
| F | Full screen |
| B or . | Black screen (any key brings it back) |
| T | Talk timer next to the dial: turns amber at 8 minutes and red at 10. Shift+T restarts it |
| D | Switch between light and dark (also the sun/moon button, top right). Shift+D goes back to automatic |
| Home · End | First or last screen |
| ? | Shortcut list |
| Esc | Close a panel |

Clicking with the mouse on an empty part of the screen also moves forward. On phones, swipe left and right or use the arrow buttons.

Most screens animate by themselves when they appear. Pressing → while a screen is still building jumps to its next step; once it has finished, → moves on. The **missing heritability** screen has three parts that only advance when you press →, so you can talk through each one.

Every project has a **Details and reading** button that opens the full description, practicalities, contacts and linked papers. Each screen also has its own address (for example `…/undergraduate/#solve`) if you want to send someone straight to one project.

### Suggested 10-minute running order

| # | Screen | Time |
| --- | --- | --- |
| 1 | Title (QR code for students’ phones) | 0:30 |
| 2 | The menu of projects and dissertations | 0:30 |
| 3 | What is genomic medicine? (chromosome → gene → letter) | 1:00 |
| 4 | Solve a rare disease patient! | 1:30 |
| 5 | Chronomic medicine (drag the clock hand) | 1:00 |
| 6 | Circadian disruption and missing heritability (3 builds) | 1:30 |
| 7 | Timing of human cell clock (press the hormone pulse) | 1:00 |
| 8 | Native Workbench | 1:00 |
| 9 | Dissertations | 1:00 |
| 10 | Come and talk to us (QR code and jump links for questions) | 0:30 |

### Before the talk

- It needs an internet connection for the fonts and the Genomics England logo (if the logo can’t load, its name appears instead). Everything else is in this folder, apart from `../theme.js`, which it shares with the rest of the site.
- **Light or dark:** like the rest of the site, it opens in the light theme between 07:00 and 19:00 on the presenting computer and dark otherwise, unless someone has chosen a theme in that browser. It never switches by itself during the talk. Press **D** to change it; pick whichever reads better on the projector.
- Do a quick run-through on the lecture-theatre computer. If the projector is unusually small or a 4:3 shape, the layout adapts, but it’s worth a look.
- The page respects the “reduce motion” accessibility setting; if that is switched on, animations show their final state instead.

## Files

| File | What it is |
| --- | --- |
| `index.html` | All the screens and their text. Each `<section class="scene">` is one screen, in order |
| `deck.css` | Styles. The colours for both themes are the variables at the top (dark first, then light); fonts match `../style.css` |
| `deck.js` | Navigation, clock-wipe transitions, build steps, the dial, overview and details panel. No need to edit this to change content |
| `visuals.js` | The animated diagrams, one block per screen, keyed by the screen’s `id` |
| `qr.svg` | QR code for `https://comparativechrono.org/undergraduate/` (the address doesn’t change, so this can stay) |

## Updating it for next year

1. **Keep a copy of this year (optional).** Copy the whole `undergraduate` folder to a new top-level folder called `undergraduate-2026-27`. Nothing inside needs changing, and it stays online at `comparativechrono.org/undergraduate-2026-27/`.
2. **Change the year** in `index.html` (search for `2026–27`: the `<title>`, the header and the title screen) and in the “Undergraduate projects” band on the homepage (`../index.html`).
3. **Edit a project:** change the text in its `<section class="scene">`. The full description, contacts and reading list are in the `<div class="details" hidden>` block just below it. Reading-list entries look like this:

   ```html
   <li><a href="https://doi.org/10.xxxx/xxxxx" target="_blank" rel="noopener">Paper title</a><span class="ref-meta">Author A et al. (2025) Journal 1:23</span></li>
   ```

4. **Remove a project:** delete its whole `<section>`. The menu dial, the overview, the closing screen’s jump links and the count of projects and dissertations under the menu’s title all update themselves.
5. **Add a project:** copy an existing project `<section>`, give it a new `id`, and set
   - `data-option="project"` (or `"dissertation"`),
   - `data-cat="computational"`, `"lab"` or `"dissertation"` (sets the colour),
   - `data-short="Short title for the menu"`.

   A new project has no animation until you add one: either reuse an existing diagram, put an image in its `<figure class="scene-visual">`, or add a block to `visuals.js` with `Deck.register('your-id', { init(scene) {…}, frame(dt) {…} })`.
6. **Dissertations** are the cards in the `dissertations` screen. Copy a `<article class="ds-card">` to add one; its `data-option="dissertation"` makes it appear on the menu dial automatically.
7. **Build steps:** `data-steps="2"` gives a screen two extra steps; `data-autoplay="2000"` plays them every 2 seconds, `data-autoplay="off"` waits for a key press. Inside the screen, `data-show-at="1"` shows an element from step 1 onwards and `data-step-only="1"` shows it on step 1 only.
8. **Both themes:** check any change in light and dark (press **D**). Give new diagrams colours with the variables at the top of `deck.css` (`var(--accent)`, `var(--c-comp)`, `var(--c-lab)`, `var(--c-diss)`, `var(--text)`…) rather than fixed colours. An image that only works on one background needs two versions: give the one for dark backgrounds `class="only-dark"` and the one for light backgrounds `class="only-light"`, as with the Genomics England logo.

Facts on the genomic medicine screen are referenced in its **Sources** panel; check they are still current each year.
