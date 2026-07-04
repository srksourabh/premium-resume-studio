# Premium Resume Studio

**A resume builder for anyone who wants a professional-yet-creative résumé that stands out** —
and a quality gate that won't let it ship until it's genuinely good.

Feed it one JSON profile. It figures out the rest:

1. 🧭 **Auto-decides the archetype** — executive, academic, fresher, technical, or general.
   You don't pick a template; the Studio reads your profile and chooses.
2. 🔎 **Researches you** — web + LinkedIn lookup to fill gaps and verify claims (never invents).
3. 🎨 **Renders a premium PDF** — colorful but sober, real CSS design, printed by Chromium.
4. 🏛️ **Scores it with a Model Council** and **iterates until it clears 85 / 100.**

Plus: a **138-design catalog** it picks from by context (layout × palette × typography ×
ornaments — never the same look by default), **PDF + DOCX + ODT** output, an **ATS-safe
plain-text** export, a **cover-letter draft**, and an **auto-fit** layout that fills the pages
it uses (no blank tail).

## Why it stands out

- **Freshers get noticed.** The early-career design leads with a bold hero, a color
  "spotlight" strip of standout numbers, leveled skill bars, and a projects grid — engineered
  to catch a recruiter's eye in a tall CV stack.
- **Executives look board-ready.** Deep sidebar, data-driven metric strip, venture timeline,
  product cards — CEO-grade without being loud.
- **Academics get a real CV.** Numbered publications, grants, teaching, serif typography.
- **Every resume is scored**, so "done" means *measurably good*, not just *finished*.

## Install it once, use it everywhere

This is an **Agent Skill**. Install it globally and it's available in **every** Claude Code
project (full matrix — project, plugin, CLI, Gemini — in [`docs/INSTALL.md`](docs/INSTALL.md)):

```bash
git clone https://github.com/srksourabh/premium-resume-studio.git
cd premium-resume-studio
./install-skill.sh          # → ~/.claude/skills/premium-resume-studio  (+ Chromium)
```

Restart Claude Code (or `/reload`), check `/skills`, then just ask:

> "build me a standout resume from my profile"

**Or install as a Claude Code plugin:**

```
/plugin marketplace add srksourabh/premium-resume-studio
/plugin install premium-resume-studio@premium-resume-studio
```

**Or use the CLI directly (no agent):**

```bash
./install.sh                                     # Playwright + Chromium (one-time)
node scripts/build_resume.js --profile profile/sourabh.json --out output.pdf --all
#   → output.pdf (designed) · output.docx · output.odt · output.ats.txt · output.cover.txt
```

## Quick start

Try the other archetypes:

```bash
node scripts/build_resume.js --profile examples/fresher-sample.json  --out fresher.pdf  --html
node scripts/build_resume.js --profile examples/academic-sample.json --out academic.pdf --html
```

Score any profile on its own:

```bash
node scripts/lib/council.js --profile profile/sourabh.json
```

## What the council tells you

```
┌─────────────────────────────────────────────────────────┐
│  MODEL COUNCIL — Absolute Score: 90.6   / 100  ✅ PASS   │
└─────────────────────────────────────────────────────────┘
  impact          █████████████░░░░░░░  64  (w18)  5/9 bullets quantified; 4 hero metrics
  credibility     ████████████████████ 100  (w10)  0 placeholder tokens
  ...
  Executive Recruiter   85/100   ATS Parser Bot  100/100   Hiring CEO  87/100
```

Ten weighted rubric dimensions, five reviewer personas, and a **ranked list of the exact
edits** that move the score. Apply them to the JSON, re-render, repeat. See
[`docs/model-council.md`](docs/model-council.md).

## Designs & themes

138 context-picked designs (best-fit, reproducible) across 6 layout families, 18 palettes,
5 type pairings, and mix-and-match ornaments:

```bash
node scripts/build_resume.js --profile p.json --out out.pdf                # best fit
node scripts/build_resume.js --profile p.json --out out.pdf --variant 3    # explore
node scripts/build_resume.js --profile p.json --out out.pdf --random       # random on-brand
node scripts/build_resume.js --profile p.json --out out.pdf --design 54    # force one
node scripts/build_resume.js --profile p.json --out out.pdf --theme royal-emerald  # palette only
node scripts/build_resume.js --list-designs      # all 138
```

How selection works + the axes: [`docs/design-catalog.md`](docs/design-catalog.md).
Tokens and re-skinning: [`docs/design-system.md`](docs/design-system.md).

## Use it from anywhere

This is an agent-skill (`SKILL.md` + scripts). Any agent that reads `SKILL.md` runs the full
research → classify → render → score → iterate loop. **Full integration matrix (Claude, Claude
Code, Gemini, Apps Script, Google Sheets, Codex/OpenAI, Cursor/VS Code, CI, Docker, automation)
→ [`docs/integrations.md`](docs/integrations.md).**

- **Claude Code / Cursor** — open the folder, ask: *"build me a standout resume from my profile."*
- **Gemini** — CLI, AI Studio, or API (function calling) — [`docs/gemini-integration.md`](docs/gemini-integration.md).
- **Google Apps Script + Sheets** — batch-render from a spreadsheet — [`apps-script/`](apps-script/).
- **Codex / any AGENTS.md agent** — [`AGENTS.md`](AGENTS.md).
- **HTTP / automation** — the zero-dep render service [`server/render-server.js`](server/render-server.js).

## Profile schema

One JSON file drives it all — only `identity.name` is required. Full reference in
[`profile/README.md`](profile/README.md); machine schema in [`profile/schema.json`](profile/schema.json).

## License

MIT. Use it, fork it, ship it.
