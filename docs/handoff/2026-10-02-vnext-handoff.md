# LMS vNext — Current Handoff

> **2026-10-05 no-surprise parity directive:** account/page parity is the highest-priority non-cloud work and a release gate. Read `docs/planning/clone-parity-protocol.md` first. For Learner, use `docs/planning/learner-ui-surface-ledger.md` for surface work and `docs/planning/learner-family-verification.md` for freshness/evidence. Clone the current legacy product as-is using clean vNext architecture; redesign/consolidate only after parity is proven or explicitly approved.

**Date:** 2026-10-02
**Repository:** `42Students/lms-vnext`
**Branch:** `main`
**Baseline used for this handoff refresh:** `63cdc1ac42dd2fb58358f68baeb45466082f3115`
**Latest verified CI at that baseline:** run #52 — green

Always verify the live `main` HEAD and latest CI before changing anything.


## 0. Current execution mode — parity ledger

Learner work is now driven by `docs/planning/learner-ui-surface-ledger.md`.

Continuation chats must not restart with a broad Learner inventory. They should:
- refresh legacy FE/BE + vNext heads;
- run/read `npm run parity:learner`;
- take the first unresolved row/family;
- inspect the exact legacy implementation;
- add any missing sub-surface to the ledger;
- fix the gap;
- re-check parity;
- mark only genuinely verified rows `CLOSED`;
- continue to the next row.

Status meaning is strict: `FIXED` means implemented but still awaiting final parity/browser/regression verification. `BLOCKED` remains open. The next chat should be able to continue from the ledger without relying on conversation memory.

Current audited legacy baseline when this mode was introduced:
- `lms2-fe/prod-2026`: `38cdd38e592a6f416c8e8e99ce36438f548ed577`
- `lms/prod-2026`: `36f93fc49dc93bfc8ad9f499a1247fbf7f98a1a9`
- vNext before ledger commit: `6b602390d1b3d2e577991ce8698ea6f0eb2940f5`

Always refresh these heads before closing rows.


### Current oracle drift — release blocker

The original Learner audit baseline is stale for final sign-off.

Current observed heads on 2026-10-05:
- `lms2-fe/prod-2026`: `1d563f75f10ede5dcc0a7b17ad65b75ea03dd07d`
- `lms/prod-2026`: `94af997f8f9529ffbe7da317fff47f86c16bcebf`
- vNext before the no-surprise protocol: `db6f3c0db7ae4d2402211b1a65650de499b97c69`

The original FE baseline is materially behind current `prod-2026`. Material changes include learner Profile Verification/private marksheets, learner Profile section removals, placement/module-access behavior, project semantics and new account routes. The frozen route manifest is therefore stale.

No Learner family is release-valid until its row in `docs/planning/learner-family-verification.md` is VERIFIED. Run `npm run parity:clone-gate`; it must remain blocking until the final frozen-oracle sweep passes.


### Latest Learner parity batch

The current Learner batch closes a concentrated set of source-level parity gaps without weakening the final verification gate:

- Course Discussions: sender grouping, newest-message landing, unseen-message counter, multi-pin context and persistent learner help cue are implemented.
- Learning Path: current/completed/in-progress lesson state, per-lesson content-type counts, overdue/expired assessment cues and partial watched percentages are implemented.
- All Assignments: aggregate cards now open an in-page right drawer; text/link submission and existing submission/grade/feedback review work there. File-backed submissions remain blocked on secure storage.
- Learner Profile: obsolete Job Preferences and Placement Academic Record cards were removed from the learner self-profile to match current production.
- Profile Verification was audited against current production but is intentionally not faked: education verification requires marksheets + resume and identity verification requires private Aadhaar/PAN documents, so the state machine remains open until the secure storage prerequisites are available.
- Placement Assessments was audited and needs an explicit assessment-deadline model; do not infer legacy Due today/Overdue buckets from vNext `scheduledAt` or `resultsDueAt`.

Continue from the first unresolved Learner family/row after refreshing all three heads. Do not convert `FIXED` to `CLOSED` or a family to `VERIFIED` without executed browser/mobile/regression evidence.

### Greenfield data decision — locked

The legacy/current LMS is not in active use and **no legacy production data needs to be migrated into vNext**.

- Phase 6 legacy migration tooling is retired.
- Do not build legacy DB connections, extractors, profilers, reconciliation runners or backfills.
- Legacy repos remain behavior/UX/regression references only.
- All vNext data starts fresh and is created natively.
- Do not restart migration work unless the user explicitly changes this decision.


---

## 1. Locked architecture — do not reopen

- one repository, one deployable application
- Next.js App Router + TypeScript + React + Tailwind
- modular monolith
- PostgreSQL + Drizzle
- Cloud SQL for PostgreSQL
- Google Cloud Identity Platform + Firebase Admin server sessions
- Cloud Run
- Cloud Storage when file workflows need it
- Vertex AI later behind an app-level abstraction
- no separate FE/BE repos
- no microservices/GKE/Kafka/GraphQL/Redis unless production evidence requires them
- tenant ownership resolved server-side
- authorization centralized in `src/modules/permissions/policy.ts`

## 2. Core platform status

Completed and green:

- repository/foundation/CI/Docker standalone build
- package-lock committed; CI and Docker use `npm ci`
- canonical core PostgreSQL schema
- canonical Drizzle migration + metadata
- local Postgres migrate/reset/seed workflow
- deterministic two-college seed scenario
- real PostgreSQL CI integration tests
- migration drift detection
- Organizations backend + APIs
- Colleges backend + APIs
- Departments backend + APIs
- centralized authorization and tenant isolation
- Identity Platform server-session architecture
- canonical users + multi-college memberships
- People onboarding/read APIs
- membership role management
- membership suspend/reactivate/end lifecycle
- learner profile
- faculty profile
- secure operator-only SUPER_ADMIN bootstrap
- system-role administration policy
- tenant-domain lifecycle, DNS verification and host resolution
- Cloud Run/Cloud SQL Unix-socket runtime configuration
- `/health` liveness and `/ready` database readiness
- service-level PostgreSQL integration tests for Organizations/Colleges/Departments
- PostgreSQL integration coverage for People/memberships, profiles, tenant domains, identity/system roles
- exact LMS color tokens and parity regression tests
- authenticated LMS shell with responsive sidebar/top bar
- membership switching + sign-out
- core UI primitives and loading/error/table conventions
- guarded Super Admin and College Admin core pages
- create Organization / College / Department UI flows
- HttpOnly Super Admin safety-scope persistence and selector
- server-validated organization/college scope choices
- scope-aware Super Admin Organizations/Colleges reads
- college-scoped Super Admin Departments/People views
- shared Dialog / ConfirmDialog / Toast interaction layer
- Organization rename/archive UI with server-side dependency guard
- College edit UI with stable organization/code ownership
- Department rename UI
- People onboarding UI for College Admin and scoped Super Admin
- membership role controls for LEARNER / FACULTY / COLLEGE_ADMIN / MENTOR / TPO
- membership suspend/reactivate/end UI with reason + terminal-state handling
- role-aware Super Admin dashboard with safety-scope counts
- role-aware College Admin dashboard with college/department/people counts

## 3. Identity model

One physical human maps to one `users` row and can have multiple `college_memberships`.

Membership roles:

- `LEARNER`
- `FACULTY`
- `COLLEGE_ADMIN`
- `MENTOR`
- `TPO`

System roles:

- `SUPER_ADMIN`

Do not reintroduce legacy same-phone pseudo-accounts, magic user ID 0, or JWT reminting for college switching.

## 4. Authorization rules

Central policy already covers:

- organization read/manage
- college read/manage
- department read/manage
- people.manage
- membership role/lifecycle management
- system-role.manage

Suspended memberships fail request-context resolution. SUPER_ADMIN selected scope is a safety rail, not an identity change.

The selected Super Admin scope is persisted in an HttpOnly `lms_admin_scope` cookie. The server validates active organization/college selections before setting it. Scope switching remains available to a scoped SUPER_ADMIN so they cannot trap themselves inside a tenant. Fresh login/logout clears both membership and admin-scope selection.

A subsequent SUPER_ADMIN assignment UI/API remains deliberately deferred until privileged MFA is actually live and activity/audit events exist. Do not expose system-role elevation merely to close a UI checkbox.

## 5. Database state

`drizzle/0000_hard_the_spike.sql` is the canonical first migration.

CI provisions PostgreSQL 17 and runs:

1. `npm ci`
2. lint
3. typecheck
4. unit tests
5. Drizzle generation + drift check
6. reset/migrate/seed test database
7. DB integration tests
8. Next build

`/ready` must only report ready when PostgreSQL is reachable and the core schema is migrated.

## 6. GCP development environment

Repo-side preparation is done, but account-bound resources are not provisioned from this chat.

Committed strategy:

- Cloud Run -> Cloud SQL via managed Cloud SQL attachment + Unix socket
- manual GitHub `Deploy development` workflow uses Workload Identity Federation (no JSON key)
- dedicated migrator image + Cloud Run migration job runs before web deployment
- local development -> `DATABASE_URL` / Cloud SQL Auth Proxy
- dedicated DB user `lms_vnext_app`
- DB password in Secret Manager
- dedicated Cloud Run runtime service account
- Cloud SQL Client + only required secret/storage IAM
- Application Default Credentials for Firebase Admin
- no service-account JSON in the image
- phone OTP selected as initial Identity Platform provider, pending actual project configuration

Runbook: `docs/gcp-development.md`.

Account values still required:

- GCP project ID
- primary region
- Cloud SQL instance/connection name
- Artifact Registry repository
- runtime/deployer service accounts
- DB secret name
- Firebase web config

Do not invent these values in code.

## 7. Exact LMS visual identity — hard constraint

The user explicitly requires vNext to match the existing LMS color system and does not want a later palette-fix phase.

Source inspected:

- `42Students/lms2-fe@prod-2026`
- source commit `8881715c9092b9041f5a861f93ab1f686b536e91`
- canonical file `src/styles/components/_variables.scss`

Mapping:

- `docs/design-system/lms-color-parity.md`
- implemented in `src/app/globals.css`
- regression locked by `tests/unit/design-tokens.test.ts`

Core canonical values include:

- primary `#26bac7`
- hover `#1e9aa8`
- teal text `#1a95a1`
- page background `#f1f4f9`
- heading `#1a1d21`
- body `#54505d`
- muted `#6b7280`
- border `#e5e9f0`
- success `#059669`
- warning `#d97706`
- error `#ef4444`

Do not replace them with Tailwind zinc/slate/blue or shadcn defaults.

CSP remains deliberately deferred until the live Identity Platform/Firebase/reCAPTCHA origins are known; do not guess an allowlist.

## 8. Deliberately deferred items

- college archive until downstream dependency semantics exist
- department archive API until real Programs/Faculty/Courses dependency counts exist
- membership activity events until Activity/Event phase
- learner/faculty legacy mappings until migration tooling
- cross-domain auth handoff until login/UI proves it is needed
- Cloud Storage bucket until first file workflow needs it

These are intentional deferrals, not forgotten work.

## 9. Exact next work

Operational source of truth remains `docs/planning/vnext-execution-checklist.md`.

Highest-priority continuation is now **account-surface parity**. Continue Learner → Faculty → Mentor → College Admin → Super Admin → TPO → HR/Recruiter from `docs/planning/account-surface-parity.md`. Update the matrix in the same commit that closes each surface.

Account-bound GCP1 provisioning remains required in parallel when project access is available:

1. confirm project ID
2. confirm primary region
3. enable/provision Cloud SQL
4. create Artifact Registry
5. configure runtime service account/IAM/Secret Manager
6. deploy dev Cloud Run
7. enable Identity Platform + phone provider
8. smoke `/health` and `/ready`

If GCP account access is unavailable in the current chat, do not redesign the stack and do not guess resource values. Continue only with non-blocked core work.

Non-cloud work can continue while GCP1 is account-blocked. Current core continuation order:

1. inspect remaining core-platform checklist gaps and close only genuinely non-cloud-blocked items
2. install/configure shadcn only when package-lock can be updated atomically; do not replace canonical LMS colors
3. browser Firebase/Identity client config and login UI once real GCP Identity Platform configuration exists
4. core E2E acceptance flow after real browser login is available
5. Courses
6. Projects
7. Projects
8. Placements / TPO / HR

## 10. Commit strategy

- direct to `main`
- cohesive batches
- tests with implementation
- avoid tiny noisy pushes
- verify CI after each batch
- keep tenant authorization centralized

## 11. Files every continuation chat should read

1. `AGENTS.md`
2. `docs/handoff/2026-10-02-vnext-handoff.md`
3. `docs/planning/vnext-master-plan.md`
4. `docs/planning/vnext-execution-checklist.md`
5. `docs/core-platform-migration-map.md`
6. `docs/database-workflow.md`
7. `docs/gcp-development.md`
8. `docs/design-system/lms-color-parity.md`
9. `docs/operations/deployment-and-rollback.md`
10. `docs/operations/data-protection.md`
11. `docs/operations/observability.md`

Do not restart architecture discussion unless an implementation blocker proves a locked decision invalid.


### Academics A2 safety rules

- one active Program enrollment per learner college membership
- Section placement is history, never a mutable current-class/current-semester pointer
- same-period moves become MOVED
- forward-period promotions close older active placements as COMPLETED
- backward-period placement is rejected
- target Section capacity is checked under a row lock
- Section Faculty responsibility requires same-college active FACULTY membership
- generic schedule events must stay inside the Section Academic Period
- course teaching assignment remains deferred to Courses


### Academics UI workspace

A shared Academics overview is staged for College Admin and college-scoped Super Admin:
- create Programs, Academic Periods, Cohorts and Sections
- activate/close Academic Periods
- activate/complete/archive Cohorts
- archive Programs/Sections
- open a Section operations page
- admit learners into a Program
- place/move/promote learners with history
- complete/withdraw Program or Section enrollment
- assign/end Section Faculty Advisor/Coordinator responsibilities
- create/cancel generic Section schedule events

Program, planned Academic Period, planned Cohort and active Section edit dialogs are included. Academics A1 + A2 + admin UI are ready to close after final CI.


### Academics phase closure

Academics is complete for the current vNext scope:
- Program CRUD/lifecycle
- Academic Period CRUD/lifecycle
- Cohort/Batch CRUD/lifecycle
- period-specific Section CRUD
- learner Program enrollment lifecycle
- historical Section movement/promotion/withdrawal
- capacity-safe roster assignment
- Section Faculty Advisor/Coordinator responsibilities
- generic Section schedule/calendar events
- College Admin UI
- college-scoped Super Admin UI
- PostgreSQL integration/regression coverage
- readiness includes all Academics tables

Course catalogs, offerings, teaching assignments, learning content and learner course progress intentionally begin in the Courses phase.
