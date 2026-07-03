---
name: premium-resume-studio
description: >-
  Autonomous premium-resume builder. From a single JSON profile it (1) auto-decides
  the resume type — executive/corporate, academic, fresher/early-career, technical,
  or general — (2) does live web + LinkedIn research to enrich and verify the profile,
  (3) renders a colorful-yet-sober, CEO-grade PDF via HTML+CSS+Chromium, and (4) convenes
  a "model council" that scores the resume 0–100 and loops (research → rewrite → re-render)
  until the absolute score clears 85. Multiple design themes, ATS-safe text export, and a
  cover-letter draft. Trigger for any request to build, upgrade, or score a resume/CV, or
  when the user wants a resume that stands out. Works with Claude Code, Gemini CLI, Cursor,
  and any agent that reads SKILL.md.
---

# Premium Resume Studio

Turn one structured JSON profile into a **premium, recruiter-ready résumé** — and don't
stop until a panel of reviewers scores it **> 85 / 100**.

The Studio is opinionated about quality. It does four things on its own:

1. **Classifies** the profile into the right archetype (you don't pick the template).
2. **Researches** the person on the web + LinkedIn to fill gaps and verify claims.
3. **Renders** an elegant, colorful-but-sober, print-perfect PDF.
4. **Scores** the result with a Model Council and **iterates until it passes**.

## When to use

- "Build / make / design me a resume (or CV)."
- "Make my resume stand out / CEO-grade / more professional."
- "Score my resume" / "is my resume good enough?"
- A fresher/graduate who needs to be **noticed in a large CV stack**.
- Re-skinning the same data into a different look or archetype.

---

## The agent workflow (follow this end-to-end)

> This is the loop the skill is built around. Run it whenever asked to build/upgrade a resume.
> **Do not stop until the Model Council score is ≥ 85.**

> **Where the scripts live (global / plugin installs).** When this skill is installed globally
> (`~/.claude/skills/…`) or as a plugin, your working directory is the *user's project*, not the
> skill folder. Resolve the skill's own path first and call scripts through it:
> ```bash
> SKILL="${CLAUDE_SKILL_DIR:-${CLAUDE_PLUGIN_ROOT:-$PWD}}"   # Claude Code sets these
> node "$SKILL/scripts/build_resume.js" --profile ./my-profile.json --out ./resume.pdf --html --ats
> ```
> Keep the **profile JSON in the user's project** (e.g. `./my-profile.json`); the scripts and
> sample profiles live under `$SKILL`. The examples below use `$SKILL` for that reason.

### 1 — Load / build the profile
Read the JSON profile (`profile/<name>.json`; schema in `profile/README.md`). If the user
only pasted a bio, draft a profile JSON from it first.

### 2 — Research (web + LinkedIn)
Look the person up and **enrich only with what you can verify**:
- Search: `"<name> <company> LinkedIn"`, `"<name> <city> <role>"`, the company website,
  registries (Zaubacorp/Tofler/MCA for India), press, awards.
- Fill: LinkedIn URL, personal site, employer/incorporation facts, prior roles, university.
- **Never invent** dates, metrics, employers, or institutions. Tag anything unverified in a
  `_provenance` block and surface it to the user for confirmation — do not silently assert it.

### 3 — Classify (automatic)
```bash
node "$SKILL/scripts/build_resume.js" --profile ./<name>.json --score-only
```
The banner prints the chosen **archetype**, **seniority**, **fresher?** flag, **confidence**,
and the **theme**. Override only if the user insists (`--archetype`, `--theme`).

Archetypes → default look:
| Archetype | Layout | Default theme |
|-----------|--------|---------------|
| `executive` | two-column, metric strip, venture timeline, product cards | `midnight-gold` |
| `academic` | single-column CV, numbered publications, serif headings | `academic-navy` |
| `fresher` | hero band + strengths spotlight + skill bars + projects grid | `teal-sunrise` |
| `technical` | skills matrix + tech-tagged projects | `graphite-azure` |
| `general` | clean modern two-column | `sapphire-teal` |

**Freshers get special treatment** — the layout is engineered to be *noticed*: a bold hero,
a color spotlight strip of standout numbers (CGPA, projects, internships, awards), leveled
skill bars, and a projects grid (a fresher's #1 differentiator). Lean into projects, awards,
hackathons, and a crisp objective.

### 4 — Render (PDF · DOCX · ODT)
```bash
node "$SKILL/scripts/build_resume.js" --profile ./<name>.json --out ./out.pdf --all
```
`--all` produces the designed **PDF** + editable **DOCX** + **ODT** + ATS-safe **text** +
a **cover** draft (or pick with `--docx`/`--odt`/`--ats`/`--format docx,odt`). The PDF is
**auto-fitted** — content is densified onto fewer pages or spacing is expanded to fill the
pages used, so there is no big blank tail (disable with `--no-fit`; cap with `--max-pages`).

### 5 — Convene the Model Council
The same command prints the council report. Also available standalone:
```bash
node "$SKILL/scripts/lib/council.js" --profile ./<name>.json          # human report
node "$SKILL/scripts/lib/council.js" --profile ./<name>.json --json   # machine-readable
```
It returns an **absolute score**, ten rubric dimensions, five reviewer **personas**
(Executive Recruiter, ATS Bot, Domain Expert, Design Critic, Hiring CEO), and **ranked fixes**.

### 6 — Iterate until ≥ 85 (the important part)
If below threshold, apply the **top fixes** to the *profile JSON* (not the PDF), then re-render:
- **Quantify** bullets — put a number, %, ₹/$, or scale in each (target > 60%).
- Start every bullet with a **strong action verb** (Led, Scaled, Built, Delivered…).
- Add 3–4 **hero metrics** (revenue, growth %, team size, reach).
- **Resolve placeholders** ("pending", nulls) via research or by asking the user.
- Add the missing **section(s)** the rubric names for the archetype.
- Tighten over-long bullets; keep the ATS text export on.

Re-run, re-score, repeat. The score is deterministic, so improving the content moves it.

### 7 — Layer the *qualitative* council (optional but recommended)
For judgement the code can't make, role-play the five personas yourself and read the resume
as each. Merge their notes with the rubric's `topFixes`. See `docs/model-council.md`.

### 8 — Deliver
Export the formats the user needs — the designed **PDF** for humans, plus **DOCX** and **ODT**
for editing/ATS and an **ATS-safe text** file. `--all` writes every format + a cover draft.
The layout **auto-fits**: it densifies content onto fewer pages or expands spacing to fill the
pages it uses, so there is never a big blank tail (override with `--no-fit` / `--max-pages N`).
Report the final council score and list anything still flagged in `_provenance` to confirm.

---

## Input schema (essentials)

`identity.name` is the only hard requirement. Everything else is optional and drives sections.

```jsonc
{
  "identity": { "name","headline","location","email","phone","linkedin","website","github","portfolio" },
  "summary": { "short","long" },
  "career_objective": "…",                 // used as a header tag / fresher objective
  "metrics": [{ "value":"₹10 Cr+","label":"Turnover" }],   // hero strip (else auto-derived)
  "current_roles": [{ "company","title","dates","location","industry","highlights":["…"] }],
  "past_roles":    [{ "company","title","dates" }],         // "Earlier Career" strip
  "core_competencies": { "group_name":["skill", …] },       // sidebar pill groups
  "skills": [{ "name":"Python","level":90 }],               // fresher/technical skill bars
  "projects": [{ "name","description","tech":["…"] }],      // fresher/technical grid
  "internships": [{ "title","company","dates","highlights":["…"] }],
  "education": [{ "degree","field","institution","year","score" }],
  "certifications": [{ "name","year","score" }],
  "publications": [{ "authors","title","venue","year" }],   // academic
  "grants": ["…"], "teaching": [ … ], "conferences": [ … ], "affiliations": ["…"], // academic
  "achievements": ["…"], "awards": ["…"], "memberships": ["…"],
  "languages": ["English", …], "open_to": ["…"], "interests": ["…"],
  "personal_brand_statement": "…",
  "_provenance": { "confirmed_by_research":["…"], "needs_user_confirmation":["…"] }
}
```

Full field reference: `profile/README.md`. JSON Schema: `profile/schema.json`.

---

## CLI reference

```
node scripts/build_resume.js [options]
  --profile <path>     Profile JSON              (default: profile/sourabh.json)
  --out <path>         Output PDF                (default: output.pdf)
  --theme <key>        Override theme            (see --list-themes)
  --archetype <key>    Override archetype        (executive|academic|fresher|technical|general)
  --threshold <n>      Council pass mark         (default: 85)
  --html               Also write the HTML next to the PDF
  --docx               Also write an editable Word .docx
  --odt                Also write an editable OpenDocument .odt
  --ats                Also write an ATS-safe plain-text .ats.txt
  --cover              Also write a cover-letter draft .cover.txt
  --all                PDF + DOCX + ODT + ATS + cover
  --format a,b,c       Pick formats explicitly (docx,odt,ats)
  --no-fit             Disable auto-fit (don't densify/expand to fill pages)
  --max-pages <n>      Cap page count (auto-fit compresses to fit)
  --score-only         Classify + score, skip rendering (fast)
  --json               Emit classification + council as JSON
  --list-themes | --list-templates
```

Back-compat: `node scripts/build_stunning_pdf.js --profile … --out … [--html]` still works
(forces the executive design, now fully data-driven).

## Themes

Nine curated palettes — deep, saturated accents on clean backgrounds (colorful, never neon):
`midnight-gold`, `royal-emerald`, `sapphire-teal`, `burgundy-rose`, `graphite-azure`,
`plum-coral`, `teal-sunrise`, `academic-navy`, `slate-mono` (ATS/print). `--list-themes` to see all.
Design tokens live in `scripts/lib/themes.js`; see `docs/design-system.md`.

## Install & integrate

Make the skill available everywhere, then use it in any project. Install matrix (global,
per-project, plugin, CLI, Gemini) in [`docs/INSTALL.md`](docs/INSTALL.md); the full
integration matrix — Claude, Claude Code, Gemini, **Google Apps Script**, **Google Sheets**,
**Codex/OpenAI**, Cursor/VS Code, CI, Docker, HTTP automation — in
[`docs/integrations.md`](docs/integrations.md).

```bash
git clone https://github.com/srksourabh/premium-resume-studio.git
cd premium-resume-studio
./install-skill.sh        # → ~/.claude/skills/premium-resume-studio (global) + Chromium
```

Or as a Claude Code plugin:

```
/plugin marketplace add srksourabh/premium-resume-studio
/plugin install premium-resume-studio@premium-resume-studio
```

Then, from inside the skill dir during development:

```bash
node scripts/build_resume.js --profile profile/sourabh.json --out output.pdf --html --ats
```

## Files

```
premium-resume-studio/
├── SKILL.md                     # this file — the agent workflow
├── AGENTS.md                    # quick contract for Codex / AGENTS.md agents
├── README.md                    # human overview
├── install.sh                   # one-shot Playwright + Chromium setup
├── install-skill.sh             # install as a global/project/Gemini skill
├── .claude-plugin/              # plugin.json + marketplace.json (install as a plugin)
├── apps-script/                 # Google Apps Script + Sheets + Gemini (Code.gs)
├── server/                      # render-server.js — zero-dep HTTP render service
├── package.json
├── profile/
│   ├── README.md                # schema docs
│   ├── schema.json              # JSON Schema for validation
│   └── sourabh.json             # worked example (enriched via research)
├── scripts/
│   ├── build_resume.js          # orchestrator: classify → render → PDF → council
│   ├── build_stunning_pdf.js    # back-compat shim (executive design)
│   └── lib/
│       ├── classify.js          # archetype + seniority + fresher detection
│       ├── council.js           # the Model Council rubric (CLI-runnable)
│       ├── themes.js            # design-token palettes
│       ├── helpers.js           # metric mining, verb/quant analysis, escaping
│       ├── fit.js               # auto-fit: densify/expand so pages fill cleanly
│       ├── browser.js           # robust Chromium launcher (finds installed build)
│       ├── export/              # docx.js · odt.js · docmodel.js (editable formats)
│       └── templates/           # executive · academic · fresher · general · _components
├── examples/
│   ├── sourabh-resume.pdf/.html/.ats.txt/.cover.txt   # executive sample (score 90.6)
│   ├── fresher-sample.json      # try: --profile examples/fresher-sample.json
│   └── academic-sample.json     # try: --profile examples/academic-sample.json
└── docs/
    ├── INSTALL.md               # global / project / plugin / CLI / Gemini install matrix
    ├── integrations.md          # every surface: Claude, Gemini, Apps Script, Sheets, Codex, CI…
    ├── model-council.md         # how the council scores + the LLM-council overlay
    ├── design-system.md         # themes, tokens, re-skinning
    └── gemini-integration.md    # calling the skill from Gemini
```

## Hard rules

- **Never invent** dates, metrics, employers, or institutions. Enrich only with verifiable
  research; flag the rest in `_provenance` and confirm with the user.
- Re-render whenever the profile changes; never hand-edit the PDF.
- Keep iterating until the council clears the threshold — a passing score is the definition of done.
- Before external distribution, resolve every item in `_provenance.needs_user_confirmation`.
