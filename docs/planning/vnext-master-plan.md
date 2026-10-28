# LMS vNext — Master Execution Plan

> **OPERATING NOTICE — 2026-10-13:** This is a historical architecture and scope reference, **not the active execution schedule or status report**. The current execution method is [closure-first delivery](../tracker.json); the sole task/phase progress authority is [docs/tracker.json](../tracker.json). Old `DONE`/`MOSTLY DONE` section labels below are historical authored-scope descriptions, not independently accepted DATABASE task completion. DATABASE remains the current global phase; later phases stay locked until the tracker gates are certified. Do not work through this document sequentially as a second queue.

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

For **active execution**, follow the closure-first strategy and sole binary tracker, not the historical order or completion labels below. The sections remain useful as feature and architecture context.

---

# 2. High-level phases

```text
PHASE 0  Foundation                           DONE
PHASE 1  Core schema + tenant model           MOSTLY DONE
PHASE 2  Identity + memberships + people      MOSTLY DONE
PHASE 3  Real DB migrations + dev DB          MOSTLY DONE
PHASE 4  Identity Platform + login UI          PARTIAL / GCP-BLOCKED
PHASE 5  Core admin UI                         MOSTLY DONE
PHASE 6  Legacy migration tooling              RETIRED — GREENFIELD
PHASE 7  Academics core                        DONE
PHASE 8  Courses / learning                    ACTIVE
PHASE 9  Projects                              DONE
PHASE 10 Placements / TPO / HR                 ACTIVE
PHASE 11 Activity / notifications / analytics  DONE
PHASE 12 AI capabilities                       DROPPED (owner decision 12)
PHASE 13 Legacy account/page parity             ACTIVE — RELEASE GATE
PHASE 14 Production cutover / retirement       PENDING
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

## Local/CI status after Batch DB1
- canonical Drizzle migration + metadata committed
- empty PostgreSQL -> migration -> deterministic seed works automatically
- CI runs migration smoke tests and DB integration tests against PostgreSQL
- developer reset/migrate/seed workflow documented
- deterministic cross-college seed scenario exists
- package lock is canonical and CI/Docker use `npm ci`

Cloud SQL provisioning/connectivity remains part of Batch GCP1 and is the remaining dependency before this phase is fully complete.

Repo-side GCP1 readiness supports Cloud Run Cloud SQL Unix-socket connections, keeps local/proxy DATABASE_URL support, defines secret/IAM strategy, and exposes separate liveness/readiness endpoints.

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

### Hard visual-continuity rule — exact existing LMS colors

The existing LMS is the color source of truth. vNext must preserve the **exact rendered color system** from `42Students/lms2-fe` production UI (the `prod-2026` branch at planning time; re-check the active production branch immediately before UI implementation).

Palette extraction was completed against `42Students/lms2-fe@prod-2026` commit `8881715c9092b9041f5a861f93ab1f686b536e91`; the canonical mapping is committed at `docs/design-system/lms-color-parity.md` and implemented in `src/app/globals.css`.

Before building the vNext shell or common components:
1. inspect the legacy global CSS, Tailwind/theme configuration, component tokens and any module-level overrides that define the current LMS palette
2. inventory the exact hex/RGB/RGBA/CSS-variable values actually used for brand, navigation, text, borders, surfaces, actions, hover/focus/selected states and semantic statuses
3. record a legacy -> vNext semantic token mapping
4. implement those exact values as centralized vNext tokens
5. only then build reusable UI components

Non-negotiable rules:
- do **not** invent a replacement primary blue, accent color, sidebar color or neutral palette
- do **not** approximate legacy colors with "close" shadcn/Tailwind defaults
- shadcn/ui may provide component behavior/structure, but its default palette must not replace the LMS palette
- new semantic colors may be introduced only when the legacy LMS has no suitable state; document the reason and keep additions minimal
- module UI redesigns may improve layout, spacing, hierarchy and usability without changing the established LMS visual identity
- every UI batch must include a color-parity review before it is considered complete
- avoid deferring known palette mismatches as later polish; color parity is part of first-pass implementation

Use:
- Tailwind
- shadcn/ui
- the exact existing LMS color palette via centralized semantic tokens
- calm white/light interface where that matches the existing LMS
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

Every page must preserve the exact existing LMS color system. Visual acceptance includes comparing shell/navigation, primary and secondary actions, form controls, tables/cards, selected/hover states and status treatments against the current production LMS before closing the batch.

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

## Phase 6 retirement — greenfield data decision

LMS vNext will start with fresh data. The current/legacy LMS is not in active use and no production data needs to be carried forward.

Therefore:

- do not connect vNext migration tooling to the legacy database
- do not implement organization/college/department/learner/faculty extractors
- do not build collision/reconciliation/backfill runners for legacy data
- do not make `legacy_id_map` part of the active execution plan
- keep legacy repositories only as behavior, UX, regression and domain-knowledge references
- create all vNext records natively through vNext workflows, seeds and test fixtures

If a future import requirement appears, treat it as a new scoped project rather than silently reviving the retired Phase 6 plan.

# 10. Phase 7 — Academics core

## Goal
Build the relational foundation required by Courses, Projects and other modules.

Before implementation, inspect old repos deeply as behavior/regression references only. No legacy academic data migration is required.

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
Academics can represent real college structure and supports the Courses build.

---

# 11. Phase 8 — Courses / learning module

## Goal
Rebuild the course experience cleanly.

Perform a new legacy behavior audit first. No legacy course data migration is required.

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

## Current progress

Courses C1 establishes the safe structural graph:
- department-owned Course catalog
- Cohort + Academic Period Course Offerings
- exact Section Deliveries
- exact Faculty Teaching Assignments with PRIMARY / CO_TEACHER / TA roles
- PostgreSQL uniqueness/dependency guards
- tenant and structural permission regression coverage

Courses C2 adds the learning structure:
- one current Learning Path per Offering with DRAFT/PUBLISHED/ARCHIVED lifecycle
- ordered Lessons with DB-enforced active name/sequence uniqueness
- generic Offering content plus exact Section Delivery content
- canonical RESOURCE / VIDEO / YOUTUBE / LIVE_CLASS content
- exact Faculty teaching-scope and Learner section-enrollment access
- learner reads restricted to published content
- content-shape constraints and adversarial scope tests

Courses C3 adds learner progress and Course-facing query surfaces:
- learner Course discovery from active Program/Section enrollment
- exact-delivery workspace with generic + Section-specific published content
- one Membership + Content progress row
- monotonic media resume position
- VIDEO/YOUTUBE completion from authored duration rather than learner-supplied duration
- RESOURCE/manual completion and post-session LIVE_CLASS completion
- aggregate progress and deterministic Continue Learning next-content selection

Courses C4A adds assignment assessment behavior:
- Lesson-owned Assignment definitions with generic Offering or exact Section Delivery audience
- DRAFT/PUBLISHED/ARCHIVED lifecycle and deadline validation
- one-shot learner TEXT/HTTPS-LINK submissions
- exact learner Section Delivery authorization
- exact Faculty Teaching Assignment grading scope
- unpublished grade privacy
- expected-version grading/publishing to prevent lost updates
- regrading automatically hides a previously published grade
- PostgreSQL payload, uniqueness and lifecycle constraints
- file submissions intentionally wait for the Cloud Storage upload-receipt/signing workflow

Courses C4B adds quiz assessment behavior:
- Lesson-owned Quiz definitions with generic Offering or exact Section Delivery audience
- DRAFT/PUBLISHED/CLOSED/ARCHIVED lifecycle
- SINGLE_CHOICE and MULTIPLE_CHOICE validation
- server-side answer ownership validation and exact-set scoring
- atomic Quiz attempts with DB-protected attempt numbering
- immutable question/option/score snapshots per submitted attempt
- question key frozen after attempts begin
- no learner answer-key exposure while a Quiz is open
- explicit result publication only after CLOSE
- exact Faculty Teaching Assignment review scope
- adversarial concurrent-final-attempt and historical-snapshot regression tests

Courses C4C completes assessment aggregation into the learner workspace:
- Assignment submission counts as assessment completion
- at least one Quiz attempt counts as assessment completion
- expired/unavailable unattempted assessments are marked MISSED
- MISSED work remains visible in progress but is skipped by Continue Learning
- Lesson contents, Assignments and Quizzes are combined into deterministic ordered learning items
- nextContent remains for compatibility and nextItem becomes the cross-item Continue Learning pointer
- Course summary now covers content, assignment, Quiz, completed and missed item counts

Courses UI1 adds the learner-facing read/navigation experience:
- role-guarded /learn/courses routes
- learner shell navigation
- Course overview cards with period, Section and aggregate progress
- exact-delivery learning workspace
- Continue Learning driven by C4C nextItem
- unified Lesson rendering for Content, Assignments and Quizzes
- missed-state and grade-privacy presentation
- learner dashboard entry point

Courses UI1b adds learner interactions while keeping all authoritative rules server-side:
- RESOURCE manual completion for externally accessible resources
- final TEXT / HTTPS LINK Assignment submission
- published Assignment grade + feedback presentation
- Quiz start/retake flow while attempts remain
- learner-safe SINGLE_CHOICE / MULTIPLE_CHOICE rendering
- final Quiz submission with unanswered-question warning
- CLOSED + results-published Quiz review from immutable attempt snapshots
- canonical workspace refresh after mutation
- pure interaction-state regression tests preventing accidental reopen/re-submit states

Courses UI2A adds the Faculty teaching read/operations foundation:
- FACULTY-only /teach route group
- My Teaching Courses discovered from the authenticated Membership's active Teaching Assignments
- exact Section-delivery workspace with Course/period/role context
- current Learning Path and active Lesson inventory
- shared Offering vs exact Section audience labeling
- DRAFT/PUBLISHED/CLOSED visibility for content and assessments
- sibling Section URL tampering denied by exact Teaching Assignment scope
- Faculty shell/dashboard entry point, including dual LEARNER+FACULTY navigation
- PostgreSQL acceptance coverage for exact teaching scope

Courses UI2B1 adds Faculty exact-delivery authoring and lifecycle controls:
- Section-only RESOURCE / YouTube / live-class draft creation
- Section-only Assignment draft creation
- dynamic Section-only single/multiple-choice Quiz builder
- DRAFT-first workflow with existing server validation and exact Teaching Assignment re-check
- publish/archive controls for exact content and assignments
- publish/close/archive controls for exact Quizzes
- shared Offering items remain read-only to Faculty
- raw storage-key/video upload authoring remains hidden until signed Cloud Storage receipts exist
- shared-vs-exact mutation-state unit regressions

Courses UI2B2 completes Faculty assessment operations:
- learner-named Assignment submission queues for the exact Section Delivery
- inline TEXT / HTTPS LINK submission review
- expected-version Assignment grading, feedback, explicit publication and safe regrading
- learner-named Quiz attempt review using immutable answer snapshots
- exact-delivery CLOSED Quiz result publication/hiding
- shared-Offering Quiz result publication remains admin-owned while Faculty retain Section attempt review
- operation-state regressions covering grading publication and shared-vs-exact Quiz authority

Courses UI3A adds College Admin and college-scoped Super Admin structural operations:
- shared server workspace over Academics + Courses + People
- Course catalog create/edit/dependency-safe archive
- Cohort + Academic Period Offering create/edit/dependency-safe archive
- exact Section Delivery create/end with compatible-Section filtering
- active Faculty Membership selection and PRIMARY / CO_TEACHER / TA Teaching Assignment create/end
- explicit Super Admin college-scope requirement
- Courses navigation for both admin shells

Courses UI3B adds Admin shared-learning authoring:
- Offering-level College Admin and college-scoped Super Admin workspace
- Learning Path create/edit/publish/archive
- Lesson create/edit/reorder/archive
- Offering-wide RESOURCE / YouTube / live-class / Assignment / Quiz draft creation
- shared content and assessment lifecycle controls
- shared Quiz result publication/hiding after close
- one audience-aware authoring builder reused without weakening exact Faculty scope

Courses UI4 adds learner YouTube playback/resume:
- inline YouTube IFrame API playback
- resume from server-saved position
- five-second, pause/end and page-hide progress checkpoints
- existing monotonic server progress + 90% completion semantics
- external-link fallback when inline playback fails
- storage-backed VIDEO remains blocked on signed Cloud Storage delivery rather than exposing raw storage keys

Course browser regression now runs in CI across seeded learner, Faculty and College Admin journeys with exact-Section leakage assertions. Next Courses work is the signed Cloud Storage VIDEO/upload-receipt workflow when GCP storage is provisioned.

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
- malformed or invalid content inputs at vNext boundaries

---

# 12. Phase 9 — Projects

## Goal
Migrate the most complex current module only after platform and academic primitives are stable.

Projects is explicitly NOT an early build target.

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

## Implementation method
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

## Status
DONE in the deterministic application layer. GCP observability wiring remains a production-environment concern, not a missing activity-domain feature.

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

DROPPED — owner decision 12 (2026-10-15). No AI features, Vertex AI or AI grading are part of vNext; `src/ai` was removed.

---

# 16. Phase 13 — Legacy account/page parity

## Phase 13 parity release gate

Goal: recreate every meaningful user-facing surface from the current LMS for all seven accounts before broad navigation/UI redesign.

Parity sources of truth:
- surface/status matrix: `docs/planning/account-surface-parity.md`
- frozen mechanical route backstop: `docs/planning/legacy-ui-route-manifest.md`
- detailed page/workflow contracts: `docs/parity/README.md` + the account files under `docs/parity/`

Rules:
- legacy frontend is the behavior/product oracle, not a code template;
- every page/tab/section/card/action/form/filter/modal/drawer/state/permission-sensitive workflow must be accounted for;
- MISSING, VERIFY, PARTIAL and BLOCKED remain launch blockers until resolved/accepted through the documented classification process;
- a master-matrix DONE row is not deeply closed while its required detailed page contract still has open checks;
- update the master matrix and detailed page spec in the same commit that closes behavior;
- implement with vNext architecture and centralized authorization;
- after both parity layers reach 100% closure, navigation/UI consolidation becomes a separate product pass.

Execution order: Learner → Faculty → Mentor → College Admin → Super Admin → TPO → HR/Recruiter → shared blockers → final fresh legacy diff.

Definition of done:
- `npm run parity:status` has zero PARTIAL / MISSING / VERIFY / BLOCKED rows;
- `npm run parity:pages` has zero open detailed checks;
- every DONE/REDESIGNED master row has a closed detailed contract;
- intentional removals/redesigns have written rationale;
- final fresh route/navigation/section/action/modal diff against latest legacy `prod-2026` is complete;
- critical browser/role/tenant regression coverage has actually executed green.

---

# 16A. Phase 14 — Production launch

## Goal
Launch LMS vNext as the fresh authoritative LMS.

The legacy/current LMS is not active, so there is no strangler traffic cutover and no legacy production data reconciliation requirement.

## Launch sequence
1. intended vNext feature scope complete
2. permissions and tenant isolation validated
3. critical regression/load/smoke tests green
4. production GCP resources and backups ready
5. Identity Platform production configuration ready
6. user acceptance complete
7. launch plan and rollback procedure reviewed
8. deploy production
9. run authenticated production smoke
10. monitor launch window
11. close launch findings

## Legacy infrastructure
If unused legacy infrastructure still exists, retire it separately after confirming it has no operational dependency. Do not preserve old infrastructure merely because earlier plans assumed a data migration.

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

### Batch P4
Secure SUPER_ADMIN bootstrap + system-role administration policy

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
- existing LMS color system is the vNext visual source of truth; no replacement palette or approximate brand colors

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
