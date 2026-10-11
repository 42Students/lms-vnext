# DB-025 local safety evidence

**Observed:** 2026-10-11 IST  
**Task:** DB-025 — fail-close destructive test database target selection  
**GitHub Actions:** intentionally unused (billing); not a blocker.

## Implementation on main

- `scripts/db-lib.ts` blob `59c536821bdf3be5b879ee3eff5bb5d2840bb19d`: `requireDatabaseUrl("TEST_DATABASE_URL")` reads only the requested variable; there is no `DATABASE_URL` fallback.
- `scripts/db-test-prepare.ts` blob `061168b5a9f7214c71845be8e61d385c81268713`: destructive preparation invokes `db01-test-database-guard.mjs` before resolving/resetting the target.
- `scripts/db01-test-database-guard.mjs` blob `26aa7f1eb056ca5f684eda6cf5bcf595315fb66b`: explicit test-name, app-target separation and remote confirmation policy.
- `scripts/db-independent-verify.mjs` current source keeps an explicit `TEST_DATABASE_URL` and isolates the destructive prepare subprocess from the application `DATABASE_URL`.
- `tests/db01-test-database-guard.test.mjs` includes helper, source-order, subprocess refusal, independent-verifier isolation and full-entrypoint process regressions.

Primary commits authored by Chat 1:
- `0855d361940a5bd3b0755309befcac0a690c95cb` — remove TEST→DATABASE fallback.
- `23c0c53006d997ec7c80d22c8beefeb0cc8932d6` — run destructive-target preflight before reset.
- `0e8105d15669834ad1400445ca0601431c928116` — add shared-entrypoint/source regressions.

Concurrent peer hardening subsequently extended the independent verifier and DB25 test file; this evidence does not overwrite that work.

## Executed no-PostgreSQL safety harness

Runtime: Node `v22.16.0`.

Executed an isolated Node harness using the current guard implementation and the DB25 source-contract assertions. Result:

```text
tests 12
pass 12
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 495.618262
```

The executed cases cover:

1. missing `TEST_DATABASE_URL` refusal;
2. local disposable target acceptance;
3. production-name refusal;
4. configured application target refusal even with different credentials;
5. non-PostgreSQL scheme refusal;
6. remote target refusal without exact confirmation;
7. confirmed remote target acceptance;
8. malformed path + secret non-leak;
9. shared helper has no TEST→DATABASE fallback;
10. destructive entrypoint orders preflight before target resolution/reset;
11. `DATABASE_URL`-only guard subprocess exits non-zero without leaking credentials;
12. independent verifier supplies an explicit test target.

The repository's newer full-entrypoint `tsx scripts/db-test-prepare.ts` process regression is authored on main, but it was **not executed in this hosted runtime** because the runtime does not contain the repository's installed npm dependency tree/tsx binary. This is not PostgreSQL evidence.

## Acceptance status

DB-025 implementation is source-complete and the core fail-closed behavior has executed no-DB evidence. Real zero-to-head PostgreSQL replay and destructive-target execution on a disposable database remain separate DATABASE acceptance work under DB-002/DB-018/DB-020. Do not mark those gates passed from this document.
