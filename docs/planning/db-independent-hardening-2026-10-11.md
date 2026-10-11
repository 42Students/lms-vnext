# Independent DATABASE-phase hardening — 2026-10-11

**Scope:** Source-only DBA review of completed work packages DB-027, DB-031 and DB-024. **Status:** direct-to-main implementation committed; no PostgreSQL tests or migration registration performed. Global phase remains DATABASE. This review does not reassign, close, or claim any previously owned queue task.

## Main commits and independent findings

### DB-027 — staged SQL lexing

- [e9ad0226](https://github.com/42Students/lms-vnext/commit/e9ad0226cc946876ddacf3164d3ff09552a8cfcd): Stage preflight lexer now handles nested PostgreSQL /* */ comments, E-prefixed strings with backslash escapes, and masks opaque non-simple quoted identifiers while retaining ordinary quoted SQL table names.
- [cf3c0e2c](https://github.com/42Students/lms-vnext/commit/cf3c0e2c99c837ba9b0652d004df030b3e622803): Add source-regression cases for nested comments, escaped strings and quoted pseudo-DDL.

**Reason:** A false CREATE/REFERENCES match can misclassify a staged migration; failure to detect a real conflict can produce an unsafe migration order. The preflight remains a heuristic, not an SQL parser or proof of a successful migration.

### DB-031 — SMS attempts tenant race

- [fffce83b](https://github.com/42Students/lms-vnext/commit/fffce83b47bda907ba70a9807d7d247b873f09fb): Replace unlocked college tenant existence check with a locked `PERFORM ... FOR SHARE` lookup; preserve the global OTP null/null path and explicit forged tenant mismatch error.
- [56d76aa5](https://github.com/42Students/lms-vnext/commit/56d76aa532d603452f98c3a18cbf00a8dbd7ac0b): Assert matching-parent lock in the source test.

**Remaining relational risk:** This serializes a simultaneous insert with an organization reassignment but does *not* prevent a later authorized reassignment after insertion from invalidating the historical attribution. The domain owner/integrator must document whether colleges.organization_id is immutable, or introduce a parent-side retention policy. Do not assume a child insert trigger alone guarantees permanent historical consistency.

### DB-024 — general notification undo and immutable intent

- [850e5906](https://github.com/42Students/lms-vnext/commit/850e5906f6e67459665e8ce090fcbdbcc8d99da2): Stage an INSERT/UPDATE trigger protecting original enqueue identity, 30-second server-clock hold, deliverability, cancellation and terminal state.
- [2de27585](https://github.com/42Students/lms-vnext/commit/2de2758557d8ec951ef3fb76828d7f16fb11ab53): Record DB24-15 negative and positive acceptance cases.
- [6d2afd72](https://github.com/42Students/lms-vnext/commit/6d2afd726478db1213564ccdd3cca12cc162cf27): Add immutable enqueue source regression tests.
- [d9264b84](https://github.com/42Students/lms-vnext/commit/d9264b8426b723b764f0dcbe345f0d2f74c49aa2): Stop early delivery through a FAILED-to-CLAIMED retry; delivery-state transitions are checked regardless of the old status.
- [4ee39d5c](https://github.com/42Students/lms-vnext/commit/4ee39d5c91d2781f858275ce41f3da00c835f86b): Guard the retry bypass in source tests.

**Important limitations:** The trigger is in an *unregistered SQL stage*, not a live database constraint. Claims/undo races, issuer authorization, recruiter grants, sender idempotency and provider acceptance versus final delivery still require real PostgreSQL and producer/consumer tests. The Drizzle schema will not enforce this trigger until Chat 1 registers and replays the migration. Do not switch on the sender based on staged SQL.

## Executed source and fixture checks

- **14/14 live GitHub-source invariants passed** when rereading the seven committed DB-027/DB-031/DB-024 script, test and contract files on current main. This check was executable in the connected GitHub analysis environment; it inspected actual committed file contents and SHA.
- **6/6 local Node v22.16.0 fixtures passed** using `node --test /mnt/data/lms-vnext-independent-check/db27-lexer-fixture.test.mjs`: nested block comments, E-prefixed escape, quoted pseudo-DDL, newline count preservation, ordinary quoted table name, dollar-quoted body. The fixture reproduced the committed lexer for isolation; it is **not** the repository's own Node test suite.
- **NOT RUN:** `node --test tests/db27-stage-sql-preflight.test.mjs tests/db10-general-notices-staging.test.mjs tests/db10-sms-delivery-attempts-staging.test.mjs` on a full checkout; TypeScript typecheck; PostgreSQL transactional/race tests; numbered migration replay; browser tests. GitHub Actions is intentionally unused due billing.

## PostgreSQL acceptance to collect before DONE_VERIFIED

1. DB-027: run preflight over the fresh full checkout, inspect any false-positive/negative and dependency order, then separately replay the exact numbered migration journal.
2. DB-031: in a disposable database, race SMS-attempt INSERT against college org reassignment in two connections; test forged tenant pairs and global null/null attempts, and verify parent-side reassignment rules.
3. DB-024: reject backdated held notices, attempted event/recipient/payload/time/idempotency rewrites, early claim and alternate retry-state bypass, post-claim cancellation and terminal reopen. Accept valid due claims, cancellation while PENDING and permissible deadline extension; test undo-versus-claim racing under concurrent transactions.

**Gate:** These three are engineering improvements to already COMPLETED queue items. They do not change the original worker's completion credit or turn any item DONE_VERIFIED; executable PostgreSQL acceptance remains pending.
