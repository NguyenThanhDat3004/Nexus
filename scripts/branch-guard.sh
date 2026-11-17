#!/usr/bin/env bash
set -euo pipefail

BASE="$1"
HEAD="$2"

echo "Branch Guard: Kiểm tra PR $HEAD trên nền $BASE..."

# 1. Kiểm tra PR đã rebase trên base mới nhất chưa
if ! git merge-base --is-ancestor "$BASE" "$HEAD"; then
  echo "::error::Nhánh PR chưa được rebase trên $BASE mới nhất. Vui lòng rebase lại."
  exit 1
fi

# 2. Kiểm tra không chứa merge commit (bắt buộc linear history)
MERGES=$(git rev-list --merges "$BASE..$HEAD")
if [ -n "$MERGES" ]; then
  echo "::error::PR chứa merge commit. Vui lòng rebase thay vì merge."
  echo "$MERGES"
  exit 1
fi

echo "Branch Guard passed: Lịch sử commit hợp lệ và đã rebase mới nhất."
