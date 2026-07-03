# Integrations — how to use Premium Resume Studio everywhere

This skill is an open `SKILL.md` + Node scripts. Below is how to run it from every
common surface. First, the one thing that decides which path you need:

## What needs a runtime, and what doesn't

The **designed PDF** (and the DOCX/ODT exporters) need a **Node + Chromium runtime** —
they can't be produced by an LLM alone. So integrations fall into three buckets:

| Bucket | Examples | Gets the real PDF/DOCX? |
|--------|----------|--------------------------|
| **Runs Node locally** | Claude Code, Codex CLI, Cursor, VS Code, Aider, plain CLI, CI | ✅ directly |
| **LLM-only (no shell)** | claude.ai chat, Gemini AI Studio, ChatGPT | ⚠️ produces the HTML/JSON; render via a browser "Print → PDF" or a render service |
| **Calls a render service** | Apps Script, Google Sheets, n8n/Zapier, any backend | ✅ via `server/render-server.js` over HTTP |

Jump to: [Claude Code](#claude-code) · [Claude.ai / Desktop](#claudeai--claude-desktop) ·
[Gemini](#gemini) · [Apps Script](#google-apps-script--gemini) · [Google Sheets](#google-sheets) ·
[Codex / OpenAI](#codex--openai) · [Cursor / VS Code / JetBrains](#cursor--vs-code--jetbrains) ·
[Other agents](#other-skillmd-agents) · [Plain CLI](#plain-cli) · [Render service](#render-service-http) ·
[Automation](#automation-n8n--zapier--make) · [CI/CD](#cicd-github-actions) · [Docker](#docker)

---

## Claude Code

Best experience — installs as a global skill or plugin and runs the scripts for you.

```bash
git clone https://github.com/srksourabh/premium-resume-studio.git
cd premium-resume-studio && ./install-skill.sh      # → ~/.claude/skills (every project)
```
or as a plugin:
```
/plugin marketplace add srksourabh/premium-resume-studio
/plugin install premium-resume-studio@premium-resume-studio
```
Then ask: *"build me a standout resume from my profile."* Full matrix (project, copy,
uninstall, Gemini dir) in [`INSTALL.md`](INSTALL.md).

---

## Claude.ai / Claude Desktop

**claude.ai (web) or the Claude app** can't run Node, but it can do the authoring and hand
you renderable HTML:

1. Create a **Project**; paste `SKILL.md` into the Project's custom instructions and add your
   profile JSON (and optionally a template file) as Project knowledge.
2. Ask Claude to produce the resume as an **HTML Artifact**. Open the artifact and
   **Print → Save as PDF** (A4) — the CSS design is preserved by the browser.
3. For the actual `.pdf/.docx/.odt` files, either point Claude at a [render service](#render-service-http),
   or use **Claude Desktop with the filesystem/MCP** connected to a local clone and let it run
   `node scripts/build_resume.js … --all`.

---

## Gemini

- **Gemini CLI**: `gemini extensions install https://github.com/srksourabh/premium-resume-studio`
  then `gemini "Build my resume from profile/sourabh.json"`.
- **AI Studio / gemini.google.com**: paste `SKILL.md` as system instructions + your profile;
  ask for the HTML, then Print → PDF (or wire the render service).
- **Gemini API (Python, function calling)**: full worked example in
  [`gemini-integration.md`](gemini-integration.md) — declare a `render_resume` tool that shells
  out to the build script, feed `SKILL.md` as the system prompt.

---

## Google Apps Script + Gemini

Gemini runs natively in Apps Script (`UrlFetchApp`); the council score + ODT are native; the
designed PDF/DOCX come from the render service. Ready-to-paste code:
[`apps-script/Code.gs`](../apps-script/Code.gs) + [`apps-script/README.md`](../apps-script/README.md).

```javascript
function callGemini(userText, systemInstruction) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }] }) });
  return JSON.parse(res.getContentText()).candidates[0].content.parts.map(p => p.text).join('');
}
```

---

## Google Sheets

A **Sheet-bound Apps Script** turns a spreadsheet into a batch resume factory. Paste
[`apps-script/Code.gs`](../apps-script/Code.gs); each row holds a `profile_json` (or a `bio`
Gemini converts). The **Resume Studio** menu scores rows, improves them with Gemini, and
renders PDF/DOCX/ODT to Drive, writing links back to the sheet. A pure custom function works
in-cell:

```
=RESUME_SCORE(A2)      // A2 = profile JSON → council score 0–100 (no API key needed)
```

Setup + sheet layout: [`apps-script/README.md`](../apps-script/README.md).

---

## Codex / OpenAI

- **Codex CLI (agentic)**: clone + `./install.sh`, then `codex "build my resume from
  profile/sourabh.json"`. Codex reads [`AGENTS.md`](../AGENTS.md) / `SKILL.md` and runs the
  build command in its shell.
- **OpenAI API (function calling)** — same shape as the Gemini example:

```python
from openai import OpenAI; import subprocess, json
client = OpenAI()
tools = [{"type": "function", "function": {
  "name": "render_resume",
  "description": "Render a JSON profile into PDF/DOCX/ODT via premium-resume-studio.",
  "parameters": {"type": "object", "properties": {
     "profile_path": {"type": "string"}, "out_path": {"type": "string"}},
     "required": ["profile_path"]}}}]

def render_resume(profile_path, out_path="output.pdf"):
    subprocess.run(["node","scripts/build_resume.js","--profile",profile_path,"--out",out_path,"--all"], check=True)
    return {"status": "ok", "out": out_path}

msgs = [{"role":"system","content":open("SKILL.md").read()},
        {"role":"user","content":"Build my resume from profile/sourabh.json"}]
r = client.chat.completions.create(model="gpt-4o", messages=msgs, tools=tools)
# execute r.choices[0].message.tool_calls → render_resume(...), then send results back
```

---

## Cursor / VS Code / JetBrains

Open the folder. The AI panel (Cursor AI, Copilot, JetBrains AI) can read `SKILL.md`/`AGENTS.md`
and run the build in the integrated terminal:

> "Build the resume from profile/sourabh.json in every format."

Runs `node scripts/build_resume.js --profile profile/sourabh.json --out output.pdf --all`.

---

## Other SKILL.md agents

Aider, Cline, Continue, Roo Code, and any agent that loads a folder with `SKILL.md`/`AGENTS.md`
work the same way — open the repo, ask it to build/score a resume, and it follows the workflow.

---

## Plain CLI

No agent needed:
```bash
./install.sh
node scripts/build_resume.js --profile profile/sourabh.json --out output.pdf --all
node scripts/lib/council.js  --profile profile/sourabh.json          # just the score
npm install -g .            # then: premium-resume … / resume-council …
```

---

## Render service (HTTP)

`server/render-server.js` is a zero-dependency Node service so **anything that speaks HTTP**
can get the real files back:

```bash
RENDER_TOKEN=secret node server/render-server.js       # :8787
curl -s -X POST http://localhost:8787/render \
  -H 'Authorization: Bearer secret' -H 'Content-Type: application/json' \
  -d '{"profile": <profile-json>, "formats": ["pdf","docx","odt"]}'
# → { pdf_base64, docx_base64, odt_base64, ats, council:{absolute}, classification, pages }
```

Deploy on Cloud Run / Render / Fly / a VM (needs Node + Chromium). This is what Apps Script,
Sheets, and the automation tools below call.

---

## Automation (n8n / Zapier / Make)

Point an **HTTP Request** node at the render service:
- Method `POST`, URL `https://your-service/render`, header `Authorization: Bearer <token>`.
- Body: `{ "profile": {{profile}}, "formats": ["pdf","docx"] }`.
- Decode `pdf_base64` (Base64 → File node) and route to Drive/Email/Slack. Use `council.absolute`
  to gate (e.g. only send when ≥ 85).

---

## CI/CD (GitHub Actions)

Render on every push to a profile:

```yaml
# .github/workflows/resume.yml
name: build-resume
on: { push: { paths: ['profile/**'] } }
jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: ./install.sh
      - run: node scripts/build_resume.js --profile profile/sourabh.json --out output.pdf --all
      - uses: actions/upload-artifact@v4
        with: { name: resume, path: 'output.*' }
```

---

## Docker

Container the render service (Playwright's image ships Chromium):

```dockerfile
FROM mcr.microsoft.com/playwright:v1.60.0-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=8787
CMD ["node", "server/render-server.js"]
```
```bash
docker build -t resume-studio . && docker run -p 8787:8787 -e RENDER_TOKEN=secret resume-studio
```

---

Everything ultimately funnels through the same two entry points — `scripts/build_resume.js`
(build + score) and `scripts/lib/council.js` (score) — so once you can run those, every
integration above is just wiring.
