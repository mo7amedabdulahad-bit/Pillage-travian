#!/usr/bin/env bash
set -euo pipefail

# Pushes the current repository contents to the remote GitHub repository using a PAT (HTTPS).
# Creates a backup branch on the remote for safety.

REPO_OWNER="mo7amedabdulahad-bit"
REPO_NAME="Pillage-First-Travian"
BRANCH="${1:-main}"
BACKUP_BRANCH="backup-$(date +%Y%m%d)"

# If a PAT is provided via GITHUB_TOKEN, use it for HTTPS authentication.
if [ -n "${GITHUB_TOKEN:-}" ]; then
  REPO_URL="https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
  echo "Using provided GITHUB_TOKEN for authentication (HTTPS)."
else
  REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
fi

echo "Preparing push to ${REPO_OWNER}/${REPO_NAME} on branch ${BRANCH}"

if [ ! -d ".git" ]; then
  echo "Initializing new Git repository..."
  git init
fi

if ! git remote | grep -q '^origin$'; then
  git remote add origin "$REPO_URL"
else
  git remote set-url origin "$REPO_URL"
fi

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit. Exiting."
  exit 0
fi

git commit -m "Import Pillage-first-ask-questions-later-master"
git branch -f "$BACKUP_BRANCH" HEAD
git push -u origin "$BACKUP_BRANCH" --force

if git push -u origin "$BRANCH"; then
  echo "Pushed to origin/$BRANCH"
else
  echo "Push to origin/$BRANCH failed. Trying origin/master..."
  git push -u origin master
fi

echo "Done. Remote backup branch: $BACKUP_BRANCH"
