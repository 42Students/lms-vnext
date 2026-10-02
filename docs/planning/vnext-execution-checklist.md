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
- [ ] commit package-lock.json
- [ ] switch CI from `npm install` to `npm ci`
- [ ] switch Docker install from `npm install` to `npm ci`

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
- [ ] canonical generated migration committed
- [ ] migration metadata committed
- [ ] migration apply test against real PostgreSQL
- [ ] DB integration tests
- [ ] migration reset documentation

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
- [ ] add `people.manage` permission
- [ ] system-role administration policy
- [ ] role mutation policy
- [ ] membership lifecycle policy

**NEXT ITEM:** add `people.manage` and implement People/Membership onboarding.

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
- [ ] membership chooser UI
- [ ] session-expiry UX
- [ ] revoked-session UX
- [ ] privileged-user MFA decision

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
- [ ] Organizations UI
- [ ] organization E2E flow
- [ ] DB integration tests

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
- [ ] Colleges UI
- [ ] college E2E flow
- [ ] DB integration tests

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
- [ ] Departments UI
- [ ] department E2E flow
- [ ] DB integration tests

---

# I. People and memberships — immediate next batch

## I.1 Permission
- [ ] add `people.manage`
- [ ] allow SUPER_ADMIN according to scope
- [ ] allow COLLEGE_ADMIN only in own college
- [ ] deny FACULTY
- [ ] deny MENTOR unless separately admin
- [ ] deny TPO unless separately admin
- [ ] deny LEARNER
- [ ] policy tests

## I.2 Onboarding validation
- [ ] collegeId UUID
- [ ] phone normalized E.164
- [ ] email normalized/optional
- [ ] display name required
- [ ] role list required
- [ ] role deduplication
- [ ] reject system roles in membership role input

## I.3 Canonical identity creation
- [ ] find Identity Platform user by phone/email where supported
- [ ] create Identity Platform user if absent
- [ ] classify phone/email collision
- [ ] never silently merge ambiguous identity
- [ ] create/find vNext user row
- [ ] synchronize safe display/email/phone fields intentionally

## I.4 Membership creation
- [ ] load target college server-side
- [ ] authorize target college
- [ ] create membership if absent
- [ ] reuse same membership if operation repeats
- [ ] prevent duplicate membership
- [ ] assign requested roles idempotently
- [ ] return user + membership + roles

## I.5 API
- [ ] POST people/onboard
- [ ] GET college people
- [ ] GET person/membership detail
- [ ] error mapping
- [ ] same-origin guard for mutations

## I.6 Tests
- [ ] same request twice remains idempotent
- [ ] same person can join second college
- [ ] admin cannot onboard to different college
- [ ] faculty cannot onboard
- [ ] duplicate role is harmless
- [ ] ambiguous identity collision blocks safely

---

# J. Membership role management

- [ ] list roles
- [ ] add role
- [ ] remove role
- [ ] prevent SUPER_ADMIN through membership endpoint
- [ ] role change authorization
- [ ] role idempotency
- [ ] role mutation tests
- [ ] API routes
- [ ] UI controls
- [ ] future activity event

---

# K. Membership lifecycle

- [ ] suspend membership
- [ ] suspension reason
- [ ] suspension timestamp
- [ ] reactivate
- [ ] end membership
- [ ] request resolver blocks suspended membership
- [ ] another college membership remains active
- [ ] session behavior on suspended active membership
- [ ] API routes
- [ ] tests
- [ ] UI controls
- [ ] future activity event

---

# L. Learner profile

- [ ] design minimal profile
- [ ] schema
- [ ] migration
- [ ] service
- [ ] validation
- [ ] create/update
- [ ] tests
- [ ] API/server actions
- [ ] UI
- [ ] legacy learner mapping
- [ ] do not prematurely embed full academics model

---

# M. Faculty profile

- [ ] design minimal profile
- [ ] schema
- [ ] primary department relation
- [ ] employment type separate from auth role
- [ ] academic title separate from auth role
- [ ] service
- [ ] validation
- [ ] tests
- [ ] UI
- [ ] legacy FacultyType classification/mapping

---

# N. Superadmin bootstrap

- [ ] decide secure bootstrap mechanism
- [ ] bootstrap first Identity Platform identity
- [ ] create vNext user
- [ ] assign SUPER_ADMIN system role
- [ ] ensure public API cannot self-bootstrap
- [ ] document recovery process
- [ ] test global access
- [ ] test selected-scope safety rail

---

# O. Tenant domains

- [x] table exists
- [ ] host normalization helper
- [ ] create domain mapping
- [ ] unique host handling
- [ ] primary-domain semantics
- [ ] verification workflow
- [ ] delete/archive mapping
- [ ] tenant host resolution
- [ ] tests
- [ ] UI
- [ ] decide cross-domain auth handoff later

---

# P. Real PostgreSQL workflow

- [ ] add committed Drizzle migration
- [ ] add migration command
- [ ] add local Postgres setup
- [ ] add reset command
- [ ] add seed command
- [ ] add test DB command
- [ ] deterministic seed data
- [ ] cross-college seed scenario
- [ ] CI DB integration test job
- [ ] migration smoke test

---

# Q. GCP development infrastructure

- [ ] select/confirm GCP project
- [ ] choose primary region
- [ ] enable Cloud SQL
- [ ] create dev Postgres
- [ ] create database/user strategy
- [ ] connect Cloud Run/locally safely
- [ ] enable Identity Platform
- [ ] configure auth provider
- [ ] create Cloud Storage bucket
- [ ] create Artifact Registry
- [ ] define Cloud Run service account
- [ ] IAM least privilege
- [ ] Secret Manager if needed
- [ ] dev Cloud Run service
- [ ] env configuration
- [ ] health check
- [ ] smoke deployment
- [ ] budgets/alerts if useful

---

# R. Core UI / shell

- [ ] install/configure shadcn/ui
- [ ] common Button
- [ ] Input
- [ ] Select
- [ ] Dialog
- [ ] DataTable
- [ ] ConfirmDialog
- [ ] Toast
- [ ] EmptyState
- [ ] PageHeader
- [ ] StatusBadge
- [ ] authenticated layout
- [ ] sidebar
- [ ] top bar
- [ ] membership switcher
- [ ] account menu
- [ ] loading state conventions
- [ ] error state conventions
- [ ] permission-aware actions

---

# S. Core admin UI

## Superadmin
- [ ] dashboard shell
- [ ] Organizations page
- [ ] Colleges page
- [ ] Departments page
- [ ] People page
- [ ] scope UX

## College admin
- [ ] dashboard shell
- [ ] own college page
- [ ] Departments page
- [ ] People page
- [ ] role management
- [ ] suspension management

---

# T. Core E2E acceptance flow

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

# U. Legacy migration tooling

- [ ] legacy DB connection/read-only config
- [ ] legacy organization extractor
- [ ] legacy college extractor
- [ ] legacy department extractor
- [ ] legacy learner extractor
- [ ] legacy faculty extractor
- [ ] data profiler
- [ ] E.164 normalizer
- [ ] identity collision classifier
- [ ] orphan reference report
- [ ] department duplicate report
- [ ] faculty/college mismatch report
- [ ] idempotent migration runner
- [ ] legacy_id_map writer
- [ ] reconciliation report
- [ ] rerun test
- [ ] sample production-like migration

---

# V. Academics — later

Do not start before core platform acceptance flow is working.

- [ ] legacy Academics audit
- [ ] Programs design
- [ ] academic period design
- [ ] cohorts/batches
- [ ] classes/sections
- [ ] enrollments
- [ ] faculty assignments
- [ ] schedules
- [ ] migration
- [ ] UI
- [ ] tests

---

# W. Courses — later

- [ ] legacy Course audit
- [ ] course domain
- [ ] offerings
- [ ] learning paths
- [ ] lessons/content
- [ ] progress
- [ ] permissions
- [ ] migration
- [ ] UI
- [ ] regression tests

---

# X. Projects — later

Do not start early.

- [ ] current-state inventory
- [ ] template model
- [ ] project instance model
- [ ] team model
- [ ] mentor model
- [ ] workspace model
- [ ] sprint/task model
- [ ] submission model
- [ ] evaluation model
- [ ] materialization redesign
- [ ] migration
- [ ] adversarial tests
- [ ] UI

---

# Y. Placements / TPO / HR — later

- [ ] current-state inventory
- [ ] companies/employers
- [ ] candidate preferences
- [ ] jobs
- [ ] eligibility
- [ ] applications
- [ ] screening
- [ ] evaluation config
- [ ] drive day
- [ ] TPO operations
- [ ] HR operations
- [ ] migration
- [ ] tests
- [ ] UI

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

- [ ] package lock + npm ci
- [ ] production Cloud SQL
- [ ] backup policy
- [ ] restore test
- [ ] Cloud Run production service
- [ ] production Identity Platform config
- [ ] production storage bucket
- [ ] IAM review
- [ ] security headers
- [ ] structured logging
- [ ] error tracking
- [ ] slow query monitoring
- [ ] migration deployment procedure
- [ ] rollback procedure
- [ ] runbook
- [ ] smoke tests
- [ ] load tests on hot workflows

---

# AC. Legacy cutover

For every migrated domain:

- [ ] feature parity / intentional redesign complete
- [ ] data migration complete
- [ ] reconciliation complete
- [ ] permissions validated
- [ ] critical regression tests green
- [ ] user acceptance complete
- [ ] cutover plan
- [ ] rollback plan
- [ ] cutover
- [ ] monitor
- [ ] freeze old writes
- [ ] retire old code after safety window

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
NEXT: Phase 2 / People + Membership Management
1. add people.manage permission + tests
2. onboarding validation
3. canonical Identity Platform/vNext user resolver for onboarding
4. idempotent membership creation
5. membership role assignment
6. authenticated onboarding API
7. CI green
```

Do not jump to Academics, Projects, Placements or UI before this core path is stable.
