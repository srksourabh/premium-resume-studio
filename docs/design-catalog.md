# Design catalog — 100+ context-picked designs

The Studio never hands you the same look by default. It carries a catalog of **138
design models** and picks the one that fits the person — then lets you explore the rest.

## How a design is composed

Each design model is a curated combination of four orthogonal axes, so they look
genuinely different (not just recolored):

| Axis | Values |
|------|--------|
| **Layout family** | `executive` (left sidebar) · `sidebar-right` · `single` (single column) · `header-band` (full-width hero) · `academic` · `fresher` |
| **Palette** | 18 — `midnight-gold`, `graphite-azure`, `royal-emerald`, `ocean-coral`, `noir-gold`, `slate-mono`, … (`--list-themes`) |
| **Typography** | `sans`, `serif-head`, `mono-accent`, `classic-serif`, `display` |
| **Ornaments** | section-title (rule / bar / pilltab / underline / block) · marker (dot / ring / square / diamond) · pill · metric card · monogram shape |

Catalog + axes live in `scripts/lib/design/` (`catalog.js`, `typography.js`, `ornaments.js`).

## How it chooses (best fit, reproducible)

`scripts/lib/design/select.js` filters the catalog to designs tagged for the detected
**archetype**, then scores each by **seniority** (executives get sober/formal looks;
freshers get bold/energetic ones) and **industry** (detected from the headline/roles —
tech → graphite/steel, finance → navy/emerald, creative → plum/coral, academia → serif
navy, and so on). The top-scoring design wins.

The pick is **deterministic**: the same profile always yields the same design; different
people and roles get different ones. Example — Sourabh (founder, IT/AI) →
**#7 Graphite Azure Executive**; a finance CFO would land on a navy one; a designer on a
coral header-band.

## Exploring and overriding

```bash
node scripts/build_resume.js --profile p.json --out r.pdf              # best fit
node scripts/build_resume.js --profile p.json --out r.pdf --variant 3  # 3rd-best fit
node scripts/build_resume.js --profile p.json --out r.pdf --random     # random on-brand
node scripts/build_resume.js --profile p.json --out r.pdf --design header-band-ocean-coral-sans
node scripts/build_resume.js --profile p.json --out r.pdf --design 54  # by catalog number
node scripts/build_resume.js --list-designs                            # all 138
node scripts/build_resume.js --profile p.json --out r.pdf --theme royal-emerald  # force palette only
```

The build banner prints which design was chosen and why:

```
│  Design    : #7   Graphite Azure Executive              │
Layout: executive · Palette: graphite-azure · Type: sans
Chosen: best fit for executive/executive · industry: tech  (28 designs fit · 138 total)
```

## Adding more designs

Add a palette to `themes.js`, a font pairing to `typography.js`, an ornament option to
`ornaments.js`, or extend a family's palette/type pool in `catalog.js` — the catalog and
selector pick them up automatically, growing well past 138.
