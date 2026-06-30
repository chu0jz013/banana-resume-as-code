#!/usr/bin/env bash
set -euo pipefail

npm run build

echo "resumeascode.quachuoitrenmay.com" > docs/CNAME

git add docs/
if git diff --cached --quiet; then
  echo "No changes to deploy."
  exit 0
fi

git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git push
