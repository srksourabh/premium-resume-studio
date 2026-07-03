#!/usr/bin/env bash
# Push the premium-resume-studio skill to a new or existing GitHub repo.
#
# This script needs three things you provide:
#   1. Your GitHub username (e.g. srksourabh)
#   2. The repo name (e.g. premium-resume-studio)
#   3. A GitHub personal access token (https://github.com/settings/tokens, scope: repo)
#
# Usage:
#   GITHUB_TOKEN=ghp_xxxxx ./push.sh <username> <repo-name>
# Or:
#   ./push.sh <username> <repo-name>
#     -> will prompt for the token (read from /dev/tty so it doesn't leak into history)
#
# After it runs, the public URL will be printed.

set -euo pipefail

cd "$(dirname "$0")"

USER="${1:-}"
REPO="${2:-}"

if [ -z "$USER" ] || [ -z "$REPO" ]; then
  echo "Usage: $0 <github-username> <repo-name>"
  echo "       (set GITHUB_TOKEN in env or you'll be prompted)"
  exit 1
fi

# Token: from env, else prompt
if [ -z "${GITHUB_TOKEN:-}" ]; then
  if [ -t 0 ]; then
    echo -n "GitHub token (input hidden): "
    read -rs GITHUB_TOKEN
    echo
  else
    echo "GITHUB_TOKEN not set and no TTY available." >&2
    exit 1
  fi
fi

REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${USER}/${REPO}.git"

# Ensure we're on main
git branch -M main 2>/dev/null || true

# Add remote (idempotent)
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# Push
git push -u origin main

# Print the public URL
echo
echo "✓ Pushed to: https://github.com/${USER}/${REPO}"
echo "  Share that URL with Gemini (CLI / AI Studio / Code Assist)."
