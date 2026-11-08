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
