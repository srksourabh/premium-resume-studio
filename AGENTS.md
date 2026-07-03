# AGENTS.md — Premium Resume Studio

Instructions for coding agents (OpenAI Codex, Cursor, Aider, Cline, Continue, and
any agent that reads `AGENTS.md`). The full workflow lives in **`SKILL.md`** — read it
first; this file is the quick operational contract.

## What this repo is
A resume builder: one JSON profile → auto-classified archetype (executive / academic /
fresher / technical / general) → premium PDF (+ editable DOCX/ODT + ATS text) → a
"Model Council" score. Iterate until the score clears 85.

## Setup
```bash
./install.sh          # Playwright + Chromium (reuses a pre-installed browser if present)
```

## The one command you'll run most
```bash
node scripts/build_resume.js --profile <profile.json> --out <out.pdf> --all
#   --all = PDF + DOCX + ODT + ATS text + cover draft; auto-fits pages (no blank tail)
node scripts/lib/council.js --profile <profile.json>     # score any profile 0–100
```

## Rules (from SKILL.md — do not violate)
- **Never invent** dates, metrics, employers, or institutions. Enrich only with verifiable
  research; flag unconfirmed items in the profile's `_provenance` block.
- Don't stop iterating until the council score is ≥ 85 (or `--threshold`).
- Re-render after editing the profile; never hand-edit the PDF/DOCX/ODT.
- Keep changes minimal and match existing code style; the render templates are pure
  functions in `scripts/lib/templates/`, scoring in `scripts/lib/council.js`.

## Verifying a change
```bash
node scripts/build_resume.js --profile profile/sourabh.json --out /tmp/t.pdf --all   # should PASS (~90)
```

## Programmatic use (OpenAI / function calling)
Expose one tool, `render_resume(profile_path, out_path)`, that shells out to the build
command above; feed `SKILL.md` as the system prompt. Same shape as the Gemini example in
`docs/gemini-integration.md`. Full integration matrix: `docs/integrations.md`.
