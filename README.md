# Chronomic Medicine Group — Website

Multi-page static site for GitHub Pages. CSV-driven content with automatic photo loading, and light and dark colour themes.

## Hosting

GitHub Pages serves the `main` branch of this repository (Settings → Pages → Source: main branch, / (root)).
Custom domain `comparativechrono.org` (the `CNAME` file) with DNS A records to `185.199.108-111.153`.
Pushing to `main` updates the live site within a minute or two. There is no build step.

## Pages

| Page | File | Content |
|------|------|---------|
| Homepage | `index.html` | 24-hour clock showing the visitor’s local time, about, a carousel of current projects (each with its diagram), the three latest news stories, join CTA, contact |
| People | `people.html` | PI card, current members (photo grid + modals), alumni list |
| Research | `research.html` | Every current project with an interactive diagram, and an overview dial at the top |
| Publications | `publications.html` | Publications by year, with a year chart, type filters and search |
| Software | `software.html` | Pedigree Studio, the Pedigree workbench and their Python packages, PedNet, nugap, the Bioinformatics workbench, software for teaching (www.genomics.tel) and more code |
| News | `news.html` | All news stories by year, with filters by kind of story |
| Undergraduates | `undergraduate/index.html` | Interactive presentation of this year’s undergraduate projects and dissertations (see `undergraduate/README.md` for presenting and yearly updates) |

## Light and dark themes

The site has a dark theme (navy and gold) and a light theme (blue on white).

- **Default:** chosen by the visitor’s local time. Light from 07:00 to 19:00, dark otherwise. The coloured rim of the homepage clock shows these hours.
- **Choosing:** the sun/moon button in the top bar switches theme, and the footer has **Auto / Light / Dark**. A visitor’s choice is remembered in their browser (`localStorage` key `cm-theme`) across all pages, including the undergraduate presentation; **Auto** clears it.
- **Colours** are CSS variables at the top of `style.css`: one block for dark (`:root, [data-theme="dark"]`) and one for light (`[data-theme="light"]`). Use the variables (`var(--accent)`, `var(--text)`, `var(--surface)`…) rather than fixed colours, so anything new works in both themes. The presentation has its own pair of blocks at the top of `undergraduate/deck.css`.
- **Changing the hours:** edit `DAY_START` and `DAY_END` in `theme.js`, the one-line script in the `<head>` of each page (it sets the theme before the page is drawn, so there is no flash of the wrong colours), and the footer note “Auto follows your local time…”.
- **A new page** needs the `<head>` script, `<script src="theme.js"></script>` before `shared.js`, and the toggle button from the nav of an existing page. The nav is written out in each page, so a new link has to be added to all of them.

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

Set `status` to `current` or `completed`. Current projects appear on the Research page and in the homepage carousel, in the order of the file. The carousel opens on the cardiac arrhythmia project (`id` `cardiac-arrhythmia`); to open on another, change `FIRST` in the carousel script in `index.html`.

| Column | Description |
|--------|-------------|
| title | Project title |
| status | **`current`** or **`completed`** |
| registry_id | Genomics England project number (optional, shown as a tag) |
| pillar | Theme: `Cardiac`, `Cancer`, `Immunity`, `Endocrine`, `Pharmacogenomics` or `Diagnostics` (sets the colour; any other word uses the site’s accent colour) |
| summary | One-line summary |
| description | Full description (shown under “More about this project”) |
| id | Short web address for the project, e.g. `cardiac-arrhythmia` → `research.html#cardiac-arrhythmia` (letters, numbers and hyphens) |
| short | Short name for the overview list and the carousel dots |
| visual | Which interactive diagram to show (see below). Leave empty for a clock of genes switching on through the day |

#### Interactive diagrams

The diagrams are in `viz-projects.js`, one block per diagram, and any project can use any of them:

| `visual` | Shows |
|----------|-------|
| `heart-clock` | Heart rate and QT interval through the day (drag the clock hand) |
| `conserved-gene` | A gene shared by plants, flies, fish and people, and a normal or long QT interval |
| `repair` | DNA mismatch repair and microsatellites, with cell division timed by the body clock |
| `chronotype` | Morning and evening types exposed to an infection at the same clock time |
| `steroids` | The cortisol pathway, CYP21A2 and the daily profiles of cortisol and 17-OHP |
| `enrichment` | Whether the overlap between two gene lists is bigger than chance (shuffle test and Fisher’s exact test) |
| `dosing` | When a drug is taken, metaboliser genotype, and time in the useful range |
| `panels` | Gene panels and super panels, and how many patients get a diagnosis |
| `gene-clock` | Genes peaking at different times of day (the default) |

The words under each diagram are in its `v.caption(...)` line in `viz-projects.js`. Numbers in the diagrams are illustrative, and the captions say so where it matters. To make a new diagram, copy one of the blocks, give it a new name in `Viz.register('name', …)`, and put that name in the project’s `visual` column. Diagrams only animate while they are on screen, and show a still picture to visitors who have asked their device to reduce motion.

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

Publications are grouped by year, newest first, on the Publications page. The year chart, type filters and search are built from the file, so there is nothing else to update. The group leader’s name is shown in bold in author lists.

### News: `data/news.csv`

| Column | Description |
|--------|-------------|
| date | YYYY-MM-DD |
| title | Headline |
| summary | Short description |
| link | URL (optional; makes the headline a link — links to other sites open in a new tab) |
| tag | Kind of story, e.g. `Paper`, `The Conversation`, `Event`, `Lab news` (optional; shown as a label, and the News page has a filter button for each tag) |
| language | Only for a story in another language, such as a translation of an article: its language code, e.g. `fr`, `id` (Indonesian) or `pt` (optional; leave empty for English). The story is labelled “In French” and so on |

Stories can be in any order in the file: they are sorted by date. The homepage shows the three most recent as cards (leaving out stories with a language, since those are translations of articles already listed), and the News page shows them all, grouped by year.

### Software: `data/software.csv`

Pedigree Studio, PedNet, nugap and the Bioinformatics workbench have their own sections in `software.html` (with the links in the page itself). Everything else on the Software page comes from this file, one row per piece of software:

| Column | Description |
|--------|-------------|
| name | Name, as shown on the card (package names are shown in a code font) |
| group | Where it goes: `pedigree-studio` (Python packages for pedigree files), `teaching` (Software in teaching) or `more` (More code) |
| description | One or two sentences |
| url | Link to use it online (optional; shown as “Open”) |
| github | GitHub repository URL (optional) |
| pypi | Name on PyPI (optional; adds a PyPI link and a “pip install” line with a copy button) |
| zenodo | Zenodo DOI, e.g. `10.5281/zenodo.20693443` (optional) |
| language | R, Python, JavaScript… (optional) |

The diagrams on the Software page are in `viz-software.js`. The file-format map lights up the route for whichever package card the visitor points at; a new package that converts between formats needs a route added there too (the `ROUTES` list in the `formats` block).

## File Structure
```
├── index.html          Homepage (with the projects carousel)
├── people.html         Members page
├── research.html       Research projects, each with an interactive diagram
├── publications.html   Publications, with year chart, filters and search
├── software.html       Software and teaching
├── news.html           All news stories
├── style.css           Shared styles (theme colours at the top)
├── viz.css             Colours and styles for the interactive diagrams
├── theme.js            Light/dark theme: default by local time, toggle, remembered choice
├── shared.js           Shared CSV parser + nav + reveal
├── viz.js              Small engine for the interactive diagrams
├── viz-projects.js     Research project diagrams
├── viz-software.js     Software page diagrams
├── CNAME               Custom domain
├── undergraduate/      Undergraduate projects presentation (own README)
│   ├── index.html      Screens, text and reading lists
│   ├── deck.css / deck.js / visuals.js
│   └── qr.svg          QR code for comparativechrono.org/undergraduate
├── data/
│   ├── members.csv     → People page
│   ├── projects.csv    → Research page and homepage carousel
│   ├── publications.csv→ Publications page
│   ├── news.csv        → News page and homepage
│   └── software.csv    → Software page
└── photos/
    ├── README.md       Photo naming guide
    └── *.jpg           Member headshots (square, 400×400)
```
