# Google Apps Script + Gemini + Google Sheets

Drive Premium Resume Studio from a Google Sheet: Gemini writes/improves profiles,
a native scorer rates them, and (optionally) a deployed render service returns the
designed PDF/DOCX. Everything here runs in Apps Script's V8 sandbox.

## What runs where

| Step | Where |
|------|-------|
| Bio → profile JSON, "improve to >85" | **Gemini** (native `UrlFetchApp`) |
| Council score + archetype | **native** (pure JS in `Code.gs`) |
| ODT export | **native** (`Utilities.zip`) |
| Designed **PDF** + **DOCX** | **render service** (`server/render-server.js`) — Apps Script can't run Chromium/npm |

## Setup

1. In your Google Sheet: **Extensions → Apps Script**.
2. Paste `Code.gs`; set the manifest (`appsscript.json`) via **Project Settings → Show
   "appsscript.json"**. (Or use [clasp](https://github.com/google/clasp): `clasp push`.)
3. **Project Settings → Script properties** — add:
   | Key | Value |
   |-----|-------|
   | `GEMINI_API_KEY` | from https://aistudio.google.com/apikey |
   | `RENDER_URL` | `https://your-service/render` (deploy `server/render-server.js`) — optional, for PDF/DOCX |
   | `RENDER_TOKEN` | same secret as the service — optional |
   | `DRIVE_FOLDER_ID` | folder to save outputs — optional (defaults to My Drive) |
4. Reload the sheet → a **Resume Studio** menu appears.

## Sheet layout

Row 1 is headers. Useful columns (any order): `bio`, `profile_json`, `score`,
`pdf_url`, `docx_url`, `odt_url`. The script creates output columns if missing.

## Use

- **Score active row (native)** — rates `profile_json` with the ported council. No API key needed.
- **Bio → profile JSON (Gemini)** — turns a `bio` cell into a structured `profile_json`.
- **Improve active row with Gemini** — rewrites `profile_json` to clear 85 and re-scores.
- **Render active row / all rows** — POSTs to `RENDER_URL`, saves PDF/DOCX/ODT to Drive, writes links back.
- **Export ODT natively** — builds an ODT with `Utilities.zip` (no service).

Custom function (pure, no auth): `=RESUME_SCORE(A2)` where `A2` holds profile JSON.

## Deploying the render service

`server/render-server.js` is zero-dependency Node. Deploy anywhere that runs Node +
Chromium (Cloud Run, Render, Fly, a VM):

```bash
# Cloud Run example (Playwright image includes Chromium):
gcloud run deploy resume-render --source . --set-env-vars RENDER_TOKEN=yoursecret
# then set RENDER_URL = https://resume-render-xxxxx.run.app/render
```

See `../docs/integrations.md` for the full matrix (Claude, Codex, CI, Docker, automation…).
