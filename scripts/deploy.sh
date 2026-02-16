#!/usr/bin/env bash
set -e

msg="${1:-chore: deploy}"

npm run check
npm run build

git add -A
git commit -m "$msg" || { echo "커밋할 변경이 없습니다."; exit 0; }
git push
