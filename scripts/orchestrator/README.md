# Orchestrator scripts

## merge-branch.mjs

Verify and merge one `chatgpt/*` branch (clean main, protected-path refusal,
`merge --no-commit`, tsc, eslint, unit tests). `--push` commits and pushes.

## auto-merge.mjs

One command for the whole `chatgpt/chat-2..11` loop.

```
node scripts/orchestrator/auto-merge.mjs --dry-run                 # fetch, list ahead counts only
node scripts/orchestrator/auto-merge.mjs --branches 2,3            # gates only, merges nothing
node scripts/orchestrator/auto-merge.mjs --push [--report path]    # merge + push main
```

- Fetches origin, merges each ahead branch in turn (pull main first), each with its own
  tsc / eslint / `vitest run tests/unit` gate. Prints `MERGED` / `VERIFIED` / `SKIPPED` /
  `REFUSED <reason>` per branch and writes a JSON report (default
  `os.tmpdir()/auto-merge-report.json`) with fixes applied and any
  `tests/integration/*.test.ts` files the branch changed (integration tests are not run).
- Protected paths are refused exactly as in merge-branch.mjs (list is copied; keep in sync).
- Waits up to 10 minutes for a clean main (no staged changes / merge in progress);
  `--no-wait` fails immediately.
- Any failure runs `merge --abort` + `reset --hard` so main stays clean. Push uses
  `git pull --no-rebase --no-edit origin main && git push origin main`, 3 attempts, never forced.

Deterministic auto-fixes (tsc/eslint re-run after each round; if the gates still fail the
whole merge is aborted, so no fix is kept):

| Fix | Trigger |
| --- | --- |
| error-code union | TS2345/TS2322 new string literal not assignable to a `*Error*` literal-union type: literal added to the declaration |
| purity | `react-hooks/purity` Date.now: `useRef(0)` in client files, else eslint-disable comment |
| hooks rename | `rules-of-hooks` on a local, non-exported `use*` function: renamed `apply*`/`with*` |
| apostrophes | `react/no-unescaped-entities` `'` becomes `&apos;` |
| permission matrix | `Record<PlatformPermission,...>` missing keys in `platform-permission-matrix.test.ts`, only when super-admin-only per policy.ts |
| SUSPENDED | `"SUSPENDED"` where tests expect `"ACTIVE" \| "DISABLED"` becomes `"DISABLED"` |
| markdown conflicts | `docs/parity/*.md`, `docs/planning/account-surface-parity.md`: union of both sides, main's rows win for DONE rows (and always on the account-surface matrix); refused if a DONE row would downgrade |

Any other conflict or failure is REFUSED with the first lines of errors.
