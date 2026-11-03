# .claude

Subset of [Everything Claude Code](https://github.com/affaan-m/ECC) vendored at commit
`b38be6a` (MIT, see `ECC-LICENSE`): agents, skills and rules relevant to Expo / React
Native / TypeScript. The ECC global hooks are intentionally **not** installed; instead
`hooks/format-lint.sh` runs Prettier + ESLint on every edited `.ts`/`.tsx` file.
Typecheck runs at the end of each task (`npm run typecheck`).
