#!/usr/bin/env bash
# Install Premium Resume Studio as a GLOBAL Claude Code skill (available in
# every project), or into a single project. By default it symlinks this repo
# into your skills directory so `git pull` updates the skill in place.
#
# Usage:
#   ./install-skill.sh                 # global install  (~/.claude/skills/…)  [symlink]
#   ./install-skill.sh --copy          # global install by copying instead of symlinking
#   ./install-skill.sh --project PATH  # install into PATH/.claude/skills/…
#   ./install-skill.sh --gemini        # install into ~/.gemini/skills/ (Gemini CLI)
#   ./install-skill.sh --uninstall     # remove the global install
#   ./install-skill.sh --no-deps       # skip the Playwright/Chromium install step
#
# After installing, restart Claude Code (or /reload) and ask:
#   "build me a standout resume from my profile"
set -euo pipefail

SKILL_NAME="premium-resume-studio"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

MODE="symlink"        # symlink | copy
SCOPE="global"        # global | project
CLIENT="claude"       # claude | gemini
PROJECT_PATH=""
DO_DEPS=1
UNINSTALL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --copy) MODE="copy" ;;
    --project) SCOPE="project"; PROJECT_PATH="${2:-$PWD}"; shift ;;
    --gemini) CLIENT="gemini" ;;
    --uninstall) UNINSTALL=1 ;;
    --no-deps) DO_DEPS=0 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

# Gemini CLI reads the same SKILL.md format from ~/.gemini/skills/.
if [ "$CLIENT" = "gemini" ]; then
  CLAUDE_DIR="${GEMINI_CONFIG_DIR:-$HOME/.gemini}"
fi

if [ "$SCOPE" = "global" ]; then
  DEST_ROOT="$CLAUDE_DIR/skills"
else
  DEST_ROOT="${PROJECT_PATH%/}/.claude/skills"
fi
DEST="$DEST_ROOT/$SKILL_NAME"

if [ "$UNINSTALL" = "1" ]; then
  if [ -e "$DEST" ] || [ -L "$DEST" ]; then
    rm -rf "$DEST"
    echo "✓ Removed $DEST"
  else
    echo "Nothing to remove at $DEST"
  fi
  exit 0
fi

if [ ! -f "$REPO_DIR/SKILL.md" ]; then
  echo "SKILL.md not found in $REPO_DIR — run this from the repo root." >&2
  exit 1
fi

echo "==> Installing skill '$SKILL_NAME' ($SCOPE, $MODE)"
mkdir -p "$DEST_ROOT"

# Replace any existing install.
if [ -e "$DEST" ] || [ -L "$DEST" ]; then rm -rf "$DEST"; fi

if [ "$MODE" = "symlink" ]; then
  ln -s "$REPO_DIR" "$DEST"
  echo "✓ Symlinked $DEST -> $REPO_DIR"
else
  mkdir -p "$DEST"
  # Copy everything except VCS + local build artifacts + node_modules.
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --exclude '.git' --exclude 'node_modules' --exclude 'output.*' "$REPO_DIR"/ "$DEST"/
  else
    cp -R "$REPO_DIR"/. "$DEST"/
    rm -rf "$DEST/.git" "$DEST/node_modules"
  fi
  echo "✓ Copied repo into $DEST"
fi

if [ "$DO_DEPS" = "1" ]; then
  echo "==> Installing render dependencies (Playwright + Chromium)"
  ( cd "$REPO_DIR" && ./install.sh ) || {
    echo "! Dependency install hit an issue — you can re-run ./install.sh later." >&2
  }
fi

cat <<EOF

✅ Installed. The skill lives at:
     $DEST

Next:
  • Restart Claude Code (or run /reload) so it picks up the new skill.
  • Verify with:  /skills        (you should see "$SKILL_NAME")
  • Then ask:     "build me a standout resume from my profile"

Global installs are available in EVERY project. To update later:
  cd "$REPO_DIR" && git pull      # symlink installs update automatically
EOF
