# DB-064 — TPO preference and saved-view lifecycle enforcement

**Phase:** DATABASE · **Task:** DB-064 · **Authoring worker:** Chat 5 (user-authorized takeover of prior Chat 3 work) · **Source oracle:** `42Students/lms@prod-2026` commit `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.

## Source-backed behavior and why database protection is needed

The frozen legacy `src/main/java/com/_42students/lms/service/tpo/TpoSettingsHubService.java` (blob `2aae127ea09769b6dcab798b6c562826ea88e6e7`) has:

- `myPrefs(facultyId)` reads the unique faculty preference row, overlaying **five booleans** with defaults: `morningDigest=false`, `recruiterMessages=true`, `requests=true`, `resultsReady=true`, `followUps=true`.
- `saveMyPrefs(facultyId,prefs)` merges recognized booleans and uses `INSERT ... ON DUPLICATE KEY UPDATE prefs_json`; row identity is fixed. No DELETE or ownership transfer path exists.
- `saveView(collegeId,facultyId,scope,name,filters)` INSERTs one snapshot; `deleteView` deletes by `id+college+faculty`. No view UPDATE path exists, including for `name`, `scope`, `filters`, ownership or timestamp. The scope list has twelve explicit values.

The vNext `src/db/schema/tpo-collaboration.ts` models `placement_tpo_user_preferences` as composite `(college_id,user_id)` with typed booleans and `updated_at`, and models `placement_tpo_saved_views` as named `(college_id,user_id,scope,name,filters,created_at)` snapshots. This is a normalized design, **not a new product workflow**.

Before this batch, the staged `docs/planning/sql/db09-collaboration-scoped-fk-candidate.sql` checked TPO scope on INSERT / owner-key UPDATE but did not enforce lifecycle immutability or timing; any direct SQL client could move ownership, forge timestamps, rewrite a named saved view, or delete the singleton preferences row.

## Implemented, still UNREGISTERED staging

1. `db09_restrict_tpo_user_preferences_lifecycle` and `db09_tpo_user_preferences_lifecycle_guard`:
   - reject DELETE; reject UPDATE moving `college_id` or `user_id`;
   - reject user-supplied future `updated_at` on INSERT and UPDATE;
   - when any of the five booleans changes, set `updated_at` using `GREATEST(clock_timestamp(), OLD.updated_at + interval '1 microsecond')` to advance monotonically;
   - when no boolean changes, preserve `OLD.updated_at` (idempotent).
2. Existing `db09_tpo_user_preferences_scope_guard` now runs on **all INSERT/UPDATE**, not just updates of identity columns, preventing preferences mutation after the owner loses persisted TPO/COLLEGE_ADMIN college scope (subject to DB-056's unverified principal/race proof).
3. `db09_restrict_tpo_saved_view_lifecycle` and `db09_tpo_saved_views_lifecycle_guard`:
   - on INSERT reject future `created_at`;
   - on all UPDATE, reject unconditionally (including no-op UPDATE), because the source supports create/delete snapshots only;
   - do not intercept DELETE, leaving authorized scoped deletion behavior intact.
4. PostgreSQL `23514` CHECK violation codes follow existing DB09 staging conventions. All new trigger/function names are unique. The canonical Drizzle schema, `drizzle/**` migrations, schema barrel, application API and UI were not modified.

## Executed exact-source checks

- Regression file: `tests/db09-user-state-lifecycle.test.mjs` (20 Node `node:test` cases authored).
- Against the **exact latest GitHub committed SQL, Drizzle model, and test source**, a JavaScript V8 harness executed all 20 test callbacks: **20/20 passed**, zero failed. This is **in-process source-contract execution, not `node --test`**. Its purpose is deterministic structural regression evidence against the actual committed blob.
- SQL staged candidate blob at this point: `1c27bd5ce073dfb95e8f22a03baf5b5cecc9dd02`. Test blob: `c976b2a5b10f58cfc3dc07196554f07f9cc11532`. Model blob: `17284285f360ebac8957fa382f26a7d29d3def60`.
- Runtime Node `node --test`, PostgreSQL migration execution, trigger side-effect evidence and two-session races are **NOT RUN** in the connected-only repository environment. GitHub Actions is intentionally unused owing to billing (not a blocker to source implementation). No source-verified result counts as live DB acceptance.

## Migration-integrator handoff and executable acceptance matrix

**Only Chat 1** may register the approved DB09 staging migration and update `drizzle/**`, schema barrel and shared CI. After a clean disposable database migration replay, execute rollback-only cases:

| Case | Expected |
|---|---|
| P01: active same-college TPO creates prefs (all five defaults) | success |
| P02: update any boolean; read `updated_at` afterward | new timestamp strictly greater |
| P03: repeat update with unchanged flags | timestamp unchanged |
| P04: forged college/user UPDATE | rejected with `23514` |
| P05: pref DELETE | rejected with `23514` |
| P06: UPDATE prefs after revoked TPO membership | rejected by scope guard |
| P07: future `updated_at` on INSERT or UPDATE | rejected with `23514` |
| P08: active TPO creates saved view with allowed scope | success |
| P09: UPDATE saved view name, filters, scope or owner | rejected with `23514` |
| P10: no-op UPDATE of saved view | rejected with `23514` |
| P11: future `created_at` on view INSERT | rejected with `23514` |
| P12: same-college creator DELETE scoped view | succeeds via authorized application query |
| P13: inactive/foreign actor attempts INSERT/UPDATE | rejected; exercise direct SQL |
| P14: simultaneous TPO-role revocation and preference update | assert row locking and revocation race safety against DB-056 |

**Adversarial rapid-update correction:** an initial guard compared `OLD.updated_at > statement_timestamp()`, which would reject a previous *database-generated* microsecond increment occurring faster than the next statement clock. Commit `11e7c01` changed it to reject only `NEW.updated_at IS DISTINCT FROM OLD.updated_at AND NEW.updated_at > statement_timestamp()`; unchanged DB-owned incoming timestamps are accepted, then a change receives a new monotonic DB value. Commit `62d77a0` added source regression. This fixes the identifiable source-level issue, but rapid multi-statement PostgreSQL witness P02/P03 is **still required** before DB acceptance.

## Completion claim

DB-064 may be marked **COMPLETED at source/staging implementation level** once the staged SQL, tests and audit are committed; `DONE_VERIFIED` is withheld until PostgreSQL acceptance and DB-056 principal-race obligations run. DB-012 remains BLOCKED on DB09 integration; DB-020/global DATABASE remain open. Old Chat 3 work and DB-056 authorship remain credited to their original worker.

## Final exact-source verification after rapid-update correction

Re-fetched fresh `main` SQL blob `a16c86896c4481b771d14e8227986af3ddc91352`, test blob `679e7c38dca010009bf4e5e06ef65b005814527c`, and unchanged Drizzle model blob `17284285f360ebac8957fa382f26a7d29d3def60`. Re-executed all 20 tests in the source-bound V8 harness: **20 passed, 0 failed**, no direct PostgreSQL. Tests were authored for the Node runner but have not been executed by `node --test` in the full checkout.


## Post-implementation SQL lexical repair — 2026-10-12

**Critical correction to the earlier DB-064 source-only completion evidence:** the two newly staged personal TPO functions originally had malformed `LANGUAGE plpgsql AS $` openers **and** `END $;` terminators. The prior 20/20 source-text callbacks did **not** detect this PostgreSQL SQL lexer failure. That evidence must not be interpreted as compilable migration SQL.

The canonical candidate `docs/planning/sql/db09-collaboration-scoped-fk-candidate.sql` now uses matched `$$` delimiters for both `db09_restrict_tpo_user_preferences_lifecycle` and `db09_restrict_tpo_saved_view_lifecycle`. No runtime schema, registered migration, Chat 1-only file or live database was modified.

Two CI-covered regression checks have been appended to `tests/db-parity-db09-tracker.test.mjs` (already selected by `npm run test:db:parity`), covering positive matched opener/terminator pairs and mutation rejection of the original lone-dollar failure. **2/2 source-level callbacks passed** against the exact committed GitHub SQL and test blobs:

- SQL candidate Git blob: `5a45a9fc2f46e8b610ada65a73fcc90f5c378ff4`
- Regression Git blob: `6f5edab470ccb6f81ba04db61e4c75ea665c2ee6`

A separate cross-domain regression in `tests/db-parity-contracts.test.mjs` scans the entire staged SQL inventory for the same malformed opener/terminator on future pushes. **This is lexical/source verification only; PostgreSQL execution and DB-064 runtime acceptance remain NOT RUN.** The queue's `COMPLETED` status means staged implementation committed, never `DONE_VERIFIED`.
