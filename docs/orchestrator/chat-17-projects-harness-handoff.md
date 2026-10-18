# Chat-17 top-priority Projects harness handoff — IIT Dharwad

**Date:** 2026-10-18  
**Branch:** `chatgpt/chat-17-b`  
**Owner remit:** PostgreSQL fixtures for Projects + Placements; reusable race/tenant helpers; example SQL integration witnesses; exhaustive shared UI-kit tests. Do **not** infer full Projects release readiness from fixture authorship.

## Delivered

| Item | File(s) | Count / intended evidence |
|---|---|---|
| Transaction-safe PostgreSQL fixture module | `tests/integration/support/projects-placements-pg-harness.ts` | Dedicated TEST_DATABASE_URL, database-name and migration guards; one outer rollback per test; SAVEPOINT SQLSTATE checks; two independent rollback-only clients for committed-seed concurrency |
| Canonical tenant/role/project/drive fixtures | same | organizations, colleges, users, memberships, system roles, project template/version/assignment, workspace instance, release, sprint, task, resource, mentor/learner roster, task and final submissions, meeting, placement company/relationship/drive/round |
| Real database example suite | `tests/integration/projects-placements-pg-harness-groups.test.ts` | **21** project group cases; **9** placement cases and **3** transaction/FK cases via the same test command: all main project table groups, placement drive, cross-organization SQL scoping, restrictive FK behavior, duplicate/invalid SQLSTATE, savepoint recovery, full rollback and two-session no-leak witness |
| Guard test suite (unit, no PG connection) | `tests/unit/projects-pg-harness-contract-chat17.test.ts` | **7** assertions and multiple unsafe-URL variants; no production fallback |
| Shared UI kit deep suite | `tests/unit/UX-kit-projects-hardening-chat17.test.tsx` | **21** direct behavior groups + a **38-element kit registry** checking popup/motion hygiene; includes form errors, file limits, cancel/pending, keyboard, sensitive links, persistent errors, table empty states and scroll cues |
| Earlier shared kit motion suite | `tests/unit/UX-kit-scroll-motion-01.test.tsx` | **8** scroll/overlay/motion and four previously uncovered shared primitive examples retained |
| Execution scripts | `package.json` | `test:db:projects-harness`, `test:ux:kit:hardening`; included UI and guard suites in `ux:audit:unit` |
| Full usage and safety | `docs/orchestrator/projects-placements-pg-harness.md` | Example imports, SQLSTATE/savepoint API, schema replay, admin and other-college actors, tenancy limitations, no-COMMIT policy |

## Commands

```bash
# Pure UI/unit contracts; no PostgreSQL required:
npm run test:ux:kit:hardening
npm run ux:audit:unit

# Against migrated EMPTY DISPOSABLE test DB, never a shared/prod database:
export TEST_DATABASE_URL='postgresql://localhost:5432/lms_vnext_projects_test'
npm run test:db:projects-harness
```

**Schema baseline:** canonical registered `drizzle/0008` to `0015` project tables, `0016` company and `0018` placement job, `0023` rounds, plus subsequent registered additions such as `0091` delivery events and `0123` sprint dates. The suite does not assert DB073/DB074/DB075 composite FK proposals are deployed; it tests `project_delivery_events_submission_fk`, which was registered by `0091`.

## Hardening scope and caveats

- Guard runs **before BEGIN** and checks **32** canonical table names with `to_regclass` and the server's real `current_database()`. There is no fallback to `DATABASE_URL`, no `COMMIT`, no `TRUNCATE` and no cross-test persistent fixture.
- Projects table ancestry generally uses `ON DELETE RESTRICT` instead of cascading deletes. Witness `PROJ-HARNESS-15` asserts this protective FK behavior. Do not invent cascades.
- Tenant-specific database queries are tested with separate organizations; these SQL queries alone are **not** proof of service IDOR policy. Other lanes must inject contexts and exercise routes/actions. The harness intentionally rejects cross-college actor fixtures.
- `getDb()` services use independent PostgreSQL connections; they cannot read the private uncommitted rows. For request/session tests use a separate disposable provisioned fixture/cleanup lifecycle or dependency-injected DB transaction. No weakening of the isolation guard.
- Non-database hazards (signed file URLs, virus scanning, network resilience, notifications exactly once, adversarial state-machine transitions, 1000+ query plans) remain with the relevant owner lanes and project coverage ledger owner chat-14.

## Honest verification / handoff

This environment has a connected GitHub source workflow, but no runnable local checkout or PostgreSQL. **All tests are authored, not claimed green.** Verify typecheck, lint, UI unit suite and the real PG suite in the orchestrator's disposable runner. Attach execution results to `docs/audit/coverage/projects-ledger.md` (chat-14 lead) and log any real defect in `docs/audit/projects-defects.md`. A failed SQL witness must prompt a production fix/review, not a skipped assertion.

## Addendum: adversarial fixture boundaries (PROJ-HARNESS-22..28; UX-kit-HARDEN-23..29)

- `tests/integration/projects-placements-pg-harness-boundaries.test.ts` now tests foreign-college and non-rostered learners, duplicate/stale final-submission retry, foreign meeting coordinators, suspended college memberships, disabled user accounts, ended project roster memberships, read-only project memberships, and real two-session advisory-lock contention. Tests run on registered PostgreSQL tables with full outer rollbacks, not mock objects.
- The fixture helper now checks current college membership, unended `project_members` entry, and `can_mutate=true` before creating task/final submissions or meetings; final submit verifies the persisted project rather than trusting the caller's stale project context. These are guardrails for **test fixtures** only. Product service authorization and session expiry still require separate end-to-end tests.
- `tests/unit/UX-kit-role-and-overlay-chat17.test.tsx` tests `PermissionAction` own/foreign-tenant, disabled and ended actors, global versus selected-scope Super Admin, native WebView marker identity, table cell-call count, upload prechecks, and persistent toast cleanup.
- `UX-learn-my-placements-announcements-01` new-window notice links now use the existing same-tab, HTTPS-validated `ThirdPartyLink` fallback, addressing the reported chat-17 unit regression.
- Added both suites to `test:db:projects-harness` and `test:ux:kit:hardening`. **Not executed in this connector-only environment**; PostgreSQL, node_modules and running a full typecheck remain runner-side acceptance gates. No success claim without CI evidence.

## Follow-on chat-17 hardening batch (2026-10-18, CI evidence pending)

**PostgreSQL:** additional real SQL examples `PROJ-HARNESS-29..32` in `tests/integration/projects-placements-pg-harness-relations-chat17.test.ts`, wired into `test:db:projects-harness`: registered partial indexes, tenant-bounded EXPLAIN plans, restrictive FK policies and orphan-safe rollback.

**Shared UI kit:** `tests/unit/UX-kit-states-chat17.test.tsx` adds `UX-kit-STATES-01..15` with native button, field error, disabled, focus shell, reduced-motion, alert, link, skeleton and tab state assertions across the 39 source components. `tests/unit/UX-kit-role-and-overlay-chat17.test.tsx` adds `UX-kit-HARDEN-30..32` for encoded table row URLs, nonfinite pagination and ambiguous external URLs. `docs/audit/coverage/chat17-ui-kit-ledger.md` traces all 39 UI files to specific tests and clearly separates SSR/source assertions from unverified browser interaction.

**Auth/identity/tenant weak areas:** tests for disabled and ended memberships, foreign recruiter principal grants, role portal fallback matrix, secure QA config, retention failures, identity bootstrap collisions, verified DNS proof lifecycle and concurrent hostname uniqueness replay. Source and uncovered-runtime audit is in `docs/audit/coverage/chat17-auth-identity-domains-ledger.md`; discovered defects and fixing commits are in `docs/audit/defects-chat-17.md`.

Commands:
```bash
npm run typecheck
npm run test:ux:kit:hardening
npm run test:chat17:weak
# only against a migrated disposable TEST_DATABASE_URL:
npm run test:db:projects-harness
```

**Verification status:** code and tests pushed, but this GitHub connector environment cannot execute Vitest, TypeScript, browser automation or PostgreSQL. The shared orchestrator's latest typecheck / unit-failures files may lag this branch until a merge/runner pass. No claims of passing tests or release readiness without that evidence.

## Latest lane-17 continuation — Projects + kit + unowned spillover (2026-10-18)

- **Projects/Placements harness:** `PROJ-HARNESS-29..36` adds real migration/index/FK/EXPLAIN, rollback, actor-role, suspended-membership and meeting-coordinator negative witnesses in `tests/integration/`. Author, mentor, learner, TPO and coordinator fixtures now require active user and corresponding active persisted membership role, not simply claimed role arrays. `tests/integration/projects-placements-pg-harness-boundaries.test.ts` and `...relations-chat17.test.ts` are registered in `test:db:projects-harness`.
- **UI kit:** `UX-kit-HARDEN-33..37` covers disabled/unknown tab selection and ARIA, combined FileUpload helper/error descriptions, same-origin navigation across DataTable/Breadcrumbs/Tabs/StatTile/Pagination, and WebView fallback when `matchMedia` is unavailable. `tests/e2e/ux-safe-internal-href-chat17.spec.ts` is an optional Chromium browser witness for the exact production URL validator.
- **Unowned Projects spillover:** `PROJ-BREAK-MENTOR-40` replaces native auto-assignment `window.confirm` with shared confirmation; workspace list touch targets and invalid progress ARIA display are corrected (`UX-project-workspaces-41/42`).
- **Tenant/auth weak area:** current suite covers stale actor, wrong-tenant, domain proof, race reconciliation, nested Drizzle 23505 causes, reserved managed DNS labels and disabled recruiter membership. `test:chat17:weak` registers behavioral examples.
- **Coverage and defects:** `docs/audit/coverage/chat17-ui-kit-ledger.md`, `docs/audit/coverage/chat17-auth-identity-domains-ledger.md`, and `docs/audit/defects-chat-17.md` include exact IDs, source/test paths and remaining holes.
- **Latest refreshed public CI report:** `docs/orchestrator/unit-failures-latest.md` (ff6819dd / 698eb9dd) contains **no chat-17 section**; this is not equivalent to all PostgreSQL/browser suites having executed. Remaining system-wide failures are assigned to other lanes. Production/typecheck runner outputs should be rechecked after the next merge.
- **Cannot assert completion of all unowned UX red items:** the generated `docs/audit/ux/COVERAGE-MATRIX.md` still lists many routes and raw tables; some route entries are redirect-only and some table entries predate DataTable migrations. Regenerate the scanner and manually triage active interactive surfaces before claiming closure. Do not delete or weaken tests to make counts green.

Recommended runner commands:
```bash
npm run test:ux:kit:hardening
npm run test:chat17:weak
npx playwright test tests/e2e/ux-safe-internal-href-chat17.spec.ts
# after preparing an EMPTY disposable database with the registered migration journal
npm run test:db:projects-harness
```

## Live browser coverage extension (UX-kit-HARDEN-38/39, UX-kit-E2E-01..03)

The latest shared CI reports available to lane chat-17 do not list chat-17-specific TypeScript or unit failures; their dates/SHAs may precede this branch's new tests. Checked-in branch additions include:

- `src/components/ui/toast.tsx`: use provider-owned monotonic IDs rather than unsupported WebView `crypto.randomUUID` for UI notifications.
- `src/components/ui/use-overlay-webview.ts`: update viewport metrics from `window.resize` even without the optional `window.visualViewport` object, and remove that listener during cleanup.
- `src/app/e2e/chat17-ui-kit/page.tsx` plus `ui-harness.tsx`: **development-only** real React fixtures behind `notFound()` on production builds.
- `tests/e2e/chat17-ui-kit-interactions.spec.ts`: Chromium keyboard/scroll/media-fallback/file-selection/toast behavioral journeys. `tests/unit/UX-kit-dev-harness-chat17.test.ts` verifies the route gate.

Run:
```bash
npm run test:ux:kit:hardening
npm run test:chat17:weak
npm run test:e2e:chat17:kit
# only on an EMPTY disposable database with all registered migrations
npm run test:db:projects-harness
```

**Runner caveat:** this GitHub-only environment cannot execute local compilation, Vitest, Playwright or PostgreSQL, so the new browser fixture/tests are pushed for the next runner pass rather than claimed green. Independently test nested modal Back ownership, physical screen-reader announcements and any named unowned page/role failures before designating the whole queue complete.

- **Nested overlay browser acceptance (UX-kit-E2E-04):** development harness additionally mounts Drawer → BottomSheet to exercise real history markers, nested explicit close, parent survival and Back/focus restoration. Execute using `npm run test:e2e:chat17:kit` and do not mark nested overlays complete without the browser result.

- **PROJ-HARNESS-PLACEMENTS-12:** SQL-backed candidate fixtures now require the supplied round to belong to the selected drive. `tests/integration/projects-placements-pg-harness-placements.test.ts` checks two same-college drives and forbids forged cross-drive round references before any application rows are written. Requires the disposable PostgreSQL integration runner, not just unit/source tests.

## Additional PostgreSQL state/lineage and browser pending-state witnesses

`PROJ-HARNESS-38..43` extend disposable PostgreSQL negative and legitimate transition tests: archived organization/college; revoked persisted learner role; cross-project task UUID; unassigned or readonly project mentors; collaborative team final-delivery submitter distinct from draft author; closed project cannot receive a new final draft or submit an existing draft. `tests/integration/support/projects-placements-pg-harness.ts` verifies those SQL predicates on the same transaction; separate column foreign keys alone are not lineage checks. `tests/unit/projects-pg-harness-contract-chat17.test.ts` protects essential guards. **No DB runner success is asserted.**

`UX-kit-E2E-06` adds a development-only pending `ConfirmDialog` fixture and Chromium test asserting that confirm/cancel actions are disabled, Escape cannot dismiss during pending state, repeated submits are not issued, and completion restores focus. Test remains unverified by a browser runner.

- **Follow-on kit issues:** `UX-kit-HARDEN-45` removes explicitly mobile-hidden fields from DataTable's `More details` overlay; the real Chromium narrow/desktop test confirms private-value visibility tracks viewport and public collapsed fields remain readable. `UX-kit-HARDEN-47` keeps disabled file pickers accessible without falsely marking them invalid. Newly authored tests have no runner result yet.

## Chat-17 handoff continuation — current branch-only CI gates

At latest source inspection, `docs/orchestrator/unit-failures-latest.md` still reported CI `ff6819dd` / `698eb9dd` and no `chat-17` section, while the refreshed typecheck report also listed no `chat-17` files. These snapshots are **not results** for the branch's newest unmerged changes. Verified branch was fast-forward/merged from main before this batch; all additions are pushed to `chatgpt/chat-17-b`.

This batch adds `UX-kit-HARDEN-45` (mobile-hidden DataTable fields must never surface inside More details, including a dev-only browser viewport witness), `UX-kit-HARDEN-47` (disabled FileUpload is not incorrectly `aria-invalid`), `UX-kit-HARDEN-48` (disabled Switch cursor), and `PROJ-HARNESS-46` (task/meeting terminal state, in addition to final-delivery state). Their exact defect/evidence entries live in `docs/audit/defects-chat-17.md` and `docs/audit/coverage/chat17-ui-kit-ledger.md`.

Gate them on the cloud runner without weakening assertions:
```bash
npm run typecheck
npm run test:ux:kit:hardening
npm run test:chat17:weak
npm run test:e2e:chat17:kit
npm run test:db:projects-harness  # only on migrated disposable TEST_DATABASE_URL
```

The UI coverage matrix still contains other teams' page-level/raw-table entries; run the generator against merged code to distinguish stale generated flags from actual active route defects. Do not designate release readiness until the actual browser/PostgreSQL runners and the owning lanes attest passing status.

## Unowned UX spillover accepted (2026-10-18)

- `UX-UNOWNED-TABLE-01`: College Admin recurring-session table migrated to shared responsive DataTable; `Date (IST)`, `Time (IST)` and conflict/empty/confirmation copy retained. IST pure time regression included.
- `UX-UNOWNED-TABLE-02`: Super Admin academic scope hierarchy migrated from raw six-column table to DataTable, 44px controls, safe query-preserving hierarchy page links and effective rule copies. Wrong-origin page destinations are inert. Regression tests added.
- `UX-UNOWNED-TPO-03`: TPO built-in job type settings now uses the shared accessible confirmation instead of browser `window.confirm`, keeping the authoritative API's stale-version and last-active-type protections.
- `UX-kit-HARDEN-49`: FormField required flag now reaches actual input validation, with both SSR and real Chromium checkValidity browser cases.

New targeted regression files are included in `npm run test:ux:kit:hardening`; tests remain **unverified until CI runs**. Refresh `docs/audit/ux/COVERAGE-MATRIX.md` from the generator after merging; do not manually edit red gap counts.

- **Unowned interview operations (UX-UNOWNED-TABLE-04):** `src/components/admin/super-admin-interview-operations.tsx` now uses the shared responsive `DataTable` for all eleven interview fields with actions visible on mobile; keeps 500-row CSV cap, conflicts, IST and `.ics`. New `tests/unit/UX-admin-interviews-table-chat17.test.ts` registered under `test:ux:kit:hardening`.

- **Interview browser follow-up:** The development-only fixture mounts the Super Admin interview grid with synthetic overlapping room bookings. Chromium test `UX-UNOWNED-TABLE-04` checks mobile filters/conflicts and real `.ics` download. Include `npm run test:e2e:chat17:kit` in CI, with the site running in development mode. Demo entries are not tenant data and do not test API authorization.

- **Intentional raw grid triage:** `docs/audit/ux/chat17-dense-grid-exceptions.md` documents the TPO spreadsheet grid and the College Admin attendance month matrix as *provisional exceptions*, with keyboard/mobile/permissions acceptance gates. `tests/unit/UX-dense-grids-chat17.test.ts` guards the existing a11y/mobile source contracts. All other raw-grid scanner results still require triage; no scanner rule was weakened.

- **PROJ-HARNESS-47** fixes a critical false-positive fixture: task submissions previously used an unassigned task on a PLANNED sprint, unlike production policy. Canonical task now has the enrolled learner as assignee and ACTIVE sprint; persisted wrong-assignee and non-active sprint checks are tested. Execute `npm run test:db:projects-harness` on the migrated test DB before relying on these fixtures for IIT Dharwad readiness.

## Further unowned responsive table and fixture integrity work

- `UX-UNOWNED-TABLE-06` changes the sensitive verification education table to a bounded 5-field projection plus DataTable, omitting arbitrary identity/document content; unit test protects projection.
- `UX-UNOWNED-TABLE-07` changes Super Admin student bulk-import history into DataTable inside its original modal.
- `UX-UNOWNED-TABLE-08` changes faculty bulk-import outcome rows to DataTable and replaces `window.confirm` with shared accessible confirmation, preserving file-size, exact copy and server-confirmed payload.
- `PROJ-HARNESS-47` changes canonical project task fixtures to an ACTIVE sprint with the learner explicitly assigned to the task, then guards persisted assignee and sprint/task state on task submission. Previously the fixture generated submissions that production submission service would reject. This must be run against a real migrated disposable test DB before the harness is used as acceptance evidence.

Tests are registered in `test:ux:kit:hardening` and `test:db:projects-harness`. Cloud execution is **pending** and only actual runner output can close these items.

## CI 834983cc follow-up — managed domain and unowned dense-grid regressions

- **Priority unit failure (chat-17 / WEAK-tenant-managed-20):** `managedBaseDomain` now rejects raw IP-literal wildcard suffixes that were previously accepted after prepending `test.` before `normalizeTenantHost`. New negative values include `127.0.0.1`, `8.8.8.8` and `0.0.0.0`. Separately, `normalizeTenantHost` rejects **all explicit ports**, including HTTPS default `:443` which WHATWG URL parsing silently drops from `URL.port`. The associated `tenant-domain-validation.test.ts` asserts `:443`, `:80`, `:8443`; incoming `normalizeRequestHost` still tolerates Host-header port intentionally. Source and tests committed on `chatgpt/chat-17-b`. CI result for this new head not yet available; do not claim fixed green merely because the old failure file is unchanged.
- **UX-UNOWNED-GRID-09:** Semester course mappings retain drag/drop and keyboard reorder alternatives but now use shared `ScrollCue` to expose horizontal overflow, and input/edit/reorder target heights are at least 44px. `tests/unit/UX-college-term-mapping-scroll-chat17.test.ts` is included in `test:ux:kit:hardening`.
- **UX-UNOWNED-DENSE-GRID-10:** College Admin people directory already renders a native desktop table and a separate mobile card list. Added source regression protecting membership status, private masked contact, verification and audit/class-move action parity. This is not proof of live authorization; source and acceptance caveats are recorded in `docs/audit/ux/chat17-dense-grid-exceptions.md`.
- **Typecheck report:** `docs/orchestrator/typecheck-errors-latest.md` (CI 834983cc) lists no chat-17-owned TypeScript errors. Production typecheck and lint were previously green, not a post-commit certification. Run `npm run typecheck`, `npm run test:chat17:weak`, and `npm run test:ux:kit:hardening` in cloud CI after merging, followed by disposable-DB and Chromium suites.


## 2026-10-18 late chat-17 lane batch — branch-only source closure

- Branch `chatgpt/chat-17-b` was fast-forwarded to `main` (7fda3868), then merged with a newer `main` (580c2ad9) without discarding its unique commits. All changes remain on chat-17's branch; no direct main write.
- Latest failure report lists two chat-17 unit cases: `UX-/tpo/verification-coverage-02` and `WEAK-tenant-managed-20`. The verification page now intentionally uses `parseTpoVerificationParams` from its validated server model, not a direct `tpoVerificationQuerySchema` import. The source assertion was updated to the actual authorization-boundary parser.
- `WEAK-tenant-managed-20` now validates the configured suffix directly through `normalizeTenantHost`, rejecting explicit ports, IPs including shorthand/numeric variants, Unicode rewriting, wildcard characters and localhost. The feature stays TLS-ready gated.
- `UX-kit-HARDEN-51` protects users requesting reduced motion from animated Switch `::after` thumb movement; component-level unit assertions added. UX kit ledger has 39 rows for all 39 current `src/components/ui` files; existing real client interaction tests are registered, but source inventory does not substitute for browser acceptance.
- `PROJ-HARNESS-ROLLBACK-04/05` adds real PostgreSQL witness cases for SQLSTATE mismatch recovery within SAVEPOINT and cross-session visibility plus rollback on callback failure. No fixtures commit or target application DB connections.
- The latest checked-in typecheck report names no chat-17-owned compile error. This is not a claim that the new branch passes typecheck, unit, browser or PostgreSQL tests. Run `npm run typecheck`, `npm run test:ux:kit:hardening`, `npm run test:chat17:weak`, `npm run test:e2e:chat17:kit`, and `npm run test:db:projects-harness` using a migrated disposable `TEST_DATABASE_URL`. Continue to treat the rest of the project/placement suites as a release gate.
