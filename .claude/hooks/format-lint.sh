#!/usr/bin/env bash
# PostToolUse hook (inspired by ECC rules/typescript/hooks.md):
# formats and lints the TS/TSX file that was just edited. Never blocks the edit.
f=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input.file_path||"")}catch{console.log("")}})')
case "$f" in
  *.ts|*.tsx)
    cd "$CLAUDE_PROJECT_DIR" || exit 0
    npx --no-install prettier --write "$f" >/dev/null 2>&1
    out=$(npx --no-install eslint --fix "$f" 2>&1) || { echo "$out" | tail -20 >&2; exit 2; }
    ;;
esac
exit 0
