# LMS vNext — Detailed Handoff

**Date:** 2026-10-02  
**Repository:** `42Students/lms-vnext`  
**Branch:** `main`  
**Current HEAD:** `be1527cf3ef7b90be1b6fe6830dbf91c3223cf8e`  
**HEAD message:** `feat: add college domain and APIs`  
**CI status at handoff:** green

This document is the authoritative handoff for continuing LMS vNext in a fresh ChatGPT conversation.

---

## 1. Why this repository exists

The current production LMS is split across:

- `42Students/lms` — Spring Boot backend
- `42Students/lms2-fe` — React frontend

The current system has accumulated high maintenance cost from duplicated contracts, DTO/API shape mismatches, separate repositories, cross-module regressions, legacy data edge cases, Spring/JPA/controller/repository ceremony, token/scope complexity, and large modules such as Projects and Placements.

The vNext goal is not to translate the old codebase. The goal is to preserve valid business behavior while rebuilding the product around a much smaller mental model that one developer plus AI agents can maintain safely.

---

## 2. Primary engineering objective

Optimize for:

1. one developer
2. low cognitive load
3. very fast feature development
4. strong AI-agent compatibility
5. predictable testing
6. low operational maintenance
7. enough capacity for the expected college footprint without premature distributed architecture

The expected footprint discussed is roughly up to ~20 colleges and potentially ~200k registered learners, not 200k concurrent users.

---

## 3. Locked stack

### Application
- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui conventions when UI implementation starts
- Zod

### Persistence
- PostgreSQL
- Drizzle ORM
- Google Cloud SQL for PostgreSQL

### Authentication
- Google Cloud Identity Platform
- Firebase Admin SDK server-side session verification

### Files
- Google Cloud Storage

### Hosting
- Google Cloud Run

### AI later
- Vertex AI behind an application-level provider abstraction

### Add only when genuinely required
- Cloud Tasks
- Cloud Scheduler
- Cloud Run Jobs
- Memorystore / Redis

---

## 4. Explicit architecture decisions

These are deliberate and should not be casually reversed.

- One repository.
- One deployable application.
- Modular monolith.
- TypeScript across frontend, server logic, validation and tests.
- PostgreSQL is the system of record.
- No separate FE and BE repositories.
- No microservices unless production evidence forces them.
- No GKE/Kubernetes.
- No Kafka.
- No GraphQL.
- No Redis by default.
- No dynamic permission CMS initially.
- No line-by-line Java-to-TypeScript port.
- Business rules live in domain modules, not React components.
- Tenant ownership is resolved server-side from stored resources.
- Client role/portal guards are UX only; server authorization is authoritative.
- Prefer boring stable dependencies over newest versions.
- Do not recreate Spring-style DTO/repository/mapper/facade ceremony in TypeScript.

---

## 5. Current repository structure

The intended shape is:

```text
lms-vnext/
  src/
    app/                 # Next.js pages and API route adapters
    auth/                # Identity Platform / server-session integration
    db/
      schema/            # Drizzle schema
    modules/
      identity/
      permissions/
      organizations/
      colleges/
      departments/
      ...
    lib/
  tests/
    unit/
    e2e/
  docs/
  drizzle/
  Dockerfile
  AGENTS.md
```

Domain modules should remain small and cohesive.

---

## 6. Foundation completed

The initial foundation is already committed and verified.

### Included
- Next.js + TypeScript
- Tailwind
- strict TypeScript
- ESLint
- Vitest
- Playwright scaffold
- Drizzle configuration
- pooled PostgreSQL connection helper
- Zod environment validation
- `/health` endpoint
- Cloud Run-ready standalone Next build
- Dockerfile
- GitHub Actions CI
- architecture documentation
- AI-agent rules in `AGENTS.md`

### CI quality gates
Every meaningful commit currently runs:

```text
npm install
npm run lint
npm run typecheck
npm test
npm run db:generate
npm run build
```

All commits listed below are green.

---

## 7. Important commits completed

| Commit | Purpose |
| --- | --- |
| `be35ee8` | establish vNext foundation |
| `d8d32cd` | CI fix before lockfile exists |
| `d219034` | pin supported TypeScript |
| `b2afe92` | pin ESLint supported by Next tooling |
| `976f47c` | core platform migration map |
| `5291a0e` | core platform Drizzle schema |
| `9556454` | identity + authorization policy foundation |
| `836fe04` | Identity UID → tenant/membership context resolution |
| `2f9a7bb` | Departments domain service |
| `e8d2b9a` | Identity Platform server sessions |
| `585f9c1` | authenticated Department APIs |
| `fe16139` | Organization domain + APIs |
| `be1527c` | College domain + APIs |

Do not assume work exists beyond `be1527c` unless a newer commit is visible in GitHub.

---

## 8. Core database schema already implemented

The first platform schema exists in `src/db/schema`.

### Tables
- `organizations`
- `colleges`
- `users`
- `college_memberships`
- `membership_roles`
- `system_roles`
- `departments`
- `tenant_domains`
- `legacy_id_map`

### Important invariants

#### Organizations
- UUID primary key
- ACTIVE / ARCHIVED
- active names case-insensitively unique

#### Colleges
- UUID primary key
- belongs to organization
- stable `code`
- ACTIVE / ARCHIVED
- code case-insensitively unique
- normal address fields
- no chair/vice-chair columns

#### Users
One physical human should map to one row.

Fields include:
- Identity Platform UID
- E.164 phone
- email
- display name
- ACTIVE / DISABLED platform status

#### College memberships
A user can belong to multiple colleges.

Fields include:
- user
- college
- ACTIVE / SUSPENDED / ENDED
- suspension timestamp/reason

Unique:
- one membership per user + college

#### Membership roles
Current authorization roles:
- LEARNER
- FACULTY
- COLLEGE_ADMIN
- MENTOR
- TPO

A membership may carry multiple roles.

#### System roles
Currently:
- SUPER_ADMIN

Superadmin is no longer magic user ID `0`.

#### Departments
- belongs to college
- active name case-insensitively unique per college
- archive timestamp
- no chair/vice-chair columns

#### Legacy ID map
Used to make migrations deterministic and traceable.

---

## 9. Identity redesign already decided

The legacy LMS has multiple quasi-identities:

- learner
- faculty
- HR
- legacy user/role
- superadmin as ID 0

The old system discovers switchable accounts by matching mobile numbers across learner/faculty tables.

vNext model:

```text
Identity Platform identity
          |
          v
        users
          |
          +---- system_roles
          |
          v
 college_memberships
          |
          +---- membership_roles
          |
          +---- future learner_profile
          +---- future faculty_profile
```

A single human can therefore be:

```text
College A -> LEARNER
College B -> FACULTY + MENTOR
College C -> FACULTY + TPO
```

without creating several unrelated login identities.

---

## 10. Identity Platform design already implemented server-side

The intended browser flow is:

```text
Identity Platform browser login
          |
          v
short-lived ID token
          |
          v
POST /api/auth/session
          |
          v
server verifies token
          |
          v
HttpOnly lms_session cookie
```

Membership selection is separate:

```text
authenticated identity
       |
GET /api/auth/memberships
       |
choose membership
       |
POST /api/auth/memberships
       |
HttpOnly lms_membership cookie
```

Changing college membership does NOT mint a new user identity or new LMS JWT.

### Security already added
- session cookie is HttpOnly
- membership cookie is HttpOnly
- same-origin checks for cookie-changing requests
- fresh login required before creating a server session
- Firebase Admin uses Application Default Credentials
- Cloud Run should not require service-account JSON inside the image

---

## 11. Request context model

A request context currently carries:

```text
user
  id
  identityUid
  platformStatus
  systemRoles

membership (optional)
  id
  collegeId
  organizationId
  status
  roles

adminScope (optional)
```

The resolver loads the vNext user from Identity Platform UID and then resolves the requested membership only if it belongs to that user.

Cross-user membership IDs fail closed.

---

## 12. Authorization policy foundation

Central authorization exists in `src/modules/permissions/policy.ts`.

Current permission concepts include:
- organization.read
- organization.manage
- college.read
- college.manage
- department.read
- department.manage

Rules already represented:
- no context -> deny
- disabled user -> deny
- suspended membership -> deny
- ordinary users cannot cross colleges
- college admins manage only their college
- superadmin is a global system role
- optional superadmin selected scope acts as an additional safety rail

Do not scatter new authorization checks as raw role comparisons in route handlers.

Add permissions centrally and test them.

---

## 13. Departments completed so far

### Domain
- validation
- trimmed names
- max length
- case-insensitive uniqueness per college
- list active departments
- create
- rename
- archive domain capability prepared
- dependency guard abstraction

### Authorization
- ordinary active membership may read its college's departments
- COLLEGE_ADMIN required to mutate
- SUPER_ADMIN allowed according to global/scope policy
- cross-college access denied

### API
- `GET /api/departments?collegeId=...`
- `POST /api/departments`
- `PATCH /api/departments/[departmentId]`

### Deliberate omission
Department archive/delete is NOT exposed through API yet because Programs/Courses/Faculty dependency counts do not exist in vNext yet.

Do not weaken this. Expose archive only after dependency resolvers are real.

---

## 14. Organizations completed so far

### Domain
- list
- create
- rename
- archive

### Rules
- required trimmed name
- active names case-insensitively unique
- cannot archive while active colleges exist
- superadmin can manage organizations
- college admins can only see their current organization

### API
- `GET /api/organizations`
- `POST /api/organizations`
- `PATCH /api/organizations/[organizationId]`
- `DELETE /api/organizations/[organizationId]` archives, not hard-deletes

---

## 15. Colleges completed so far

### Domain
- list
- create
- update

### Rules
- organization ownership established at creation
- college code established at creation
- generic update cannot silently move a college to another organization
- generic update cannot silently change the college code
- college admin reads/updates own college only
- superadmin can list/create/manage according to scope

### API
- `GET /api/colleges`
- `POST /api/colleges`
- `PATCH /api/colleges/[collegeId]`

College archive is intentionally not yet exposed because downstream dependency semantics are not complete.

---

## 16. Core migration research already performed against legacy repos

The following legacy branches were inspected:

- `42Students/lms@prod-2026`
- `42Students/lms2-fe@prod-2026`

The detailed analysis is committed at:

`docs/core-platform-migration-map.md`

Important findings:
- the old generic `user` / `role` model is not the true center of current auth
- learner/faculty/HR identities are split
- same-phone matching drives account switching
- `FacultyType` mixes employment/title concepts with authorization roles
- faculty type is stored ordinally in the legacy system, which is fragile
- superadmin uses magic ID 0
- superadmin scope changes remint JWTs
- department chair/vice-chair are optional and do not drive the core permission model
- organization → college → department hierarchy is worth preserving
- account suspension should become membership-scoped

---

## 17. Department chair / vice-chair decision

Do NOT add these columns to the initial vNext Department table.

The old fields are optional and currently mainly display/edit metadata.

If a real leadership workflow is needed later, prefer:

```text
department_leadership
  department_id
  membership_id
  role = CHAIR | VICE_CHAIR
  starts_at
  ends_at
```

This supports history and avoids hard-coded person columns.

Same principle applies to college chair/vice-chair unless a real workflow proves otherwise.

---

## 18. Work that was started conceptually but is NOT committed

Immediately before this handoff, the next intended batch was People / Membership onboarding.

Some Git blob objects may have been created through the connector during experimentation, but they are NOT reachable from `main` and must be treated as nonexistent.

The clean repository state is current HEAD `be1527c`.

The next chat should implement onboarding cleanly from that HEAD rather than assume hidden/uncommitted work.

Planned additions included:
- `people.manage` permission
- onboarding validation
- canonical-user creation/find
- explicit college membership creation
- role assignment

---

## 19. Exact recommended next task

### NEXT BATCH: People + Membership Management

Goal:

Replace the legacy idea of creating separate learner/faculty identities with explicit user + membership + role management.

Suggested operations:

#### Admin onboarding
Input:
- collegeId
- phoneE164
- email optional
- displayName
- roles[]

Flow:
1. authenticate request
2. require `people.manage` for target college
3. normalize/validate phone
4. find or create Identity Platform user
5. find or create vNext `users` row
6. find or create college membership
7. attach requested membership roles
8. return canonical person + membership
9. ensure idempotency
10. reject ambiguous identity collisions

Do not automatically merge two humans solely because dirty legacy data shares a phone number during migration.

---

## 20. After People onboarding

Recommended immediate sequence:

1. People + membership onboarding
2. role add/remove
3. membership suspend/reactivate/end
4. learner profile table/service
5. faculty profile table/service
6. commit real Drizzle migration files
7. add local/dev PostgreSQL workflow
8. provision dev Cloud SQL
9. configure Identity Platform project/providers
10. build login UI
11. build membership chooser UI
12. build minimal authenticated shell
13. build Organizations UI
14. build Colleges UI
15. build Departments UI
16. run first end-to-end smoke flow against real dev infrastructure

---

## 21. UI has intentionally not started

There is currently no real LMS admin UI beyond the foundation page.

This is intentional.

The current philosophy is:

```text
domain model
   ->
authorization
   ->
server service
   ->
API/server actions
   ->
tests
   ->
UI
```

We wanted to prove the platform model before reproducing screens.

When UI starts, use a calm white/light design, Tailwind + shadcn/ui, and avoid flashy styling for its own sake.

---

## 22. GCP infrastructure has NOT been provisioned yet

Still pending:
- Cloud SQL PostgreSQL instance/database
- Identity Platform enabling/configuration
- Cloud Run service
- Cloud Storage bucket
- production service accounts/IAM
- Secret Manager values
- custom domains

The code is Cloud Run-ready, but no real vNext dev/prod environment has been created yet.

Do not point vNext at the legacy production database.

---

## 23. Database migration files are not yet committed

CI currently verifies that Drizzle can generate migrations.

However, the generated migration output itself has not yet been committed as the canonical first migration.

This should be fixed before a real database is provisioned.

Recommended:
- generate migration from the current clean schema
- inspect SQL manually
- commit it
- thereafter every schema change gets an explicit migration
- CI should detect schema/migration drift if practical

---

## 24. package-lock gap

At initial setup, a package lock was not committed because the model-side environment could not reliably access npm while GitHub Actions could.

CI currently uses `npm install`.

Before production deployment:
- generate and commit `package-lock.json`
- switch CI to `npm ci`
- switch Docker dependency installation to `npm ci`

Do not forget this.

---

## 25. Legacy migration philosophy

Never copy legacy tables or services by default.

For each capability:

1. inspect old backend
2. inspect old frontend
3. identify real behavior
4. identify permissions
5. identify validations
6. identify side effects
7. identify data dependencies
8. classify each behavior:
   - business rule
   - intentional legacy behavior
   - bug
9. design the vNext model
10. write tests
11. implement
12. migrate data separately
13. reconcile old/new
14. cut over

The legacy LMS is a specification and test oracle, not a code template.

---

## 26. Legacy data migration rules

Migration scripts must be:
- idempotent
- rerunnable
- observable
- deterministic
- able to report rejected/ambiguous rows

Always maintain `legacy_id_map`.

Never silently:
- drop malformed records
- merge ambiguous people
- change ownership
- invent missing tenant relationships

Produce reconciliation outputs:
- source count
- migrated count
- skipped count
- rejected count
- conflicts
- legacy→new mappings

---

## 27. Identity migration checks required later

Before migrating people from production:

- normalize phones to E.164
- find duplicate learner phones
- find duplicate faculty phones
- find learner/faculty same-phone pairs
- flag same-phone conflicting names
- flag missing phone
- flag duplicate email
- validate college references
- validate department/college consistency
- identify active legacy `user` table usage
- identify active legacy role-table dependencies

Ambiguous identities must go into a reconciliation report, not auto-merge.

---

## 28. Testing expectations

Every meaningful feature should include tests at the lowest useful level.

### Unit tests
- validation
- policies
- pure state transitions
- permission matrix
- dependency guards

### Integration/database tests
Add once a dev/test PostgreSQL workflow exists:
- uniqueness constraints
- tenant FK constraints
- membership resolution
- lifecycle transitions
- transaction behavior

### Playwright
Critical user flows later:
- login
- membership switch
- superadmin bootstrap
- create org
- create college
- create department
- college admin isolation
- suspend membership
- cross-college denial

AI-generated code must not bypass tests.

---

## 29. Commit / push strategy

User preference is to avoid noisy build-triggering pushes.

For vNext:
- work in cohesive logical batches
- prefer one commit per real batch
- use one tree/commit for several related files where possible
- run/observe CI after the batch
- make a fix commit only when CI reveals a real problem

Do not create unnecessary feature branches unless explicitly requested.

Current work has been directly on `main`.

---

## 30. What NOT to do next

Do not:
- start Projects
- start Placements
- port old Course code
- copy old controllers/services
- create microservices
- create Redis
- add Kafka/PubSub
- create GraphQL
- create dynamic permission tables
- reproduce refresh token blocklists
- reproduce token-version auth logic
- use magic superadmin ID
- add department chair/vice-chair columns
- connect vNext directly to legacy production DB
- begin visual polish before core authenticated workflows exist

---

## 31. Definition of core-platform completion

The core platform is considered ready for academic module migration when all are true:

- Identity Platform login works in dev
- one Identity identity maps to one vNext user
- user can own several memberships
- roles can be independently assigned
- superadmin is explicit
- membership switching works without identity reminting
- suspension works
- organizations work end-to-end
- colleges work end-to-end
- departments work end-to-end
- tenant isolation has automated tests
- real Drizzle migrations exist
- dev Cloud SQL exists
- basic app shell exists
- legacy IDs are traceable
- first real legacy data sample has been migrated and reconciled

Only then begin Academics.

---

## 32. Suggested first message for the next chat

Use this:

> We are continuing LMS vNext. Please inspect `42Students/lms-vnext` on `main`, especially `docs/handoff/2026-10-02-vnext-handoff.md`, `docs/planning/vnext-master-plan.md`, `docs/planning/vnext-execution-checklist.md`, `docs/core-platform-migration-map.md`, and `AGENTS.md`. Verify the current HEAD and CI first. Continue from the exact next unchecked core-platform item. Do not redesign the stack or restart architecture discussion. Work in cohesive commits and keep CI green.

That should be enough context for a fresh conversation to resume safely.
