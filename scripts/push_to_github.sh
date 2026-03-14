#!/usr/bin/env bash
set -euo pipefail

# Pushes the current repository contents to the remote GitHub repository.
# Creates a backup branch on the remote for safety.
REPO_OWNER="mo7amedabdulahad-bit"
REPO_NAME="Pillage-First-Travian"
REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
BRANCH="${1:-main}"
BACKUP_BRANCH="backup-$(date +%Y%m%d)"

echo "Preparing repository for upload to GitHub..."

PRIMARY_BRANCH="$BRANCH"

# If gh CLI is available, ensure the repo exists (create if missing)
if command -v gh >/dev/null 2>&1; then
  if gh repo view "${REPO_OWNER}/${REPO_NAME}" >/dev/null 2>&1; then
    echo "Repo exists: ${REPO_OWNER}/${REPO_NAME}"
  else
    echo "Repo not found on GitHub. Creating via gh..."
    gh repo create "${REPO_OWNER}/${REPO_NAME}" --public --source=. --remote=origin
  fi
else
  echo "Note: gh CLI not found. Will rely on existing or manually created remote ${REPO_URL}."
fi

# Ensure git repository exists locally
if [ ! -d ".git" ]; then
  echo "Initializing new Git repository..."
  git init
fi

# Ensure remote origin points to the target URL
if ! git remote | grep -q '^origin$'; then
  git remote add origin "$REPO_URL"
else
  git remote set-url origin "$REPO_URL"
fi

echo "Remote origin is set to: $(git remote get-url origin)"

# If SSH is available and the SSH URL works, switch to SSH to push (desired security posture)
if git ls-remote git@github.com:"${REPO_OWNER}/${REPO_NAME}".git >/dev/null 2>&1; then
  git remote set-url origin "git@github.com:${REPO_OWNER}/${REPO_NAME}.git"
  echo "Switched remote to SSH for pushing."
fi

# Stage all changes
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit. Nothing to push."
  exit 0
fi

commit_message="Import Pillage-first-ask-questions-later-master"
git commit -m "$commit_message"

# Create and push backup branch for safety
git branch -f "$BACKUP_BRANCH" HEAD
git push -u origin "$BACKUP_BRANCH" --force

# Push to primary branch (default main, fallback to master)
if git push -u origin "$PRIMARY_BRANCH"; then
  echo "Pushed to origin/$PRIMARY_BRANCH"
else
  echo "Pushing to origin/$PRIMARY_BRANCH failed. Trying origin/master..."
  git push -u origin master
fi

echo "Done. Remote backup branch created as $BACKUP_BRANCH on $(date)."
