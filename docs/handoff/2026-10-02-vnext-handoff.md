# LMS vNext — Current Handoff

**Date:** 2026-10-02
**Repository:** `42Students/lms-vnext`
**Branch:** `main`
**Baseline used for this handoff refresh:** `6c3b98bf08a4e15e07f11312fd3d0915b5201146`
**Latest verified CI at that baseline:** run #42 — green

Always verify the live `main` HEAD and latest CI before changing anything.

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

Current next dependency is account-bound GCP1 provisioning:

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

1. finish role-aware Super Admin / College Admin dashboard surfaces
2. add Learner / Faculty profile editing UI
3. add tenant-domain management UI
4. install/configure shadcn only when package-lock can be updated atomically; do not replace canonical LMS colors
5. browser Firebase/Identity client config and login UI once GCP Identity Platform exists
6. core E2E acceptance flow
7. legacy migration tooling
8. Academics
9. Courses
10. Projects
11. Placements / TPO / HR

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

Do not restart architecture discussion unless an implementation blocker proves a locked decision invalid.
