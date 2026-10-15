# Chronomic Medicine Group — Website

Multi-page static site for GitHub Pages. CSV-driven content with automatic photo loading, and light and dark colour themes.

## Hosting

GitHub Pages serves the `main` branch of this repository (Settings → Pages → Source: main branch, / (root)).
Custom domain `comparativechrono.org` (the `CNAME` file) with DNS A records to `185.199.108-111.153`.
Pushing to `main` updates the live site within a minute or two. There is no build step.

## Pages

| Page | File | Content |
|------|------|---------|
| Homepage | `index.html` | 24-hour clock showing the visitor’s local time, about, research pillars, news, join CTA, contact |
| People | `people.html` | PI card, current members (photo grid + modals), alumni list |
| Research | `research.html` | Projects (expandable), publications (with badges), open data |
| Undergraduates | `undergraduate/index.html` | Interactive presentation of this year’s undergraduate projects and dissertations (see `undergraduate/README.md` for presenting and yearly updates) |

## Light and dark themes

The site has a dark theme (navy and gold) and a light theme (blue on white).

- **Default:** chosen by the visitor’s local time. Light from 07:00 to 19:00, dark otherwise. The coloured rim of the homepage clock shows these hours.
- **Choosing:** the sun/moon button in the top bar switches theme, and the footer has **Auto / Light / Dark**. A visitor’s choice is remembered in their browser (`localStorage` key `cm-theme`) across all pages, including the undergraduate presentation; **Auto** clears it.
- **Colours** are CSS variables at the top of `style.css`: one block for dark (`:root, [data-theme="dark"]`) and one for light (`[data-theme="light"]`). Use the variables (`var(--accent)`, `var(--text)`, `var(--surface)`…) rather than fixed colours, so anything new works in both themes. The presentation has its own pair of blocks at the top of `undergraduate/deck.css`.
- **Changing the hours:** edit `DAY_START` and `DAY_END` in `theme.js`, the one-line script in the `<head>` of each page (it sets the theme before the page is drawn, so there is no flash of the wrong colours), and the footer note “Auto follows your local time…”.
- **A new page** needs the `<head>` script, `<script src="theme.js"></script>` before `shared.js`, and the toggle button from the nav of an existing page.

Switching theme sweeps the new colours round like a clock hand in browsers that support view transitions, fades in others, and is instant if the visitor has asked their device to reduce motion.

## Updating Content

Edit the CSV files in `data/` and push. No build step needed.
Put double quotes around any field that contains a comma (for example a description), otherwise the columns after it shift.

### Adding/removing members: `data/members.csv`

Set `status` to `current` or `former` — that's all it takes to move someone to the alumni list.

| Column | Required | Description |
|--------|----------|-------------|
| name | yes | Full name |
| role | yes | Displayed role (e.g. "PhD Student") |
| status | yes | **`current`** or **`former`** — controls where they appear |
| level | yes | `pi`, `phd`, `grad`, `visiting`, `postdoc`, `undergrad` |
| description | no | Bio text (shows in modal popup) |
| interests | no | Comma-separated research interests |
| email | no | Email address |
| photo | no | Filename stem in `photos/` (e.g. `tim-hearn` → `photos/tim-hearn.jpg`) |
| github | no | GitHub username |
| orcid | no | ORCID ID |
| scholar | no | Google Scholar user ID |

### Adding photos: `photos/`

Drop a square JPEG into `photos/` named to match the `photo` field:
- `photo` field = `tim-hearn` → file = `photos/tim-hearn.jpg`
- If no photo exists, initials are shown automatically

Recommended: 400×400px square crop, JPEG, under 200KB.

### Projects: `data/projects.csv`

Set `status` to `current` or `completed`.

| Column | Description |
|--------|-------------|
| title | Project title |
| status | **`current`** or **`completed`** |
| registry_id | Genomics England ID (optional, shows as badge) |
| pillar | Category tag (e.g. Cardiac, Cancer, Immunity) |
| summary | One-line summary |
| description | Full description (shows when expanded) |

### Publications: `data/publications.csv`

| Column | Description |
|--------|-------------|
| year | Publication year |
| authors | Author list |
| title | Paper title |
| journal | Journal name |
| doi | DOI (shows as clickable badge) |
| pdf | PDF URL (shows as badge) |
| github | Code repo URL (shows as badge) |
| preprint | Preprint URL (shows as badge) |
| type | `article`, `review`, `abstract`, `commentary`, `preprint` or `chapter` (shown above the title) |

Publications are grouped by year, newest first.

### News: `data/news.csv`

| Column | Description |
|--------|-------------|
| date | YYYY-MM-DD |
| title | Headline |
| summary | Short description |
| link | URL (optional; makes the headline a link) |

The homepage shows the four most recent items, newest first.

### Tools: `data/tools.csv`

| Column | Description |
|--------|-------------|
| name | Resource name |
| type | repository, dataset, tool |
| description | What it is |
| url | Link |
| language | R, Python, etc. |

## File Structure
```
├── index.html          Homepage
├── people.html         Members page
├── research.html       Projects + publications + tools
├── style.css           Shared styles (theme colours at the top)
├── theme.js            Light/dark theme: default by local time, toggle, remembered choice
├── shared.js           Shared CSV parser + nav + reveal
├── CNAME               Custom domain
├── undergraduate/      Undergraduate projects presentation (own README)
│   ├── index.html      Screens, text and reading lists
│   ├── deck.css / deck.js / visuals.js
│   └── qr.svg          QR code for comparativechrono.org/undergraduate
├── data/
│   ├── members.csv     → People page
│   ├── projects.csv    → Research page
│   ├── publications.csv→ Research page
│   ├── news.csv        → Homepage
│   └── tools.csv       → Research page
└── photos/
    ├── README.md       Photo naming guide
    └── *.jpg           Member headshots (square, 400×400)
```
