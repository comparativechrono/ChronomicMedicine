# Chronomic Medicine Group — Website

Multi-page static site for GitHub Pages. CSV-driven content with automatic photo loading.

## Quick Start

```bash
git init && git add . && git commit -m "Initial site"
git remote add origin https://github.com/comparativechrono/comparativechrono.github.io.git
git push -u origin main
```

GitHub → Settings → Pages → Source: main branch, / (root).  
Custom domain → `comparativechrono.org` + DNS A records to `185.199.108-111.153`.

## Pages

| Page | File | Content |
|------|------|---------|
| Homepage | `index.html` | Clock hero, about, research pillars, news, join CTA, contact |
| People | `people.html` | PI card, current members (photo grid + modals), alumni list |
| Research | `research.html` | Projects (expandable), publications (with badges), open data |

## Updating Content

Edit the CSV files in `data/` and push. No build step needed.

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

### News: `data/news.csv`

| Column | Description |
|--------|-------------|
| date | YYYY-MM-DD |
| title | Headline |
| summary | Short description |
| link | URL (optional) |

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
├── style.css           Shared styles
├── shared.js           Shared CSV parser + nav + reveal
├── CNAME               Custom domain
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
