# DATABASE core eleven — five-task closure execution handoff

**Date:** 2026-10-12 · **Base main inspected:** `512a1311e7130454b1adbf2d9a6f2524b8096807` · **Phase:** DATABASE only · **Classification:** executable owner handoff, **not** acceptance evidence.

This is a closure-first handoff covering exactly five of the eleven original open tasks: **DB-030, DB-005, DB-007, DB-012 and DB-003**. It does **not** create queue tasks, claim owners' paths, authorize a phase transition, or mark any of these five COMPLETED/DONE_VERIFIED. Five closures are the user target, **zero are claimed complete by this handoff**.

## Proof standard and shared dependencies

- Work from fresh `main` and recheck `docs/coordination/phase-state.json`, `work-queue.json` and all six checkpoint files before changes. The globally active phase is DATABASE; Chat 1/W01 is the sole writer of `drizzle/**`, `src/db/schema/index.ts`, shared CI and root package infrastructure.
- CI Actions are intentionally unused (billing). Use **only** an approved disposable PostgreSQL for destructive replay; verify URL/host/database against the application's real target and preserve a clean, exact-SHA working tree. Never run resets on any retained data.
- W01 must reconcile dependencies, register each approved staging package **once**, preserve source design and avoid superseded duplicate candidates. All five tasks need an explicit completion boundary below and an evidence-bearing task-owner status transition.
- Before database acceptance, execute `npm ci` and `npm run db:verify:independent` on a clean commit using Node 22 and a disposable PostgreSQL 17 instance. That verifier runs journal verification, reset + zero-to-head migration, idempotence, DB parity and DB integration suites. Preserve full commands, redacted configuration, log/output hashes and exact commit SHA. This is a **gate**, not a claim that it ran here.
- **DB-002 critical path:** queue currently lists prerequisites DB-001/DB-025 as `COMPLETED` (not `DONE_VERIFIED`). The six-chat claiming rule requires `DONE_VERIFIED` prerequisites; resolve that operational sequencing with Chat 1 using valid evidence or an explicitly reviewed prerequisite-policy decision. Do not falsify verification status just to pick DB-002.

## 1. DB-030 — Assessment relational integrity (owner Chat 1, first executable candidate)

**Existing registered work:** migrations 0041 and 0042, assessment scope and grader guards, source tests in `tests/db028-assessment-parent-scope.test.mjs` and migration-specific tests. The registration is not proof the migrations apply.

**Next action:** execute zero-to-head migration replay and the explicit PG01–PG22 matrix in `docs/planning/db06-assessment-relational-integrity-handoff.md`, including the added PG15B/PG16B/PG19B cases from the queue notes. Both concurrency commit orders and deliberate invalid existing rows must fail closed. Preserve course/quiz/assignment/group regression results. When DB02/DB05 migrations are later registered, **rerun** the cross-parent race/scope tests; a prior pass on older schema is not final acceptance.

**Close only when:** migration replay, negative FK/college/learner/grader/enrollment/grade tests, positive transitions and two-session races actually pass against the final registered schema on the recorded SHA. Until then DB-030 remains blocked.

## 2. DB-005 — Academics and timetable (owner Chat 4; migrator Chat 1)

**Existing authored work:** 125/125 source/target dispositions, canonical unregistered `scripts/sql/db02-academic-progression-and-rooms-staging.sql`, 52 staged functions/60 triggers per owner checkpoint, source tests, rollback-only and two-session race cases.

**Next action:** W01 deduplicates and registers the *canonical* stage with its program-term/cohort history, promotion readiness, faculty-course association, periods, room and timetable scope. Do not reintroduce retired `db02-promotion-readiness-guard.draft.sql` or `db02-curriculum-type-history-guard.draft.sql`. After clean PostgreSQL replay, run the guarded runner:
```bash
DB02_DISPOSABLE_ACCEPTANCE=YES \
DB02_EXPECTED_DATABASE=<exact_disposable_database_name> \
DATABASE_URL=<redacted_disposable_postgres_url> \
bash scripts/sql/db02-run-disposable-acceptance.sh
```
The runner has authored source/rollback/concurrency suites; capture *actual* outcome, not test definitions. Verify one-winner cohort promotion CAS, core curriculum/promotion prerequisites, scoped child/ancestor reparenting, room allocation and both lock-order race outcomes.

**Close only when:** normalized parent/foreign-key/transition behavior matches legacy, registered migration replay and guarded runner pass, and cross-domain downstream DB03/DB05/DB06 dependencies are reconciled.

## 3. DB-007 — Learner private profiles (owner Chat 3; migrator Chat 1)

**Existing authored work:** 103/103 source classifications; staged normalized qualification/education and image collections plus private receipt and same-owner constraints, in `docs/planning/db04-qualification-image-persistence-contract.md`. These are unregistered and no runtime producer cutover is proven.

**Next action:** W01 registers only the approved normalized DB04 shape once (not duplicated receipt FK/index rules). Run clean migration and the disposable DB04 witness. Negative cases: cross-college education/image/receipt association, receipt purpose/scan/revocation/expiry, currently-pursuing end year, historical grade constraints, archived screening leaks and active/recent uniqueness races. Positive cases: GPA and CGPA grading, recent education, deactivation idempotency. Prove current profile CRUD and placement-screening readers consume the registered normalized source.

**Close only when:** actual DB/privacy/tenant and producer-consumer tests succeed; `student_registration` and `approver_id_card` historical retirements have consumer evidence or explicit approval, not implied by zero migration requirement.

## 4. DB-012 — TPO/recruiter relational model (owner Chat 3; migrator Chat 1)

**Existing authored work:** 279/279 source design dispositions, canonical `docs/planning/db09-integration-manifest-2026-10-11.md`, draft CRM/policy/collaboration/schedule/notification/recruiter-company guards. None is accepted PostgreSQL schema just by being in the repo.

**Next action:** W01 reconciles parent composite unique keys against DB01/DB08/DB10 and registers the canonical sources in manifest order. Do not install superseded CRM, scheduling, notification or settings drafts. Execute actual negative and two-session PostgreSQL cases for company-grant equality, college/TPO authority, history immutability, active role state, lifecycle, recruiter scope, scheduling capacity and notification races. Cross-check runtime sender/CRM operations against registered columns and exact grants; preserve API phase boundaries (do not declare API parity prematurely).

**Close only when:** one coherent registered schema, replay and tenant/privacy/concurrency witnesses pass and required source-to-consumer behavior is demonstrated, not merely 279 field classifications.

## 5. DB-003 — Historical Smrithi scope (owner Chat 6; product decision required)

**Existing source evidence:** `docs/planning/db00-smrithi-source-evidence.json` and `docs/planning/db00-historical-engine-disposition.json` record seven persisted legacy tables with **91 candidate fields**:
`smrithi_application` (28), `smrithi_college` (7), `smrithi_college_keywords` (2), `smrithi_education_type` (9), `smrithi_notification_template` (28), `smrithi_program` (9), `smrithi_specialization` (8).

**Next action:** obtain an explicit product-scope disposition for all seven aggregates: preserve their active semantics with source-to-target mappings **or** approve their retirement based on reliable producer/consumer evidence. Existing JPA census, historical MySQL test snapshot through approximately V150, GitHub indexed-search absence, and a source sweep of later V151–V194 are useful *negative clues*, not proof that no detached/native SQL or external consumers exist. Greenfield no-data-migration removes row migration, **not feature compatibility**.

**Close only when:** source/lifecycle/API/external consumer evidence and explicit owner/product decision are attached to each table, the 91 fields receive supported dispositions, and the DB00 ledger is reconciled. Do not silently auto-retire Smrithi from user request to close tasks.

## Explicit nonclosures and reporting

At this handoff's base SHA, the original eleven remain open and **none of these five has newly executed PostgreSQL acceptance**. `DB-002` and `DB-017` (Chat 1 migrations), `DB-019` (dependent global field inventory), and `DB-020` (final phase signoff) cannot be certified early to satisfy a numerical target. Keep the task denominator fixed unless a genuinely novel P0 issue requires a separate task. For each future closure record committed implementation SHA, exact executable command and exit status, PostgreSQL version, redacted connection target, negative/race outcomes and owner signoff. A queued status change without this proof is not a closure.
