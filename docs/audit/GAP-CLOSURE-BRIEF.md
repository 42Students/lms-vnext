# Gap closure brief (verified closure, one agent per page)

Goal: every gap assigned to your page ends in one of the states below, **built, tested and proven**. "Fixed" means a test that fails without the change and passes with it, plus the code on main. Claims from earlier lanes ("FIXED-ON-MAIN") are NOT trusted: verify each one against the code and the legacy evidence.

## Inputs
- Your page's gap list: JSON file given in your prompt (id, severity, type, current status).
- Gap descriptions with legacy evidence and vNext evidence: `docs/audit/pages/<account>/<page>.md` (and `<page>-review.md`). Fallback for any ID: `grep -rn "<ID>" docs/audit/`.
- Decisions already made (do not ask the owner anything): `docs/audit/owner-decisions-resolved.md`. Where legacy and a better approach differ, vNext takes the better approach; **UI wording must match the old LMS exactly** (`docs/audit/legacy-copy-A.md`, `-B.md`; legacy source is the git repo `C:\Users\LENOVO\Desktop\42LMS`, read with `git -C <repo> show lms-dev-2026:<path>`).
- Repo rules: `AGENTS.md` (central `can()` / `requirePermission`, `isSameOriginRequest` on every mutating route, GET never writes, no AI features, no `any`, no `@ts-ignore`, no `eslint-disable`, no `Date.now()`/`Math.random()` during render, never touch production, never print secrets).

## Per gap, in severity order (S1, S2, S3, S4)
1. Read the gap row. Find the current code. Decide the real state:
   - **OPEN / IN-BRANCH**: build it.
   - **FIXED-ON-MAIN (claimed)**: verify it really matches the legacy evidence (read code, run it). If wrong or partial, finish it.
   - **UNCONFIRMED**: read the legacy source to settle the legacy behaviour, then build or mark NOT-A-GAP.
   - **WRONG**: the audit claim was incorrect; prove it from legacy source and record NOT-A-GAP.
2. Write a test. Unit tests for pure models/strings (exact legacy text); real-PostgreSQL integration tests for anything touching the database (use your assigned database, recipe below). **Put the gap ID in the test name** (for example `it("TPO-batches-18: Invite action ...")`), because the tracker only marks a gap VERIFIED when its ID appears in a test or acceptance file AND a commit on main cites it.
3. Run the test and watch it pass. Run the neighbouring existing tests for the same area.
4. Commit (do NOT push, do NOT merge): `git add <your paths>` then `git commit -m "fix(<area>): <ID> <ID> <what>\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- <your paths>`. Every commit message must cite the gap IDs it closes (subject or body).

## End states (record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`)
Table rows: `| ID | DONE / NOT-A-GAP / BLOCKED | evidence (file:line, test file + test name) |`.
- **DONE**: built (or already correct) and covered by a passing test.
- **NOT-A-GAP**: legacy source proves vNext is right or the audit was wrong; cite the legacy file:line.
- **BLOCKED**: only for true external blockers: private object storage bucket / malware-scan worker (uploads), real provider credentials, owner sign-in on the old LMS. Say exactly what is missing. Nothing else may be BLOCKED: if it is hard, build it.
Commit this file too, citing all its IDs in the commit body (several commits are fine).

## Schema changes
Never run `drizzle-kit generate` and never add numbered files under `drizzle/` (concurrent agents would collide). Instead: edit the Drizzle schema in `src/db/schema/` and write the SQL as `docs/proposed-migrations/<page>-<topic>.sql` (idempotent-safe, matches the schema TS exactly), and apply that SQL by hand to your own test database (`psql`) to test your code. The orchestrator registers migrations between waves. Say in your final report which proposals you wrote.

## Database recipe (real PostgreSQL 14, local, trust auth)
Use ONLY your assigned database `lms_vnext_test_<N>` on 127.0.0.1:54329 (user postgres, no password).
- Fresh reset + migrate + seed (about 12 s, from the repo root): `TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:54329/lms_vnext_test_<N> DATABASE_URL= npx tsx scripts/db-test-prepare.ts`
- Run one integration file: `TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:54329/lms_vnext_test_<N> DATABASE_URL=postgresql://postgres@127.0.0.1:54329/lms_vnext_test_<N> DB03_ISOLATED_TEST_DATABASE=1 DB06_ISOLATED_TEST_DATABASE=1 node node_modules/vitest/vitest.mjs run --config vitest.db.registered.config.ts <file> --reporter=dot`
- Suites are not re-runnable on a dirty database: re-run the prepare step before each re-run. Jobs now need a future deadline and a pay figure before they can be published: use `tests/support/publishable-job-terms.ts`.
- Unit tests: `node node_modules/vitest/vitest.mjs run <file> --reporter=dot` (fast). Some tests grep source text and the working tree has CRLF line endings: write such assertions with `\r?\n`.

## Checks before you finish
- `npx eslint <your changed files>` (0 errors).
- One typecheck at the very end through the shared lock (only one full `tsc` may run at a time, about 6 GB): `bash C:/Users/LENOVO/AppData/Local/Temp/claude/C--Users-LENOVO-Desktop-lms-vnext/3e2bf73e-11fe-4127-ab56-b50b483f6824/scratchpad/tsc-lock.sh` (prints errors and `TSC-EXIT <code>`; must be 0). Never run `tsc` any other way. Fix errors in your files; if an error is in another agent's in-progress file, wait a minute and retry.
- Other agents edit other pages concurrently in the same working tree. Touch only files your gaps need; re-read a shared file right before you edit it; keep shared helpers backward compatible.
- Do not edit `drizzle/`, package files or `.github`.

## Context budget
Work in severity order and commit after each group of gaps so progress is never lost. If you run low on budget, stop cleanly and report exactly which IDs remain; do not leave half-edited files.

## Final report (max 14 lines)
IDs DONE, NOT-A-GAP, BLOCKED (with reason), and REMAINING (if any); tests added (count, files); proposals written; any code change with behaviour impact; anything the orchestrator must do (migration registration, shared file conflicts).
