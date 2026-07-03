# Install & make it globally accessible

Premium Resume Studio is an **Agent Skill** — a `SKILL.md` plus helper scripts. This guide
shows every way to make it available: globally in Claude Code, per-project, as a plugin, as a
global CLI, and from other agents (Gemini, Cursor).

> Prereq for rendering: Node ≥ 18. The install steps below run `install.sh`, which sets up
> Playwright + Chromium (and reuses a pre-installed Chromium when one exists).

---

## 1. Claude Code — global skill (available in every project) ✅ recommended

Clone once, then install the skill globally:

```bash
git clone https://github.com/srksourabh/premium-resume-studio.git
cd premium-resume-studio
./install-skill.sh          # symlinks into ~/.claude/skills/premium-resume-studio
```

Restart Claude Code (or `/reload`), confirm with `/skills`, then just ask:

> "build me a standout resume from my profile"

The installer:
- **Symlinks** the repo into `~/.claude/skills/premium-resume-studio` by default, so
  `git pull` updates the skill in place. Use `--copy` to copy instead.
- Honors `CLAUDE_CONFIG_DIR` if you keep Claude config somewhere non-standard.
- `--no-deps` skips the Playwright/Chromium step; `--uninstall` removes it.

Manual equivalent (no script):

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)" ~/.claude/skills/premium-resume-studio
./install.sh
```

A skill is discovered when `~/.claude/skills/<name>/SKILL.md` exists, where `<name>` matches
the `name:` in the frontmatter (`premium-resume-studio`).

## 2. Claude Code — single project

```bash
./install-skill.sh --project /path/to/your/project
# → installs into /path/to/your/project/.claude/skills/premium-resume-studio
```

Commit `.claude/skills/…` (or add it as a submodule) to share the skill with everyone on that
repo.

## 3. Claude Code — as a plugin (marketplace)

This repo doubles as its own one-plugin marketplace (see `.claude-plugin/marketplace.json`).
In Claude Code:

```
/plugin marketplace add srksourabh/premium-resume-studio
/plugin install premium-resume-studio@premium-resume-studio
```

Then restart / `/reload`. Plugins install the skill for you; you still run `./install.sh` once
in the plugin's directory (or let the skill prompt you) so Chromium is available for rendering.

## 4. Global CLI (no agent required)

The package ships two bins, so you can render/score from any terminal:

```bash
npm install -g .            # from the repo root  (or: npm link)
premium-resume  --profile profile/sourabh.json --out out.pdf --html --ats
resume-council  --profile profile/sourabh.json
```

## 5. Gemini CLI

Gemini CLI reads the same `SKILL.md` format from `~/.gemini/skills/`:

```bash
./install-skill.sh --gemini        # symlinks into ~/.gemini/skills/premium-resume-studio
gemini "Build my resume from ./my-profile.json"
```

Or paste `SKILL.md` into a system-instruction block in AI Studio / gemini.google.com. See
`docs/gemini-integration.md`.

## 6. Cursor / other SKILL.md-aware agents

Open the folder (or the global skills dir) and ask the agent to follow `SKILL.md`. Any agent
that reads the SKILL.md format will run the classify → render → council loop.

---

## How the skill finds its scripts

When installed globally or as a plugin, the agent's working directory is your *project*, not the
skill folder — so `SKILL.md` resolves the skill's own path before shelling out:

```bash
SKILL="${CLAUDE_SKILL_DIR:-${CLAUDE_PLUGIN_ROOT:-$PWD}}"
node "$SKILL/scripts/build_resume.js" --profile ./my-profile.json --out ./resume.pdf --html --ats
```

Claude Code sets `CLAUDE_SKILL_DIR` (skill installs) and `CLAUDE_PLUGIN_ROOT` (plugin installs);
the fallback keeps it working when you run from the repo directly. Keep your **profile JSON in
your project**; the scripts and sample profiles live under the skill.

## Verify the install

```bash
node scripts/build_resume.js --list-templates          # 4 templates
node scripts/build_resume.js --list-themes             # 9 themes
node scripts/lib/council.js --profile profile/sourabh.json   # prints a score
```

## Update / uninstall

```bash
cd premium-resume-studio && git pull      # symlink installs update automatically
./install-skill.sh --uninstall            # remove the global skill
```
