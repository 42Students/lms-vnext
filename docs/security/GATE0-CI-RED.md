# Gate 0: CI is red on main (diagnosed 2026-11-08) - hand to the GPT lanes

Run 42414194708 (commit dcc6ede8), identical counts on every main commit since 1d478c43, so none of it comes from the SEC-05/06 work:

| Job | Result |
|---|---|
| unit | 132 failed tests in 78 files (5,595 files pass) |
| database | 345 failed tests in 78 files (419 pass, 110 skipped) |
| db08-staged-acceptance | 2 failed tests |
| lint | ESLint failure |
| source-contracts | "Prototype portal source contracts (TPO, Recruiter, Mentor)" failure |
| build, typecheck, schema-drift, 10 other db jobs | pass |

## Root causes found (by error message)

1. **One-role contexts (largest cluster, about 300 tests).** `hasMembershipRole` (src/modules/identity/context.ts:64) requires `membership.roles.length === 1` since 2026-11-04 (53d388b0e3, 3b90de498a): a request context is exactly one selected role. 113 test files still build actors such as `roles: ["FACULTY", "TPO"]` (example: `tests/integration/placements-p8-offers.test.ts:72`), so `placements.manage`, project and faculty-scope checks deny them: `Missing permission: placements.manage` (117), `PROJECT_ACCESS_DENIED` (128), `FACULTY_TEACHING_SCOPE_REQUIRED` (64). Fix the fixtures to the one role each test acts as (a second actor for the second role), not the policy.
2. **Storage not configured in tests (about 30).** `STORAGE_NOT_CONFIGURED` / `STORAGE_NOT_FOUND` in `tests/unit/file-lifecycle.test.ts`, `tests/integration/storage-files-*.test.ts`: the tests need the private-bucket env or a fake S3 client.
3. **Header expectation drift (4).** `expected 'private, no-store' to be 'no-store'`: tests assert the old Cache-Control value; the API default is now `private, no-store, max-age=0` (src/security/headers.ts).
4. **Shell navigation model tests (about 15).** `tests/unit/shell-model.test.ts` and neighbours: expectations written for the pre-one-workspace-per-role navigation.
5. **Not diagnosed:** lint (ESLint step), source-contracts, the two db08 tests (db08 expects a `Missing permission` throw that no longer happens: check which actor), and the UX tests (`UX-*`, `PLACEMENTS-WAIT-UI-10`).

## How to reproduce one cluster fast

```
gh run view 42414194708 --log-failed > ci.log   # strip colours, then grep " FAIL "
bun run test -- tests/unit/shell-model.test.ts
```

Database tests need a disposable PostgreSQL (see `docs/local-db-test-recipe` memory and `tests/support/db018-test-target.mjs`).

Rule for the fix: tests change to match the security model (one role per request, strict headers), never the other way round.

## Addendum 2026-11-08: unit failures reproduced locally and grouped

`npx vitest run $(cat failing-unit-files)` on the 78 failing unit files reproduces the CI result exactly (78 files, 134 tests failed, 579 passed), so they can be fixed without CI. By message, the unit side is NOT one cause:

| Cluster | Tests | Files | Nature |
|---|---|---|---|
| `expected ... to contain '<text>'` on page or component SOURCE | about 25 | about 14 | Source-grep tests written against an earlier version of the page (for example `Retry Everyone`, `href={DEMO_MAILTO}`, `The link could not be opened.`): update or replace the expectation after checking the UI is right |
| `expected false to be true` | 12 | 8 | Unclear; open the files (`tests/unit/shell-model.test.ts` family: navigation for one workspace role) |
| Project meeting and access (`PROJECT_MEETING_ACCESS_DENIED`, `PROJECT_ACCESS_DENIED`) | 14 | 3 | One-role context fixtures (dual `FACULTY`/`MENTOR` actors) |
| `STORAGE_NOT_CONFIGURED` | 10 | 1 | `tests/unit/file-lifecycle.test.ts` needs the private storage env (set `R2_PRIVATE_*` fakes in the test) |
| `expected 'private, no-store' to be 'no-store'` | 4 | 2 | The API default header is now `private, no-store, max-age=0` |
| `No "AuthorizationError" export is defined on the policy mock` | 3 | 1 | A `vi.mock("@/modules/permissions/policy")` that must keep the real exports (`importOriginal`) |
| `Transform failed` | 0 | 2 | Test files that do not parse (syntax) |
| remaining one-offs | about 40 | about 45 | Individual drift |

The 345 database failures are the larger set and are dominated by the one-role fixtures (113 files carry two-role actor literals; names in the literals: `mentor` 37, `tpo` 23, `faculty` 21). A name-based narrowing (`mentor` to `MENTOR`, `tpo` to `TPO`, `faculty` to `FACULTY`) would be the first codemod to try, verified on a disposable PostgreSQL.

### Progress 2026-11-08 (Claude, local runs of the 78 failing unit files)

Fixed: two test files that did not parse (unbalanced parenthesis), the R2 account-id fixture (`test-account` is now invalid by design; `testaccount`) in four files (unblocks `file-lifecycle`, the video source test and the two storage integration tests), a policy mock that dropped `AuthorizationError`, four stale `no-store` expectations (now `private, no-store`), the Super Admin fixtures of five files (a Super Admin with a membership is that member, so platform-admin fixtures carry `membership: null`), `platform-policy.test.ts` (a two-role context now grants nothing, stated as the expectation) and `PROJ-BREAK-FACULTY-06` (the actor acts as `MENTOR`). Unit failures went from 134 tests in 78 files to about 95 in 66 files (re-measure with the command above).

Rules learned for the rest: narrow a two-role actor by what the SERVICE under test requires, not by the variable name (the `faculty` actor in FACULTY-06 acts as a mentor). The `hybrid` actors in `PROJ-BREAK-chat3-faculty-role-journey` and `PROJ-BREAK-FACULTY-02` and the "dual-role platform admin" cases in `PROJ-BREAK-chat6-super-admin-audit-scope` encode the OLD union semantics and need their expectations rewritten to the one-role rule (membership wins), not just a fixture change.

### Progress 2026-11-08 (later): local PostgreSQL running, two-role fixtures narrowed

- A disposable PostgreSQL 16 is the Windows service on `127.0.0.1:5432` (the old `.env.local` port 54329 is unused). Create `lms_vnext_test` and `lms_vnext_e2e` there, then `npx tsx scripts/db-test-prepare.ts` with both URLs pointed at 5432. Run suites with `DATABASE_URL=$TEST_DATABASE_URL` and `DB018_ISOLATED_TEST_DATABASE=1 DB03_ISOLATED_TEST_DATABASE=1 DB09_ISOLATED_TEST_DATABASE=1`.
- Full database run: 1,993 tests, 231 failed in 106 files. A name-based codemod (`scratch/narrow-roles.cjs`, variable `tpo`/`mentor`/`faculty` picks that role) narrowed 82 actor literals. Re-run of the 106 files: 604 tests, 31 failed in 11 files (single-test drift, listed below). Suites that print "requires isolated database" need their own flags (`DB08_ISOLATED_TEST_DATABASE`, `DB10_DISPOSABLE_TEST_DATABASE`, `W04_ISOLATED_TEST_DATABASE`) and are not failures.
- Remaining database failures (need a per-test look at which role the service under test needs): `storage-files-courses-db` (9, FACULTY_TEACHING_SCOPE_REQUIRED in a learner-upload test), `storage-files-projects-db` (7, STORAGE_NOT_FOUND), `placements-p6a-screening` (5) and `placements-p4-eligibility` (3) (revocation tests now fail on `membership.role.manage` first), `tpo-settings-people-service`, `identity-system-roles`, `faculty-notifications-college-scope`, `faculty-c4-reports-audit-contact`, `faculty-mentor-positive-courses`, `db01-composite-role-field-semantics`, `db01-session-atomic-authorization`.
- Unit failures re-measured: 94 tests in 65 files (of the original 78 files). Largest: `shell-model.test.ts` (10, navigation expectations for one workspace role), source-text tests that grep pages for old strings (about 25), `PROJ-BREAK-chat3-faculty-role-journey` / `PROJ-BREAK-FACULTY-02` (old union semantics, rewrite expectations).

### Progress 2026-11-08 (evening): measured against a CI-faithful LF checkout

Local Windows checkouts use CRLF (`core.autocrlf=true`), which makes multi-line source-text assertions fail locally but pass in CI. To get CI-faithful results use an LF worktree: `git -c core.autocrlf=false worktree add ../lms-lf HEAD`, junction `node_modules`, then `git checkout --detach <sha>` per run.

- **unit job:** the 78 originally failing files now pass in the LF worktree (723 of 723 tests). Fixes were test expectations only, apart from two real UI regressions found on the way: the mentor board sprint groups lost their `prototype-mentor-board-sprint-group` class (restored) and a second college placements link still counted only closed plus draft drives (now the real total).
- **database job:** replayed locally on PostgreSQL 16 with the CI steps (journal, prepare, migrate, RLS acceptance, shared store, catalog, DB017, the five DB02 registered suites, then `vitest.db.registered.config.ts`).
- **source-contracts job:** `tests/prototype-parity-shell-contract.test.mjs` passes (35 of 35).
- **lint job:** `npm run ux:guard`, `npm run ux:consistency` and `npm run security:central` pass. The consistency guard was failing on 20 files: 7 fixed with shared components, 11 exempted with a pinned reason (dev-only `/e2e` harness pages, `global-error`, the verbatim privacy policy). ESLint itself is checked separately.
- **Ten failing tests in `tests/ux-public-*.test.mjs` also fail on the commit before these changes; no CI job runs them.** Left alone, listed here for the UI lane.

### Findings from the GitHub runs on 2026-11-08 afternoon

- **Typecheck was red on main for every workflow** because commit `aa66ae6176` (TPO home filter recovery) wrote literal backslash-n sequences into a comment in `src/app/(authenticated)/tpo/home/page.tsx`, which swallowed the following `if` and broke the syntax. Fixed in `95a1c5d1`. Every UX, Security and DB workflow that runs `tsc` failed on it. A parse-only sweep of all 13,524 TypeScript files now reports zero syntax errors (`scratch/parse-all.cjs`).
- **`DB19-P28 tracker privacy, race and registered PostgreSQL acceptance` is a lane conflict, not a test bug:** `tests/db019-p28-tracker-field-review.test.mjs` requires package DB19-P28 and its parent DB-019 to be `done: false`, while `docs/tracker.json` marks both done. One of the two must be changed by whoever owns the DB-019 package; not touched here.
- **Five DB001 verifier-preflight tests fail only on Windows** (`spawnSync npm ENOENT`); they pass on the Linux runner.

## RESOLVED 2026-11-08: CI is green on main

CI run [42457371919](https://github.com/42Students/lms-vnext/actions/runs/42457371919) at commit `db3dae2d90071d307b00cc1893afb4ed10926f07` finished with every job passing (unit, database, db08-staged-acceptance, lint, typecheck, source-contracts, build with the new secret scan, schema-drift and the other staged database jobs). The tracker evidence for 242 assessed controls cites this run (`scripts/security/merge-tracker-pending.cjs`). Still red and unrelated to Gate 0: the scheduled "UI-01 P04 Visual Parity" workflow (failing daily since 2026-11-03: the Playwright login setup gets a 404) and the DB19-P28 tracker test (lane conflict, owner item 18).
