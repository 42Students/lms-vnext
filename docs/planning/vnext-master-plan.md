# LMS vNext — Master Execution Plan

**Repository:** `42Students/lms-vnext`  
**Planning baseline date:** 2026-10-02  
**Audience:** future ChatGPT sessions + solo developer  
**Purpose:** detailed execution order for taking vNext from current core foundation to production cutover

---

# 1. Planning principles

This plan is intentionally biased toward:

- solo-developer maintainability
- low cognitive load
- low operational burden
- deterministic migrations
- clear tenant boundaries
- strong regression protection
- cohesive commits instead of scattered tiny pushes
- postponing complex infrastructure until real need appears

The plan should be followed in order unless a blocking dependency or production requirement justifies deviation.

---

# 2. High-level phases

```text
PHASE 0  Foundation                           DONE
PHASE 1  Core schema + tenant model           MOSTLY DONE
PHASE 2  Identity + memberships + people      NEXT
PHASE 3  Real DB migrations + dev DB          PENDING
PHASE 4  Identity Platform + login UI          PENDING
PHASE 5  Core admin UI                         PENDING
PHASE 6  Legacy migration tooling              PENDING
PHASE 7  Academics core                        PENDING
PHASE 8  Courses / learning                    PENDING
PHASE 9  Projects                              PENDING
PHASE 10 Placements / TPO / HR                 PENDING
PHASE 11 Activity / notifications / analytics  PENDING
PHASE 12 AI capabilities                       PENDING
PHASE 13 Production cutover / retirement       PENDING
```

---

# 3. Phase 0 — Foundation

## Goal
Create one clean, deployable TypeScript modular monolith.

## Status
DONE.

## Already completed
- Next.js
- TypeScript
- Tailwind
- Drizzle
- Zod
- Vitest
- Playwright scaffold
- ESLint
- Cloud Run Dockerfile
- GitHub Actions
- health endpoint
- env validation
- pooled Postgres client
- architecture documentation
- AGENTS.md

## Definition of done
Already satisfied.

---

# 4. Phase 1 — Core tenant schema

## Goal
Create the minimum platform data model everything else can safely depend on.

## Status
MOSTLY DONE.

## Completed tables
- organizations
- colleges
- users
- college_memberships
- membership_roles
- system_roles
- departments
- tenant_domains
- legacy_id_map

## Completed policy/model decisions
- one human -> one user
- one user -> many memberships
- one membership -> many roles
- superadmin -> explicit system role
- tenant ownership -> college
- organization -> parent grouping
- department -> college-owned
- no chair/vice-chair columns initially

## Remaining before phase close
- first canonical committed Drizzle migration
- DB integration tests
- lifecycle service for tenant domains
- college archive semantics once downstream dependencies exist
- optional organization/college validation hardening based on real DB behavior

## Definition of done
- schema committed
- first migration committed
- migration applies cleanly to empty PostgreSQL
- migration rollback/reset procedure documented
- DB integration tests prove critical uniqueness/FK constraints

---

# 5. Phase 2 — Identity, people, memberships and roles

## Goal
Create the clean replacement for legacy learner/faculty/HR account fragmentation.

## Priority
HIGHEST. This is the immediate next phase.

## 5.1 People onboarding

### Required input
- target collegeId
- normalized phone E.164
- optional email
- display name
- requested roles

### Server flow
1. authenticate request
2. resolve target college
3. require `people.manage`
4. validate phone/email/name/roles
5. look up Identity Platform user by phone/email if possible
6. avoid silently merging ambiguous identity records
7. create Identity Platform identity when needed
8. create/find vNext user row
9. create/find membership
10. assign roles
11. return canonical user + membership + roles
12. make operation idempotent

### Important constraints
- do not create separate user rows for learner vs faculty
- do not let college admin onboard into another college
- do not allow duplicate memberships
- do not assign SUPER_ADMIN through membership role APIs
- do not silently overwrite identity email/phone conflicts

## 5.2 Role management

### Required capabilities
- list membership roles
- add role
- remove role
- prevent invalid combinations only when business rules justify it
- preserve at least one appropriate role when needed
- audit role changes later through activity system

### Initial role model
- LEARNER
- FACULTY
- COLLEGE_ADMIN
- MENTOR
- TPO

### Expected combinations
- FACULTY
- FACULTY + MENTOR
- FACULTY + TPO
- FACULTY + COLLEGE_ADMIN
- LEARNER

Do not force MENTOR/TPO to be separate user identities.

## 5.3 Membership lifecycle

Implement:
- ACTIVE
- SUSPENDED
- ENDED

Capabilities:
- suspend membership
- reactivate membership
- end membership
- set suspension reason
- deny all tenant access while suspended
- do not disable same human's memberships in other colleges

## 5.4 System role management

Implement:
- bootstrap SUPER_ADMIN
- explicit server-only/admin-only assignment
- no magic user IDs
- no public endpoint that can self-assign system role

## 5.5 Learner profile

Initial table should only contain learner-specific data that belongs outside membership.

Avoid prematurely pulling all academics fields in.

Suggested initial fields:
- membership_id PK/FK
- roll_number optional
- registration_number optional
- profile metadata only if clearly needed

Academic class/program/batch relationships should wait for Academics phase.

## 5.6 Faculty profile

Suggested initial fields:
- membership_id PK/FK
- primary_department_id optional
- employment_type optional
- academic_title optional

Separate:
- authorization role
- employment relationship
- academic title

Never recreate `FacultyType.ADMIN` / `MENTOR` / `TPO` coupling.

## Phase 2 tests

### Unit
- onboarding validation
- role mutation policy
- suspension policy
- identity collision classification

### DB/integration
- idempotent onboarding
- same user + same college does not duplicate membership
- same user may join another college
- role uniqueness
- suspended membership resolver fails access
- superadmin system role independent from membership

### Security
- college admin cannot onboard into another college
- ordinary faculty cannot manage people
- learner cannot mutate roles
- suspended user cannot use selected membership

## Definition of done
- an admin can onboard a person
- one person can hold memberships in multiple colleges
- roles can be managed
- suspension works
- learner/faculty profiles exist
- tests prove tenant isolation

---

# 6. Phase 3 — Database migration discipline + dev PostgreSQL

## Goal
Move from schema-only development to a real migration-managed database lifecycle.

## 6.1 Commit first Drizzle migration

Tasks:
- generate current schema migration
- inspect generated SQL
- verify indexes
- verify partial unique indexes
- verify FK delete semantics
- commit SQL + Drizzle metadata
- document migration naming convention

## 6.2 Local/dev PostgreSQL workflow

Preferred simple path:
- Docker Compose or local Postgres for developer
- separate test database
- commands:
  - db migrate
  - db reset
  - db seed
  - test DB prepare

Avoid complex local orchestration.

## 6.3 Cloud SQL dev instance

Provision:
- PostgreSQL
- region near Cloud Run deployment
- private/public connectivity chosen for simplest safe architecture
- backups
- deletion protection according to environment
- low-cost dev sizing initially

## 6.4 Connection management

Validate:
- Cloud Run max instances
- app pool max
- total possible DB connections
- idle timeout
- startup behavior

Do not solve hypothetical scale with PgBouncer/Redis prematurely.

## 6.5 Seed data

Create deterministic dev seed for:
- one organization
- two colleges
- superadmin
- college admin
- faculty
- learner
- departments

The seed should help test cross-college isolation.

## Definition of done
- empty DB -> migration -> seed works automatically
- CI can run DB integration tests
- developer can reset dev DB safely
- Cloud SQL dev DB reachable by app
- migration history is canonical

---

# 7. Phase 4 — Identity Platform and login experience

## Goal
Make the core platform usable by a real person.

## 7.1 Enable/configure Identity Platform

Decide supported initial login method:
- phone OTP likely primary based on current LMS behavior
- email/password only if genuinely needed
- Google sign-in only if useful

Do not enable every provider by default.

## 7.2 Browser auth client

Add client configuration carefully:
- public Firebase/Identity config only
- no service-account secret in browser
- no Admin SDK client-side

## 7.3 Login flow

Target:
1. login page
2. sign in with Identity Platform
3. obtain ID token
4. POST to server-session endpoint
5. clear client auth persistence if session-cookie model requires it
6. server owns app session
7. fetch memberships
8. choose membership or auto-select if exactly one
9. redirect to role-appropriate home

## 7.4 Membership chooser

Display:
- organization
- college
- role labels
- status

Switching should:
- verify membership belongs to current user
- set HttpOnly membership cookie
- not remint authentication identity
- redirect to correct portal/home

## 7.5 Session lifecycle

Implement:
- logout
- expired session handling
- disabled user handling
- suspended membership handling
- optional global revoke on password/security event

## Definition of done
- real login works in dev
- user receives server session
- membership chooser works
- refresh/navigation persists session
- no refresh tokens stored in localStorage
- cross-membership manipulation fails

---

# 8. Phase 5 — Core application shell and admin UI

## Goal
Turn the platform core into a usable vNext product skeleton.

## 8.1 Design system

Use:
- Tailwind
- shadcn/ui
- calm white/light interface
- accessible states
- consistent spacing
- no heavy custom CSS framework

Create:
- Button
- Input
- Select
- Dialog
- Table/DataTable
- EmptyState
- PageHeader
- Breadcrumbs
- Toast
- ConfirmDialog
- StatusBadge

## 8.2 Authenticated shell

Need:
- top bar
- sidebar
- college/membership switcher
- account menu
- role-aware navigation
- page container
- error boundary
- loading states

## 8.3 Superadmin core UI

Build:
- Organizations page
- Colleges page
- Departments page
- People page
- scope selector only if it improves workflow

## 8.4 College admin core UI

Build:
- college summary
- departments
- people
- membership roles
- suspend/reactivate

## 8.5 UI rules

Every page must include:
- loading state
- error state
- empty state
- success feedback
- permission-aware actions
- mobile baseline
- keyboard accessibility where practical

## Definition of done
A superadmin can:
- log in
- create organization
- create college
- create department
- onboard college admin

A college admin can:
- log in
- manage own departments
- manage own people
- fail to access another college

---

# 9. Phase 6 — Legacy migration tooling

## Goal
Build deterministic migration tooling before migrating business modules.

## 9.1 Read-only legacy extractors

Create adapters/scripts for legacy:
- organizations
- colleges
- departments
- learners
- faculty
- HR later

Do not directly mutate vNext during exploration.

## 9.2 Data profiler

Produce reports for:
- counts
- missing values
- duplicates
- malformed phones
- mismatched tenant ownership
- orphan references
- duplicate department names
- invalid faculty departments
- suspended/soft-deleted rows

## 9.3 Identity reconciliation

Output categories:
- safe single-person match
- learner+faculty same human
- duplicate same-type rows
- ambiguous same-phone conflict
- missing phone
- conflicting email
- needs manual review

## 9.4 Idempotent migration commands

Example conceptual commands:
- migrate organizations
- migrate colleges
- migrate departments
- migrate people
- reconcile

Each run should:
- use `legacy_id_map`
- log decisions
- be rerunnable
- never duplicate target records

## 9.5 Reconciliation report

After each entity:
- source count
- migrated
- skipped
- rejected
- conflicts
- target count
- referential mismatches

## Definition of done
A copy/sample of legacy core data migrates repeatedly to clean vNext DB with identical final state.

---

# 10. Phase 7 — Academics core

## Goal
Migrate the relational foundation required by Courses, Projects and other modules.

Before implementation, inspect old repos deeply.

Likely capabilities:
- academic years/terms
- programs
- batches/cohorts
- classes/sections
- faculty assignments
- learner enrollments
- schedules/calendar primitives

## Rules
- do not port old tables automatically
- model tenant ownership explicitly
- choose stable identifiers
- avoid JSON blobs for strongly relational concepts
- define lifecycle/status transitions

## Suggested order
1. Programs
2. Academic periods
3. Cohorts/batches
4. Classes/sections
5. learner enrollments
6. faculty assignments
7. schedule/calendar

## Definition of done
Academics can represent real college structure and supports Course migration.

---

# 11. Phase 8 — Courses / learning module

## Goal
Rebuild the course experience cleanly.

Perform a new legacy audit first.

Likely scope:
- courses
- course offerings
- faculty ownership
- learner enrollment visibility
- learning paths
- lessons
- lesson content
- assignments/assessments if they belong here
- progress

## Critical caution
Do not recreate old API response-shape duplication.

Use typed domain outputs directly in the single TypeScript repo.

## Testing
- course visibility
- tenant isolation
- enrollment access
- faculty ownership
- progress transitions
- content ordering
- deleted/archived references
- malformed legacy content during migration

---

# 12. Phase 9 — Projects

## Goal
Migrate the most complex current module only after platform and academic primitives are stable.

Projects is explicitly NOT an early migration target.

## Required pre-work
- inspect legacy Projects backend and frontend
- reuse all existing audit findings
- document:
  - templates
  - materialization
  - workspaces
  - teams
  - mentors
  - sprints
  - tasks
  - submissions
  - evaluations
  - resources
  - state transitions

## Key requirement
Eliminate hidden materialization/template coupling that caused legacy regressions.

## Migration method
Break into bounded subdomains:
1. templates
2. project instances
3. teams/members
4. workspaces
5. sprints/tasks
6. submissions
7. mentor reviews
8. evaluation

Each subdomain gets tests before next.

---

# 13. Phase 10 — Placements / TPO / HR

## Goal
Build a differentiated operational placement product, not just copy existing screens.

## Required pre-work
Reuse current placement audit context:
- jobs
- applications
- screening
- candidate preferences
- evaluation config
- HYBRID / EXTERNAL_ONLY
- TPO workflows
- HR workflows
- drive day

## Design principle
Treat placement workflows as explicit state machines and operational queues.

Do not scatter workflow logic across pages.

## Suggested subdomains
1. candidate profile/preferences
2. employer/company
3. job
4. eligibility
5. application
6. screening
7. drive
8. offers/outcomes
9. TPO operations
10. HR operations

AI features come later after deterministic workflows exist.

---

# 14. Phase 11 — Activity, notifications and analytics

## Goal
Make operational visibility a platform primitive.

## 14.1 Activity events

Create a first-class event model for meaningful domain changes.

Example:
- user onboarded
- role changed
- department created
- course published
- learner enrolled
- project submitted
- application status changed

Do not log every low-value technical action into the user-facing activity center.

## 14.2 Activity center

Need:
- filters
- actor
- subject
- module
- college
- date range
- importance
- pagination
- aggregation/grouping to prevent noise

## 14.3 Notifications

Start with deterministic application notifications.

Only add queue infrastructure if needed.

## 14.4 Analytics

Prefer PostgreSQL queries/materialized views first.

Do not add a separate analytics database early.

---

# 15. Phase 12 — AI capabilities

## Goal
Use AI as domain tooling, not a generic chatbot.

## Architecture

```text
src/ai/
  provider
  tools
  prompts
  evaluation
```

Vertex AI should be replaceable through an app-level abstraction.

## Domain tool pattern

Examples:
- getAtRiskStudents
- getBlockedProjects
- getPendingEvaluations
- getPlacementPipeline
- getStudentsMissingEligibilityData

AI should call explicit domain services/tools, not unrestricted SQL.

## Requirements before shipping AI
- deterministic underlying data model
- authorization applied to tool calls
- prompt/version tracking
- evaluation test set
- latency/cost observability
- no cross-college leakage

---

# 16. Phase 13 — Production cutover and legacy retirement

## Goal
Move colleges safely without big-bang risk.

## Strategy
Use strangler migration where needed.

For not-yet-migrated domains:
- old system remains authoritative

For migrated domains:
- vNext becomes authoritative

## Per-domain cutover
1. feature complete
2. data migrated
3. reconciliation clean
4. permissions tested
5. load/smoke tested
6. users validate workflow
7. switch traffic
8. monitor
9. freeze legacy writes for that domain
10. retire legacy code later

## Final retirement
Only when:
- all active domains moved
- all required historical data migrated
- audit/compliance retention handled
- rollback window expired
- old infra no longer required

---

# 17. Cross-cutting testing plan

## Required on every commit
- lint
- typecheck
- unit tests
- schema generation
- build

## Required once DB test environment exists
- migration apply
- DB integration tests
- tenant isolation suite

## Critical E2E suite
Eventually:
- superadmin login
- create org
- create college
- onboard admin
- admin login
- create department
- onboard faculty
- onboard learner
- switch memberships
- suspend membership
- cross-college access denial
- session expiry recovery

## Regression philosophy
Whenever a production/legacy bug is discovered:
- reproduce it in a test
- then fix it
- carry the test forward

---

# 18. Security plan

Minimum rules:
- no secrets committed
- Application Default Credentials on Cloud Run
- HttpOnly app session
- same-origin protection for cookie mutations
- validate every input with Zod at boundary
- server-side authorization for every mutation
- server-resolved resource ownership
- fail closed on missing ownership
- membership status checked on requests
- superadmin explicit system role
- audit privileged role changes
- no client-trusted college IDs for ownership decisions

Later:
- rate limits for auth-sensitive actions if needed
- MFA for privileged users if required
- admin action re-auth for critical operations if useful
- security headers/CSP
- dependency scanning

---

# 19. Performance plan

Do not prematurely optimize.

Start with:
- correct indexes
- bounded pagination
- avoid N+1
- pooled Postgres connections
- Cloud Run max instances
- query instrumentation
- no giant JSON payloads
- server-side filtering

Only add:
- Redis
- queues
- background jobs
- materialized views
after observed need.

---

# 20. Observability plan

Before production:
- structured application logs
- request correlation ID
- error tracking
- Cloud Run metrics
- Cloud SQL metrics
- slow query logging/visibility
- auth failure metrics
- migration reconciliation logs

Useful business metrics later:
- active colleges
- active memberships
- login success
- course engagement
- project completion
- placement funnel

---

# 21. GCP environment plan

Use separate environments where practical.

Suggested:
- dev
- production

Optional staging only if needed.

Resources:
- Cloud Run service
- Cloud SQL database
- Cloud Storage bucket
- Identity Platform
- Secret Manager
- Artifact Registry
- service account/IAM

Avoid creating many tiny GCP resources/services without need.

---

# 22. Deployment plan

Initial preference:
- keep GitHub Actions if already comfortable
- build container
- Artifact Registry
- deploy Cloud Run

Later evaluate Cloud Build only if it actually reduces maintenance.

Deployment gates:
- CI green
- migration reviewed
- migration applied safely
- smoke test
- rollback path understood

---

# 23. Commit batching plan

Recommended logical batches from current HEAD:

### Batch P1
People onboarding + permission + validation + unit tests

### Batch P2
Membership role management + lifecycle

### Batch P3
Learner/faculty profiles

### Batch DB1
First migration + local DB workflow + integration tests

### Batch GCP1
Dev Cloud SQL + Identity Platform configuration

### Batch UI1
Login + session + membership chooser

### Batch UI2
App shell + organization/college/department admin UI

Avoid 20 tiny commits that each trigger a build.

---

# 24. Decision log — do not reopen casually

Current decisions:

- Next.js over separate React + backend
- Drizzle over JPA-like heavy ORM patterns
- PostgreSQL over Firestore
- Cloud Run over GKE
- Identity Platform over custom auth
- one Identity pool, not college-specific Identity tenants
- explicit membership model
- explicit system roles
- role code in TypeScript initially
- no department chair/vice columns initially
- no microservices
- no Redis initially
- no GraphQL
- no event sourcing
- no big-bang rewrite

A future change should have a concrete problem statement and evidence.

---

# 25. Next-chat execution rule

The next chat should NOT spend time re-evaluating the stack.

It should:
1. inspect current HEAD
2. read handoff/master plan/checklist
3. confirm CI
4. pick the first unchecked item
5. implement
6. test
7. commit cohesive batch
8. continue

Only stop to redesign architecture if a real implementation blocker proves the current plan invalid.
