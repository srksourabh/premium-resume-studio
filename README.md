# Premium Resume Studio

**A resume builder for anyone who wants a professional-yet-creative résumé that stands out** —
and a quality gate that won't let it ship until it's genuinely good.

Feed it one JSON profile. It figures out the rest:

1. 🧭 **Auto-decides the archetype** — executive, academic, fresher, technical, or general.
   You don't pick a template; the Studio reads your profile and chooses.
2. 🔎 **Researches you** — web + LinkedIn lookup to fill gaps and verify claims (never invents).
3. 🎨 **Renders a premium PDF** — colorful but sober, real CSS design, printed by Chromium.
4. 🏛️ **Scores it with a Model Council** and **iterates until it clears 85 / 100.**

Plus: nine curated color themes, an **ATS-safe plain-text** export, and a **cover-letter draft**.

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
node scripts/build_resume.js --profile profile/sourabh.json --out output.pdf --html --ats --cover
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

## Themes

`midnight-gold` · `royal-emerald` · `sapphire-teal` · `burgundy-rose` · `graphite-azure` ·
`plum-coral` · `teal-sunrise` · `academic-navy` · `slate-mono`

```bash
node scripts/build_resume.js --profile p.json --theme royal-emerald --out out.pdf
node scripts/build_resume.js --list-themes
```

Design tokens and re-skinning: [`docs/design-system.md`](docs/design-system.md).

## Calling it from an AI agent

This is an agent-skill (`SKILL.md` + scripts). Any agent that reads `SKILL.md` will run the
full research → classify → render → score → iterate loop.

- **Claude Code / Cursor** — open the folder, ask: *"build me a standout resume from my profile."*
- **Gemini CLI** — `gemini extensions install https://github.com/srksourabh/premium-resume-studio`
  then `gemini "Build my resume from profile/sourabh.json"`. See
  [`docs/gemini-integration.md`](docs/gemini-integration.md).

## Profile schema

One JSON file drives it all — only `identity.name` is required. Full reference in
[`profile/README.md`](profile/README.md); machine schema in [`profile/schema.json`](profile/schema.json).

## License

MIT. Use it, fork it, ship it.
