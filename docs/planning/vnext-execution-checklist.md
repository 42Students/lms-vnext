# LMS vNext — Execution Checklist

**Baseline:** 2026-10-02  
**Repository:** `42Students/lms-vnext`  
**Baseline HEAD before this documentation commit:** `be1527cf3ef7b90be1b6fe6830dbf91c3223cf8e`

Use this as the day-to-day tracker. Check items only after code is committed and CI is green.

Legend:
- [x] complete and committed
- [ ] not complete
- [~] intentionally partial / waiting on dependency

---

# A. Repository and foundation

- [x] Create `42Students/lms-vnext`
- [x] Use one repository
- [x] Next.js App Router
- [x] TypeScript strict mode
- [x] React
- [x] Tailwind CSS
- [x] Zod
- [x] Drizzle ORM
- [x] PostgreSQL client
- [x] pooled DB connection helper
- [x] environment validation
- [x] health endpoint
- [x] Dockerfile
- [x] Cloud Run standalone output
- [x] Vitest
- [x] Playwright scaffold
- [x] ESLint
- [x] GitHub Actions CI
- [x] schema-generation CI check
- [x] AGENTS.md
- [x] architecture docs
- [x] migration strategy docs
- [x] commit package-lock.json
- [x] switch CI from `npm install` to `npm ci`
- [x] switch Docker install from `npm install` to `npm ci`

---

# B. Core migration research

- [x] inspect legacy organization model
- [x] inspect legacy college model
- [x] inspect legacy department model
- [x] inspect legacy learner identity
- [x] inspect legacy faculty identity
- [x] inspect legacy HR identity
- [x] inspect legacy user/role model
- [x] inspect current JWT/session flow
- [x] inspect membership/account switching
- [x] inspect superadmin scope behavior
- [x] inspect FacultyType mixing
- [x] inspect department chair/vice-chair usage
- [x] document keep/redesign/retire decisions
- [x] commit `docs/core-platform-migration-map.md`

---

# C. Core database schema

- [x] organizations table
- [x] colleges table
- [x] users table
- [x] college_memberships table
- [x] membership_roles table
- [x] system_roles table
- [x] departments table
- [x] tenant_domains table
- [x] legacy_id_map table
- [x] UUID primary keys
- [x] organization active-name uniqueness
- [x] college code uniqueness
- [x] user Identity UID uniqueness
- [x] user phone uniqueness
- [x] user email case-insensitive uniqueness
- [x] one membership per user+college
- [x] one role assignment per membership+role
- [x] department active name uniqueness per college
- [x] domain host uniqueness
- [x] canonical generated migration committed
- [x] migration metadata committed
- [x] migration apply test against real PostgreSQL
- [x] DB integration tests
- [x] migration reset documentation

---

# D. Identity and authorization foundation

- [x] canonical role constants
- [x] canonical status constants
- [x] RequestContext type
- [x] explicit SUPER_ADMIN system role
- [x] active membership context
- [x] membership role checks
- [x] fail-closed authorization
- [x] cross-college denial
- [x] suspended-membership denial
- [x] optional superadmin safety scope
- [x] centralized `can()`
- [x] centralized `requirePermission()`
- [x] identity UID -> vNext user resolution
- [x] identity UID -> membership resolution
- [x] membership ownership verification
- [x] membership role loading
- [x] membership-choice listing
- [x] add `people.manage` permission
- [x] system-role administration policy
- [x] role mutation policy
- [x] membership lifecycle policy

**NEXT ITEM:** complete account-bound GCP1 provisioning (project/region -> Cloud SQL -> Artifact Registry -> Cloud Run -> Identity Platform) when GCP project access is available.

---

# E. Identity Platform server session

- [x] Firebase Admin dependency
- [x] Application Default Credentials
- [x] verify browser ID token
- [x] require recent authentication for session creation
- [x] create server session cookie
- [x] HttpOnly session cookie
- [x] HttpOnly membership cookie
- [x] same-origin mutation guard
- [x] logout clears cookies
- [x] fresh login clears old membership selection
- [x] GET memberships endpoint
- [x] POST membership switch endpoint
- [x] DELETE membership selection endpoint
- [x] no legacy JWT reminting for college switch
- [x] no refresh-token localStorage architecture
- [ ] configure actual GCP Identity Platform project
- [ ] configure initial login provider
- [ ] browser auth SDK/config
- [ ] login UI
- [x] membership chooser UI
- [x] session-expiry UX
- [x] revoked-session UX
- [x] privileged-user MFA decision

---

# F. Organizations

- [x] organization validation
- [x] create service
- [x] list service
- [x] rename service
- [x] archive service
- [x] active name conflict handling
- [x] block archive when active colleges exist
- [x] GET API
- [x] POST API
- [x] PATCH API
- [x] DELETE/archive API
- [x] superadmin manage policy
- [x] college-admin limited read behavior
- [x] unit validation tests
- [x] Organizations UI
- [ ] organization E2E flow
- [x] DB integration tests

---

# G. Colleges

- [x] college validation
- [x] create service
- [x] list service
- [x] update service
- [x] stable organization ownership on generic update
- [x] stable code on generic update
- [x] unique code handling
- [x] superadmin creation
- [x] scoped college-admin read
- [x] scoped college-admin update
- [x] GET API
- [x] POST API
- [x] PATCH API
- [x] unit validation tests
- [ ] college archive service
- [ ] college archive dependency policy
- [ ] college archive API
- [x] Colleges UI
- [ ] college E2E flow
- [x] DB integration tests

Do not implement archive until downstream dependency rules are understood.

---

# H. Departments

- [x] department schema
- [x] department validation
- [x] list service
- [x] create service
- [x] rename service
- [x] case-insensitive active-name uniqueness
- [x] tenant ownership resolved server-side
- [x] cross-college mutation denied
- [x] archive domain capability prepared
- [x] dependency guard abstraction
- [x] GET API
- [x] POST API
- [x] PATCH API
- [x] unit tests
- [~] archive API intentionally deferred
- [ ] real programs dependency count
- [ ] real faculty dependency count
- [ ] real courses dependency count
- [ ] archive API after dependencies exist
- [x] Departments UI
- [ ] department E2E flow
- [x] DB integration tests

---

# I. People and memberships — immediate next batch

## I.1 Permission
- [x] add `people.manage`
- [x] allow SUPER_ADMIN according to scope
- [x] allow COLLEGE_ADMIN only in own college
- [x] deny FACULTY
- [x] deny MENTOR unless separately admin
- [x] deny TPO unless separately admin
- [x] deny LEARNER
- [x] policy tests

## I.2 Onboarding validation
- [x] collegeId UUID
- [x] phone normalized E.164
- [x] email normalized/optional
- [x] display name required
- [x] role list required
- [x] role deduplication
- [x] reject system roles in membership role input

## I.3 Canonical identity creation
- [x] find Identity Platform user by phone/email where supported
- [x] create Identity Platform user if absent
- [x] classify phone/email collision
- [x] never silently merge ambiguous identity
- [x] create/find vNext user row
- [x] synchronize safe display/email/phone fields intentionally

## I.4 Membership creation
- [x] load target college server-side
- [x] authorize target college
- [x] create membership if absent
- [x] reuse same membership if operation repeats
- [x] prevent duplicate membership
- [x] assign requested roles idempotently
- [x] return user + membership + roles

## I.5 API
- [x] POST people/onboard
- [x] GET college people
- [x] GET person/membership detail
- [x] error mapping
- [x] same-origin guard for mutations

## I.6 Tests
- [x] same request twice remains idempotent
- [x] same person can join second college
- [x] admin cannot onboard to different college
- [x] faculty cannot onboard
- [x] duplicate role is harmless
- [x] ambiguous identity collision blocks safely

---

# J. Membership role management

- [x] list roles
- [x] add role
- [x] remove role
- [x] prevent SUPER_ADMIN through membership endpoint
- [x] role change authorization
- [x] role idempotency
- [x] role mutation tests
- [x] API routes
- [x] UI controls
- [ ] future activity event

---

# K. Membership lifecycle

- [x] suspend membership
- [x] suspension reason
- [x] suspension timestamp
- [x] reactivate
- [x] end membership
- [x] request resolver blocks suspended membership
- [x] another college membership remains active
- [x] session behavior on suspended active membership
- [x] API routes
- [x] tests
- [x] UI controls
- [ ] future activity event

---

# L. Learner profile

- [x] design minimal profile
- [x] schema
- [x] migration
- [x] service
- [x] validation
- [x] create/update
- [x] tests
- [x] API/server actions
- [x] UI
- [ ] legacy learner mapping
- [x] do not prematurely embed full academics model

---

# M. Faculty profile

- [x] design minimal profile
- [x] schema
- [x] primary department relation
- [x] employment type separate from auth role
- [x] academic title separate from auth role
- [x] service
- [x] validation
- [x] tests
- [x] UI
- [ ] legacy FacultyType classification/mapping

---

# N. Superadmin bootstrap

- [x] decide secure bootstrap mechanism
- [~] bootstrap first Identity Platform identity — implementation ready; actual dev bootstrap waits for Identity Platform project configuration
- [x] create vNext user
- [x] assign SUPER_ADMIN system role
- [x] ensure public API cannot self-bootstrap
- [x] document recovery process
- [x] test global access
- [x] test selected-scope safety rail
- [~] subsequent SUPER_ADMIN UI/API deferred until privileged MFA is live and activity/audit events exist

---

# O. Tenant domains

- [x] table exists
- [x] host normalization helper
- [x] create domain mapping
- [x] unique host handling
- [x] primary-domain semantics
- [x] verification workflow
- [x] delete/archive mapping
- [x] tenant host resolution
- [x] tests
- [x] UI
- [~] cross-domain auth handoff intentionally deferred until login/UI proves a need

---

# P. Real PostgreSQL workflow

- [x] add committed Drizzle migration
- [x] add migration command
- [x] add local Postgres setup
- [x] add reset command
- [x] add seed command
- [x] add test DB command
- [x] deterministic seed data
- [x] cross-college seed scenario
- [x] CI DB integration test job
- [x] migration smoke test

---

# Q. GCP development infrastructure

- [ ] select/confirm GCP project
- [ ] choose primary region
- [ ] enable Cloud SQL
- [ ] create dev Postgres
- [x] create database/user strategy
- [x] connect Cloud Run/locally safely in application configuration
- [ ] enable Identity Platform
- [~] initial auth provider selected as phone OTP; actual provider configuration waits for GCP project
- [~] create Cloud Storage bucket only when first storage workflow needs it
- [ ] create Artifact Registry
- [x] define dedicated Cloud Run service account strategy
- [x] define IAM least-privilege strategy
- [x] define Secret Manager strategy for DB password
- [ ] dev Cloud Run service
- [x] application env configuration contract
- [x] liveness + database readiness checks
- [x] manual WIF-based development deployment + migration workflow
- [x] deployment configuration structural validation before GCP authentication
- [ ] smoke deployment
- [ ] budgets/alerts if useful

---

# R. Core UI / shell

## Visual parity prerequisite — do before any UI component work
- [x] inspect exact LMS palette/tokens in `42Students/lms2-fe@prod-2026` (source commit `8881715c`)
- [x] inventory exact hex/RGB/RGBA/CSS-variable values for brand, navigation, surfaces, text, borders, actions and semantic states
- [x] document legacy -> vNext semantic color-token mapping
- [x] implement centralized vNext tokens using the exact canonical legacy colors
- [~] Tailwind baseline is mapped to LMS tokens; re-verify shadcn defaults when shadcn is installed
- [x] complete shell/common-component color parity review before closing first UI batch
- [x] treat palette mismatches as implementation defects, not deferred polish

- [ ] install/configure shadcn/ui
- [x] common Button
- [x] Input
- [x] Select
- [x] Dialog
- [x] DataTable
- [x] ConfirmDialog
- [x] Toast
- [x] EmptyState
- [x] PageHeader
- [x] StatusBadge
- [x] authenticated layout
- [x] sidebar
- [x] top bar
- [x] membership switcher
- [x] account menu
- [x] loading state conventions
- [x] error state conventions
- [x] permission-aware actions

---

# S. Core admin UI

## Superadmin
- [x] dashboard shell
- [x] Organizations page
- [x] Colleges page
- [x] Departments page
- [x] People page
- [x] scope UX

## College admin
- [x] dashboard shell
- [x] own college page
- [x] Departments page
- [x] People page
- [x] role management
- [x] suspension management

---

# T. Core E2E acceptance flow

- [x] pre-browser PostgreSQL acceptance rehearsal for tenant/admin/people/membership isolation
- [ ] superadmin login
- [ ] create organization
- [ ] create college
- [ ] create department
- [ ] onboard college admin
- [ ] college admin login
- [ ] college admin sees only own college
- [ ] college admin creates department
- [ ] college admin onboards faculty
- [ ] college admin onboards learner
- [ ] person with two memberships can switch
- [ ] cross-college URL/request tampering denied
- [ ] suspended membership denied
- [ ] logout works
- [ ] session restoration works

Core platform should not be declared complete until this passes.

---

# U. Legacy migration tooling — RETIRED

LMS vNext is greenfield. No legacy production data migration is required.

- [x] greenfield data decision locked
- [x] legacy repositories retained as behavior/reference oracles only
- [x] legacy DB extraction/reconciliation/import tooling removed from execution scope
- [x] all new organizations, colleges, people and domain data will be created natively in vNext

Do not restart migration work unless this product decision is explicitly changed.

---

# V. Academics — CLOSED

The core PostgreSQL acceptance rehearsal is green. Browser login/E2E remains blocked on live Identity Platform configuration, but that no longer blocks Academics backend/schema work.

- [x] legacy Academics behavior audit (reference only)
- [x] Programs design + schema/service/API
- [x] academic period design + schema/service/API
- [x] cohorts/batches — relational structure + lifecycle + progression boundary
- [x] classes/sections — period-specific structure + historical roster boundary
- [x] enrollments — Program lifecycle + Section placement/move/promotion history
- [x] faculty assignments — Section ADVISOR/COORDINATOR responsibilities
- [x] schedules — generic Section calendar events with period/faculty validation
- [x] greenfield decision: no academic data migration required
- [x] UI — College Admin + scoped Super Admin overview, CRUD/lifecycle surfaces and Section operations workspace
- [x] tests — policy + PostgreSQL A1/A2 tenant/lifecycle/constraint coverage

---

# W. Courses — ACTIVE

- [~] legacy Course audit — C1-C4C + learner UI + Faculty UI2A/UI2B1/UI2B2 + Admin UI3A/UI3B + YouTube media playback + browser E2E audited; signed storage VIDEO/upload remains
- [x] course domain — department-owned Course catalog with archive dependency guard
- [x] offerings — Cohort + Academic Period offerings with CORE/ELECTIVE, credits and order
- [x] Section deliveries — exact Offering -> Section scope
- [x] Faculty teaching assignments — PRIMARY / CO_TEACHER / TA on exact Section delivery
- [x] learning paths — one current path per Offering with publish/archive lifecycle
- [x] lessons/content — ordered Lessons + generic/exact-delivery RESOURCE/VIDEO/YOUTUBE/LIVE_CLASS content
- [x] progress — passive content + assignment submission + quiz attempt aggregation, missed-state handling and cross-item Continue Learning complete
- [x] permissions — structural + exact Faculty teaching + exact Learner enrollment/content/progress + assignment + quiz access complete
- [x] assignments — DRAFT/PUBLISHED/ARCHIVED definitions, generic/exact-delivery audience, one-shot TEXT/LINK submissions, version-safe grading and grade publication
- [ ] assignment file uploads — wait for Cloud Storage upload receipt/signing workflow
- [x] quizzes — DRAFT/PUBLISHED/CLOSED/ARCHIVED definitions, validated questions/options, atomic race-safe attempts, immutable answer snapshots, scoring and gated result visibility
- [x] greenfield decision: no legacy course data migration required
- [~] UI — learner UI1/UI1b + YouTube playback/resume complete; Faculty UI2A/UI2B1/UI2B2 complete; College Admin + scoped Super Admin UI3A/UI3B complete; signed storage VIDEO playback remains dependency-blocked
- [x] regression tests — C1-C4C PostgreSQL + learner interaction + Faculty exact-teaching/learner-identity review coverage + UI2B1/UI2B2 operation-state + admin shell/build + media helper + seeded learner/Faculty/Admin Course browser E2E

---

# X. Projects — CLOSED

- [x] current-state inventory — legacy backend/frontend/audit surfaces mapped; vNext contract in docs/architecture/projects.md
- [x] template model — immutable version snapshots, explicit published-version college assignment, lifecycle APIs and PostgreSQL regression coverage
- [x] project instance model — tenant-owned root pinned to exact template version
- [x] team model — canonical college-membership participation with history and exact-project access
- [x] mentor model — MENTOR role required, multiple mentors allowed, one active primary mentor enforced
- [x] workspace model — normalized admin + exact learner/mentor reads; no live template fallback; lifecycle state is sourced from instance tables
- [x] sprint/task model — normalized materialization plus mentor/admin lifecycle gates, one-active-sprint DB invariant, task state and release shipping rules
- [x] submission model — task attempts + review plus versioned final drafts/submissions and immutable final review history
- [x] evaluation model — approved-submission-only rubric evaluation with normalized scored criteria
- [x] resources — materialized template resources + mentor/admin runtime URL/text CRUD; storage-backed uploads remain Cloud Storage-dependent
- [x] meetings/readiness — derived readiness plus learner request / mentor-admin schedule-complete-cancel meeting lifecycle; no legacy Calendar-sync coupling
- [x] materialization redesign — one transaction, assigned immutable version -> normalized instance rows; no live template fallback
- [x] greenfield decision: no legacy project data migration required
- [x] adversarial tests — same-college outsider denial, cross-project ID substitution, learner privilege escalation, unsafe URL and stale-state coverage layered on P2-P7 regression suites
- [x] UI — all role navigation/list/workspace reads + execution/submission/review/evaluation + resource CRUD + learner meeting requests + mentor/admin meeting lifecycle controls + admin project creation/team setup + seeded learner/mentor/admin browser E2E complete; storage-backed resource uploads remain shared Cloud Storage-dependent

---

# Y. Placements / TPO / HR — ACTIVE

- [x] current-state inventory
- [x] companies/employers — canonical global employer identity + college-private relationship/trust/owner lifecycle
- [x] candidate preferences — learner self-scoped typed matching preferences + notification choices
- [x] jobs — tenant-scoped draft/publish/close/archive lifecycle with employer relationship boundary
- [x] eligibility — explainable academic evidence/rules/overrides with regression coverage verified by full CI
- [x] applications — tenant-safe learner apply/withdraw lifecycle with eligibility snapshot and immutable status history
- [x] screening — manager queue, learner-safe decisions, ordered round lifecycle and staged/applied round results
- [x] evaluation config — atomic idempotent round-plan replacement over the canonical round model; locks once execution starts
- [x] drive day — tenant-safe operational command center with candidate progression, round readiness and attention queues
- [x] TPO operations — cross-job prioritized work queue, upcoming rounds and operational metrics
- [~] HR operations — external recruiter identity boundary confirmed from architecture + legacy safety model; schema/session implementation pending generated migration
- [x] greenfield decision: no legacy placement data migration required
- [~] tests — placement domain coverage is CI-green through operational drive controls; learner feed/journey privacy coverage added, remaining HR/full placement browser acceptance pending
- [~] UI — learner journey/preferences/academic-evidence/opportunity workspace plus manager opportunity creation + draft editing, employer reuse/create, eligibility setup/editing, publish/close/archive lifecycle, command center, screening decisions, evaluation-plan editing, round scheduling/lifecycle and staged/applied result controls implemented; broader browser acceptance and HR surfaces pending

---

# Z. Activity / notifications / analytics

- [ ] activity event schema
- [ ] domain event recording helper
- [ ] meaningful event taxonomy
- [ ] activity center queries
- [ ] filters
- [ ] grouping/noise reduction
- [ ] notification model
- [ ] notification delivery
- [ ] analytics queries
- [ ] performance review before adding new infra

---

# AA. AI capabilities

- [ ] `src/ai` provider abstraction
- [ ] Vertex AI provider
- [ ] explicit domain tools
- [ ] authorization on every tool
- [ ] evaluation cases
- [ ] prompt/version tracking
- [ ] cost metrics
- [ ] latency metrics
- [ ] cross-tenant leakage tests

Do not build a generic chatbot first.

---

# AB. Production readiness

- [x] package lock + npm ci
- [ ] production Cloud SQL
- [x] backup policy
- [ ] restore test
- [ ] Cloud Run production service
- [ ] production Identity Platform config
- [ ] production storage bucket
- [ ] IAM review
- [x] security headers
- [x] structured logging
- [~] Error Reporting-compatible structured errors ready; GCP verification and alerting pending
- [~] Cloud SQL Query Insights selected; enablement and baseline wait for production Cloud SQL
- [x] migration deployment procedure
- [x] rollback procedure
- [x] runbook
- [~] public runtime/deployment smoke automated; authenticated production smoke waits for live Identity Platform
- [ ] load tests on hot workflows

---

# AC. Fresh vNext production launch

The legacy LMS is not active and no traffic/data cutover is required.

- [x] legacy data migration/cutover retired for greenfield launch
- [ ] intended vNext feature scope complete
- [ ] permissions validated
- [ ] critical regression tests green
- [ ] user acceptance complete
- [ ] production infrastructure ready
- [ ] launch plan
- [ ] application/database rollback plan validated
- [ ] launch
- [ ] monitor launch window
- [ ] close launch findings
- [ ] retire any unused legacy infrastructure only if it still exists

---

# AD. Rules for future ChatGPT sessions

Before coding:
- [ ] read `AGENTS.md`
- [ ] read handoff
- [ ] read master plan
- [ ] read this checklist
- [ ] inspect current HEAD
- [ ] inspect latest CI
- [ ] identify first unchecked relevant item

While coding:
- [ ] keep one logical batch cohesive
- [ ] do not create unnecessary architecture
- [ ] add tests with behavior
- [ ] keep tenant authorization centralized
- [ ] do not copy legacy code mechanically
- [ ] do not weaken old safety rules without evidence

Before finishing batch:
- [ ] lint green
- [ ] typecheck green
- [ ] unit tests green
- [ ] Drizzle generation green
- [ ] build green
- [ ] commit message clearly describes batch
- [ ] update this checklist if milestone status changed

---

# Immediate continuation command

The next chat should start here:

```text
NEXT: Batch GCP1 / Development infrastructure
1. confirm/select the GCP development project and primary region
2. provision/configure dev Cloud SQL PostgreSQL
3. enable/configure Identity Platform and the initial login provider
4. configure safe local/Cloud Run connectivity and least-privilege service account access
5. create the development storage bucket and Artifact Registry only as needed
6. configure environment variables/secrets without committing credentials
7. deploy/smoke-test the vNext health/database/auth path
8. keep infrastructure minimal and low-maintenance
```

If cloud provisioning cannot proceed because account/project access is unavailable, do not redesign the stack. Continue with code-side preparation or another non-blocked checklist dependency.

Before any UI work, complete the exact-LMS color parity prerequisite in section R.
