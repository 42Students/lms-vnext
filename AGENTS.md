## CURRENT OWNER DIRECTION — 2026-11-05: SECURITY IS THE ACTIVE CLOSURE WORKSTREAM

**Mandatory priority for all vNext chats:** Security hardening and evidence-based security closure now take precedence over UI polish or reopening the previously accepted DB/API/UI engineering work. The only live source of status is [docs/tracker.json](docs/tracker.json), with `currentWorkstream: SECURITY` and 493 individual `security.controls` statuses grouped under SP-01..SP-10. The historical `currentPhase: UI` and five phase certificates remain unchanged; engineering acceptance is **not** security or release certification.

- Start with `npm run progress -- --closure-next` (now security-first), `npm run progress -- --security` or `node scripts/security/control-progress.mjs --check`. The security programme and acceptance contract are in [docs/security/README.md](docs/security/README.md) and [docs/security/tracker-integration.md](docs/security/tracker-integration.md).
- Prioritize confirmed exploitable or governance gaps, then independently verifiable implementations and partially evidenced boundaries; audit unassessed controls without equating **unassessed** to **unimplemented**.
- To close a control, capture exact affected code/configuration, successful and adversarial test execution at identified commit/environment, real deployment boundary evidence when applicable, and independent review. Only `VERIFIED` counts as complete. Failed/skipped jobs, green source-only checks, locally authored tests and an unprotected `main` do not satisfy closure.
- Preserve all 101 previously accepted DB/API/UI packages and previous evidence; do not recertify or reopen completed engineering packages unless a concrete regression demands it. No independent public release security claim until the 493-control requirements and separate release gates are met.
- Shared `main` has concurrent writers. Fetch and reconcile fresh HEAD before each patch; never overwrite another chat's canonical security-control updates. Never commit credentials, sensitive provider receipts or private production data.

---

# LMS vNext engineering rules

## CURRENT OWNER DIRECTION — 2026-11-03: 100% required capabilities, NOT pixel clone

**Mandatory for every chat, coding task, audit and reviewer from now on.** Read [docs/planning/legacy-capability-parity-standard.md](docs/planning/legacy-capability-parity-standard.md) before any old LMS → vNext UI task.

**North star:** no required old-LMS page surface, section, tab, control, modal, filter, status or real user job may be missing or broken in vNext. Use pinned old FE + BE code as the completeness/behavior oracle; use all 3,169 reference images and 783 packages from the separate `parity-baseline` branch as **discovery evidence**, not 783 pixel acceptance obligations. Preserve better vNext UX, accessibility, working functionality and modern UI architecture.

- **Stop pixel-perfect work immediately:** exact typography, sidebar dimensions, colors, CSS coordinates, pixel-difference thresholds, old card density and screenshot similarity are **not required UI parity gates**. Older pixel-clone master plans/checklists are superseded, including any previous instruction to reproduce the old shell to the pixel. Do not implement, prolong or reject a working feature solely to reduce image-diff percentage.
- **Preserve everything the old LMS can actually do:** trace FE affordance/handler → BE/API/service → permission/tenant/side effect → corresponding vNext workflow and its UI states. Screenshots miss conditional and post-submit states; audit source too. A better-looking vNext screen with missing actions is not parity, and a different-looking screen with complete verified actions can be parity.
- **Keep correctness gates:** account matrix, detailed `docs/parity/*.md`, family verification, exact old FE/BE SHAs and current vNext SHA, negative auth/tenant tests, browser/mobile usability, producer→consumer and `npm run parity:clone-gate`. Those are **functional** gates, not color/geometry checks.
- **Closure first:** select the smallest concrete missing or broken user job with executable evidence; implement the whole UI→API→outcome slice, update existing ledgers (never create another tracker), test, close and move to the next open item. If only appearance differs, mark visual-polish-later and move on.
- **Existing work:** keep the 3,169 screenshots, the merged image-diff tooling and prior evidence. Re-evaluate old-style UI changes for discoverability and regressions; do not delete working vNext capabilities or force-hide them merely to mirror an old screenshot. Distinct future UX polish is allowed after coverage.
- **Numbers:** distinguish packages/images from source-backed required actions and VERIFIED actions. No fabricated percentages or “pixel-certified” required count.

This section overrides contradictory historical visual-clone rules in older design docs. It does **not** relax security, data, authorization, runtime, API or release requirements.


## Single authoritative plan — open contribution, 31 October 2026

**Read [docs/tracker.json](docs/tracker.json) first.** Its `execution` section is the sole live roadmap and the 81-task database acceptance tracker. **No worker lanes, claims, exclusive domain ownership, or permission-to-edit handoffs exist.** Domain packages in the tracker are informational categories; anyone may take any OPEN task. Historical lane/coordination documents are archival evidence only and confer no authority.

- **DB-019 parallel assignment board (user-requested):** the single authoritative `docs/tracker.json` DB-019 `workPlan.packages` now lists 33 fine-grained packages. Use `npm run progress -- --db19 --unpicked` to find unpicked/open work and `npm run progress -- --db19` to see all statuses. The user may assign a package to a chat by setting `picked:true,pickedBy:"CHAT_ID"`; on reassignment, replace the previous name. `picked` is visibility only, **not an exclusive lock** or a new lane system. Before touching overlapping files, coordinate on fresh main. Change `done` only after the package-specific exact-scope acceptance gate has *executed* and evidence is recorded; P31/P32 are sequential gates. DB-019 parent remains OPEN until fully accepted; the 79/81 accepted count is unchanged by package pickup. Never create a second tracker.
- **Closure first:** run `npm run progress -- --closure-next` to select an unaccepted task with an exact executable gate. `npm run progress -- --domains` shows thematic categories, not assignments; `npm run progress -- --check` validates the tracker. Never reopen accepted `done:true` work without a demonstrated regression or user-directed change.
- **Parallel progress without clobbering:** always fetch the latest `main` before editing. Coordinate direct same-file overlaps and serially integrate changes to numbered migrations, journal, snapshots and shared schema barrels. Use a fresh blob SHA or expected-head lease, reconcile conflicts, and never force-overwrite another contributor's changes.
- **Original scope still controls acceptance:** live persistence/runtime tasks require executed exact-SHA registered PostgreSQL replay, relevant tenant/permission/privacy/FK/state/race tests and real producer/consumer behavior. A staging/disposition-only task can close after actual scoped tests only when named downstream integration tasks remain OPEN with explicit boundaries. Unexecuted CI, authored tests and staging-only passes are not production proof.
- **Cohesive batches:** prioritize the smallest correct code+test batch that can be accepted, not another inventory round. After two useful passes without acceptance, record an exact blocker and switch to an independent OPEN task.
- **Global phase gates:** DATABASE → API/user jobs → UI **feature and user-job completeness** → RELEASE, as represented in `docs/tracker.json`. Optional later UX/visual polish is a separate improvement phase, not a blocker for functional parity. Partial domain work in later phases is allowed but does not certify them. The approved product is greenfield; do not introduce old-LMS production-data migration.

## Mandatory closure-first loop

**Before changing code:** read the current main HEAD, AGENTS.md and `docs/tracker.json`; run `npm run progress -- --closure-next`. Select any task with `done:false`. There is no lane claim, single-owner rule or domain edit restriction.

1. Identify the task's original scope and precise outstanding gate. Inspect registered schema, real write/read paths and prior exact-SHA run evidence before patching.
2. Prefer a task with all dependencies and a finite verification path. Leave accepted tasks frozen.
3. Make focused changes with meaningful negative tests; serialize shared migration/journal updates against fresh main and prevent concurrent same-path overwrites.
4. Execute the acceptance gate: registered disposable PostgreSQL/tenant/privacy/race/consumer evidence for runtime, or actual pinned source tests for explicitly isolated staging tasks with clearly named still-open runtime work.
5. Mark `done:true` only with `acceptedAt` and executed `acceptanceEvidence` satisfying the original scope; never reclassify a missing runtime/security requirement as deferred.
6. After two passes without closure, state the reproducible blocker and next action, then choose another independent OPEN task.

Continuation reports must state the live `N/81` accepted count, any newly accepted IDs with exact commit/run proof and remaining named blockers. The sole active tracker stays in `docs/tracker.json`. Do not create duplicate progress files.

## Non-negotiable architecture rules

- Keep one repository and one deployable application.
- Keep the system a modular monolith.
- TypeScript is the application language.
- PostgreSQL is the system of record.
- Do not add microservices, Redis, Pub/Sub, Kafka, GKE, GraphQL, or a second database without a demonstrated production requirement.
- Do not split frontend and backend into separate repositories.
- Do not port legacy Java classes file-for-file.
- Preserve business behavior, not legacy implementation structure.

## Module rules

- Core business logic belongs in `src/modules/*`.
- React components should orchestrate UI, not encode domain invariants.
- Validate untrusted inputs with Zod at boundaries.
- Authorization must be explicit and centralized; avoid scattered role string checks.
- Tenant-owned data must be scoped by college/tenant context.
- Database access must use shared pooled Drizzle/Postgres infrastructure.
- New abstractions require a concrete use case.

## Quality gates — targeted during implementation, full at acceptance

- **Inside a cohesive batch:** run the relevant focused lint/typecheck/unit or SQL/database tests that can detect the touched regression quickly. Keep the known full-suite failures visible; do not add skip flags to hide them.
- **Before declaring a registered migration, live persistence, or runtime task DONE:** independently execute **registered-journal replay, drift, tenant/FK/history/state/concurrency and affected service tests on disposable PostgreSQL**, plus task-specific acceptance and decisions. For explicitly isolated source/staging/disposition-only deliverables, run their actual source tests and preserve named open runtime integration tasks; a staged-only test remains **never** promotion proof.
- **Before phase or release sign-off:** execute and pass the complete applicable lint, typecheck, unit, build and relevant browser/Playwright matrix on an identified revision. Unrelated red CI jobs remain blockers to global acceptance, even if the focused batch succeeds.
- Commit and test **one coherent batch**, rather than causing a full serial GitHub Actions run on every small document/test adjustment.

Every migrated legacy rule should gain a meaningful regression test where practical.

## Migration principle

For each legacy feature:

1. understand current behavior
2. classify it as business rule, intentional legacy behavior, or bug
3. design the vNext domain model
4. implement cleanly
5. verify against the legacy system
6. migrate data separately
7. cut over only after reconciliation

During clone parity, never silently change user-visible legacy behavior merely because it appears buggy. Record the behavior first. Security, privacy or data-corruption defects may be corrected immediately, but the deviation must be documented as a parity exception. Non-critical product quirks should be preserved until parity is proven or the user explicitly approves a redesign.

## UI visual identity rules

- The existing LMS production palette is the vNext color source of truth.
- Canonical mapping lives in `docs/design-system/lms-color-parity.md` and `src/app/globals.css`.
- Use semantic LMS tokens instead of raw Tailwind zinc/slate/blue palettes for product UI.
- Never accept shadcn default colors as a substitute for the LMS brand palette.
- Do not introduce a new raw UI color without a concrete semantic need and a documented parity decision.
- Keep brand tokens and UI quality coherent; a different pixel/color from the old screenshots is **not** a missing-feature defect. Fix contrast/accessibility/meaningful state colors as usability defects; defer cosmetic pixel matching.


## Greenfield data rule

- LMS vNext is a fresh system. No production/legacy LMS data needs to be migrated.
- Do not build legacy DB connections, extractors, reconciliation tooling, migration runners, or data backfills unless the user explicitly changes this decision later.
- The legacy `lms` / `lms2-fe` repositories remain behavior, UX and regression references only.
- New vNext data should be created through vNext application flows, seeds, fixtures, or test factories.
- The existing `legacy_id_map` schema artifact is not an active product dependency and must not be used as justification to restart migration work.


## Legacy account-surface parity — release gate

Until account parity is closed, `42Students/lms2-fe@prod-2026` is the user-facing product oracle for Learner, Faculty, Mentor, College Admin, Super Admin, TPO and HR/Recruiter.

For every legacy page, tab, section, card, modal, action and meaningful workflow:
1. classify the route in `docs/planning/legacy-ui-route-manifest.md` and inventory the user job in `docs/planning/account-surface-parity.md`;
2. open the matching account spec under `docs/parity/` and account for the page's sections, tabs, actions, forms, filters, modals, drawers, states, permissions, responsive behavior and regression coverage;
3. recreate the user-visible capability in vNext before redesigning it away;
4. implement it with the vNext architecture — do not paste legacy Pages Router, Redux, Ant Design or service-layer code;
5. update the master matrix and the detailed page checklist in the same implementation commit;
6. preserve tenant/role safety and add regression coverage where practical;
7. classify intentional deviations explicitly as REDESIGNED or RETIRED with a reason.

No legacy surface may disappear silently. A consolidated vNext workspace does not automatically count as page parity when the legacy product had a distinct daily-use surface. First reach parity; then consolidate/redesign as a separate pass.

Do not call LMS vNext feature-complete while `npm run parity:status` reports PARTIAL, MISSING, VERIFY or BLOCKED rows, while `npm run parity:pages` reports any open detailed checks, or while any account parity checkbox remains open. A master-matrix DONE row is not deeply closed if its corresponding `docs/parity/*.md` contract still has unresolved required behavior. Refresh the frozen legacy route manifest and affected page specs when `lms2-fe/prod-2026` materially moves.




## No-surprise clone protocol — highest parity authority

Read `docs/planning/clone-parity-protocol.md` before account parity work. It is the release gate above the route manifest, master matrix, detailed page specs and account ledgers.

Key rules:
- exact legacy FE/BE SHAs are evidence, not branch names;
- a family-level verification record is required in addition to surface checkboxes;
- when legacy `prod-2026` materially moves, affected family evidence becomes STALE even if individual rows remain historically CLOSED;
- source comparison alone cannot close browser-sensitive UI;
- consumer UI cannot be final-verified if the upstream producer workflow is missing;
- REDESIGNED/RETIRED cannot hide a daily-use feature;
- final cutover freezes exact legacy oracle SHAs and re-diffs every earlier family against that frozen oracle;
- `npm run parity:clone-gate` must report READY: YES before vNext may be called an as-is replacement.

## Learner parity execution ledger — mandatory workflow

For Learner work, `docs/planning/learner-ui-surface-ledger.md` is the operational queue and `docs/planning/learner-family-verification.md` is the freshness/evidence gate above it. It is intentionally more granular than the route manifest or the prose parity spec.

Every coding chat working on Learner parity must:
1. read the ledger before editing;
2. refresh `lms2-fe/prod-2026`, `lms/prod-2026`, and `lms-vnext/main` heads;
3. continue from the first unresolved ledger row unless the user explicitly selects another row/family;
4. compare the exact legacy page/component behavior before coding;
5. add newly discovered UI surfaces to the ledger before implementing them;
6. move a row through `UNCHECKED → AUDITING → GAP → FIXED → CLOSED` as appropriate;
7. mark `CLOSED` only after a second legacy-vNext comparison and required regression/browser verification;
8. update the ledger and affected parity docs in the same commit as the implementation;
9. update the matching family verification row with exact legacy FE/BE SHA, vNext SHA, source/test/browser/cross-role evidence before marking a family VERIFIED;
10. if legacy moved since that family was verified, mark the family STALE and diff old verified SHA → current SHA;
11. hand off the current row ID + next unresolved row when chat context is ending.

Run `npm run parity:learner` for the machine-counted Learner ledger + family-evidence status. `FIXED` is not closed; `BLOCKED` and `STALE` are not release-ready.

## Authentication rule

- Sign-in is **first-party phone/email one-time codes**, as in the legacy LMS: Exotel SMS and ZeptoMail email, opaque per-device sessions. See `docs/architecture/first-party-login.md`.
- Do **not** reintroduce Firebase / Google Identity Platform for sign-in, session cookies or user creation. Older handoff and checklist text that mentions Identity Platform is superseded by this rule.
- A college host serves only that college, enforced at login and on every authenticated request (`src/modules/auth/tenant-access.ts`). Do not bypass it.
- Test one-time codes exist only when `APP_ENV=development` and are never accepted in production. Never send a real SMS or email from tests; use the fakes.
- Production SUPER_ADMIN access needs a second factor before launch (`docs/architecture/privileged-authentication.md`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
