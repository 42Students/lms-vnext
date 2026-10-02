# Core Platform Migration Map

Status: **historical behavior/reference baseline only — legacy data migration retired**
Source branches inspected:
- `42Students/lms@prod-2026` — `790a200b305f17cd640aec78490f33adf0e5f3df`
- `42Students/lms2-fe@prod-2026` — `89806d4d6fe31a40532dc1ecbc61f6fbd1a2ac02`

Scope of this document:
- authentication / identity
- organizations
- colleges
- users
- roles / permissions
- memberships / account switching
- departments
- tenant domains
- account suspension / lifecycle

This is intentionally not a line-by-line port plan. It records the behavior we need to preserve and the legacy implementation we should leave behind.

## Greenfield decision

LMS vNext is starting with fresh data. No legacy database data needs to be migrated.

Use this document only to understand behavior worth preserving and legacy design choices worth avoiding. Do not implement the migration identity map, data extractors, reconciliation pipeline, or production backfill tooling unless the user explicitly reopens migration as a separate requirement.


---

## 1. Current-state findings

### 1.1 Identity is split across multiple tables

The production code currently has several identity concepts:

- `user` + `role` + `USER_ROLES`
  - username/password-oriented Spring Security model
  - still used by legacy `UserServiceImpl` and `/users/register`
- `learner`
  - actual learner profile and LMS identity
  - contains college/org scope, contact details, token version and suspension state
- `faculty`
  - actual faculty profile and LMS identity
  - contains college/org scope, contact details, token version, department and `facultyType`
- `hr_user`
  - separate industry identity with company affiliation and college grants
- superadmin
  - represented by the special principal ID `0`, with `FACULTY + ADMIN` shape

The current login and authorization system therefore does not have one canonical "person" record.

### 1.2 Same mobile number acts as the cross-account identity link

`OrgMembershipService` finds learner and faculty accounts sharing the same mobile number and exposes them as switchable memberships.

Example legacy membership keys:

```text
acc:LEARNER:101:college:1
acc:FACULTY:202:college:2
acc:FACULTY:303:college:2:facultyType:MENTOR
```

This is useful product behavior and must be preserved, but the implementation should change.

**vNext interpretation:** the phone belongs to one canonical user identity; learner/faculty/college-role records are memberships of that user.

### 1.3 Roles and faculty titles are mixed together

Frontend canonical portal roles currently are:

- SUPER_ADMIN
- ADMIN
- TPO
- MENTOR
- FACULTY
- LEARNER
- HR

Backend `FacultyType` also contains:

- employment/academic types: PERMANENT, GUEST, VISITING, CONTRACT, PROFESSOR, ASSOCIATE_PROFESSOR, ASSISTANT_PROFESSOR, LECTURER, ADJUNCT
- organizational titles: HEAD, COORDINATOR, CLERK
- application authorization roles: ADMIN, MENTOR, TPO

Worse, the enum is stored by ordinal, so changing enum order can reinterpret existing rows.

**vNext:** access roles and faculty employment/title attributes must be separate concepts.

### 1.4 Tenant hierarchy is real and worth keeping

Current hierarchy:

```text
Organization
  └── College
       └── Department
            └── Program / Course / Faculty etc.
```

The access layer resolves downstream resources back to their owning college and checks the current principal against that college.

This is an important invariant and should remain.

### 1.5 Superadmin scope is currently embedded into JWTs

The existing superadmin:
- is detected by `principal.id == 0`
- can operate globally
- can select an organization/college scope
- receives newly minted tokens containing that scope
- frontend stores selected scope and checks it against JWT claims

This has created token rotation / scope synchronization complexity.

**vNext:** selected admin scope is application state, not user identity. We should not remint authentication credentials merely because the superadmin selected another college.

### 1.6 Department leadership is optional and not an authorization primitive

Current Department data has:
- `dept_chair_id`
- `dept_vice_chair_id`

Current backend:
- allows both to be absent
- validates that a supplied leader is an active faculty member from the same college

Current department UI:
- does not require leadership during creation
- shows/edits chair and vice-chair later
- uses them for display/export

Within the inspected core access/auth/department paths, chair/vice-chair do **not** drive permissions or scope.

**vNext decision:** do not put chair/vice-chair columns into the initial Department table. If department leadership becomes a real workflow later, model it explicitly as assignments rather than hard-coded columns.

### 1.7 Account suspension is account-scoped today

Learner and Faculty each have:
- `suspended_at`
- `suspension_reason`
- `token_version`

Suspending one account revokes sessions for that learner/faculty identity.

In vNext a single person may have multiple memberships, so suspension must usually be membership-scoped rather than globally disabling the human identity.

---

## 2. Keep / redesign / retire

| Legacy concept | vNext action | Reason |
| --- | --- | --- |
| Organization | KEEP | Useful parent grouping and current scope hierarchy |
| College | KEEP | Primary tenant boundary |
| Department | KEEP | Core academic structure |
| College `unique_id` | KEEP as `code` | Useful stable tenant code |
| Tenant domains | KEEP | Existing product capability; auth integration can be redesigned |
| Learner account | REDESIGN | Becomes user + college membership + learner profile |
| Faculty account | REDESIGN | Becomes user + college membership + faculty profile |
| HR account | REDESIGN | Canonical user + HR profile + explicit college access grants |
| Same-mobile membership discovery | KEEP BEHAVIOR | Replace implicit phone joins with explicit memberships |
| `FacultyType.ADMIN/MENTOR/TPO` | REDESIGN | These are authorization roles, not faculty employment types |
| Faculty employment/title values | KEEP, CLEAN UP | Store separately from authorization |
| `user` / `role` / `USER_ROLES` | RETIRE CANDIDATE | Legacy auth path; verify production data before final removal |
| Superadmin ID `0` | RETIRE | Replace with explicit global role |
| JWT org/college reminting | RETIRE | Scope is app context, not identity |
| refresh-token blocklist/token_version | RETIRE WITH AUTH CUTOVER | Identity Platform owns primary authentication/revocation |
| custom auth handoff table | DEFER DECISION | Only needed if cross-domain session UX still requires it |
| department chair/vice-chair columns | DO NOT MIGRATE INITIALLY | Optional display metadata, not core behavior |
| college chair/vice-chair columns | DO NOT MIGRATE INITIALLY | Same reason; no core authorization dependency found |
| `is_deleted` everywhere | REDESIGN | Prefer explicit `archived_at/deleted_at` where soft deletion is required |

---

## 3. vNext identity model

### 3.1 Canonical user

One physical person becomes exactly one `users` row.

```text
users
- id UUID PK
- identity_uid TEXT UNIQUE NOT NULL
- phone_e164 TEXT UNIQUE NULL
- email TEXT NULL
- display_name TEXT NULL
- platform_status ACTIVE | DISABLED
- created_at
- updated_at
```

`identity_uid` is the Google Identity Platform UID.

Identity Platform answers:

> Who is this person?

PostgreSQL answers:

> Which colleges do they belong to and what may they do?

### 3.2 College memberships

```text
college_memberships
- id UUID PK
- user_id FK users
- college_id FK colleges
- status ACTIVE | SUSPENDED | ENDED
- suspended_at NULL
- suspension_reason NULL
- created_at
- updated_at

UNIQUE(user_id, college_id)
```

A membership represents the user's relationship to a college, not their current portal.

### 3.3 Membership roles

```text
membership_roles
- membership_id FK college_memberships
- role
- created_at

role:
- LEARNER
- FACULTY
- COLLEGE_ADMIN
- MENTOR
- TPO

UNIQUE(membership_id, role)
```

This deliberately supports combinations such as:

```text
FACULTY + MENTOR
FACULTY + TPO
FACULTY + COLLEGE_ADMIN
```

without converting the person's faculty employment type into an authorization flag.

### 3.4 Global roles

```text
system_roles
- user_id FK users
- role

role:
- SUPER_ADMIN

UNIQUE(user_id, role)
```

No magic ID `0`.

### 3.5 Role-specific profiles

```text
learner_profiles
- membership_id PK/FK
- roll_number
- current class/program references (introduced with Academics)
- learner-specific profile fields

faculty_profiles
- membership_id PK/FK
- primary_department_id NULL
- employment_type NULL
- academic_title NULL
- faculty-specific profile fields

hr_profiles
- user_id PK/FK
- industry_company_id
- designation
- status
```

HR college access remains explicit:

```text
hr_college_access
- hr_user_id
- college_id
- status
```

HR is not silently treated as Faculty.

---

## 4. vNext tenant model

### 4.1 Organizations

```text
organizations
- id UUID PK
- name TEXT NOT NULL
- status ACTIVE | ARCHIVED
- created_at
- updated_at

UNIQUE(lower(name)) for active organizations
```

Preserve current rule:
- organization name required
- case-insensitive unique name
- cannot archive/delete while active colleges remain

### 4.2 Colleges

```text
colleges
- id UUID PK
- organization_id FK organizations
- name TEXT NOT NULL
- code TEXT NOT NULL
- logo_object_path NULL
- address_line1 NULL
- address_line2 NULL
- landmark NULL
- city NULL
- state NULL
- country NULL
- postal_code NULL
- status ACTIVE | ARCHIVED
- created_at
- updated_at

UNIQUE(code)
```

Do not add chair/vice-chair fields initially.

Preserve current lifecycle principle:
- do not archive a college while active dependent academic/user records still require it
- dependency checks should live in one domain service, not be duplicated in controllers

### 4.3 Departments

```text
departments
- id UUID PK
- college_id FK colleges
- name TEXT NOT NULL
- archived_at NULL
- created_at
- updated_at
```

Database invariant:

```text
active department names are case-insensitively unique within a college
```

Preserve current delete/archive guards:
- active programs block archive
- active faculty assignments block archive
- active courses block archive

Do not trust `college_id` supplied by the client when updating an existing department. Resolve ownership from the stored record first.

### 4.4 Optional future leadership model

Only add this if a real workflow requires it:

```text
department_leadership
- department_id
- membership_id
- role CHAIR | VICE_CHAIR
- starts_at
- ends_at
```

This is preferable to `dept_chair_id` and `dept_vice_chair_id` columns.

---

## 5. Authentication design

### 5.1 Use one Identity Platform user pool

Do **not** use Identity Platform tenant-per-college as the LMS tenancy model.

Reasons:
1. LMS tenancy is an application/data concern and already requires PostgreSQL relationships.
2. One real person can have roles/accounts across multiple colleges.
3. The current product uses phone-based identity heavily.
4. Identity Platform's documented tenant sign-in provider list does not include phone sign-in, while non-tenant Identity Platform does support phone sign-in.
5. Splitting one person into multiple Identity Platform tenant users would recreate today's duplicate-account problem.

Use one Identity Platform identity per person and keep all LMS memberships in PostgreSQL.

### 5.2 Phone identity

Current behavior treats the same normalized mobile number as the same human for account switching.

Migration rule:

```text
normalize legacy phone
   ↓
one Identity Platform user
   ↓
one vNext users row
   ↓
N college memberships
```

Any collisions/ambiguous phone records must be reported, never silently merged.

### 5.3 Application session

Preferred web pattern:
1. client completes Identity Platform sign-in
2. server verifies the ID token
3. server establishes an HttpOnly session cookie
4. each server request resolves the vNext user and memberships
5. authorization is checked against PostgreSQL

Do not copy the old access-token-in-memory + refresh-token-in-localStorage architecture.

### 5.4 Active membership

The chosen college/account is application context.

```text
authenticated user
       +
activeMembershipId
       ↓
server verifies membership belongs to user and is active
       ↓
request context
```

Changing membership must not require changing the user's authentication identity.

Never trust an `activeMembershipId`, college ID or organization ID from a cookie/request without checking it against the authenticated user.

### 5.5 Superadmin scope

Superadmin is a global role.

The UI may select:

```text
GLOBAL
ORGANIZATION X
COLLEGE Y
```

for navigation/filtering/safe editing, but selecting scope must not remint Identity Platform credentials.

Dangerous operations may require an explicit selected scope as an additional safety rail, while authorization still comes from the global SUPER_ADMIN assignment.

### 5.6 Cross-domain tenant switching

Current LMS uses one-time auth handoff tokens because browser cookies cannot be shared across unrelated parent domains.

Do not copy that table yet.

During the auth implementation phase, decide between:
- a central authentication domain + redirect handoff
- a small one-time application handoff mechanism
- reducing custom-domain dependence

Tenant domains remain in the data model regardless.

---

## 6. Authorization model

Do not create a dynamic "permissions CMS" initially.

Keep permissions in TypeScript policy code so they are reviewable and testable.

Example:

```ts
can(context, "department.read", department)
can(context, "department.manage", department)
can(context, "college.manage", college)
can(context, "learner.view", learner)
```

Request context should contain:

```text
user
global roles
active membership
membership roles
college
organization
```

Core invariants to port from `AccessControlService`:

1. Anonymous requests fail closed.
2. SUPER_ADMIN may operate globally, subject to optional selected-scope safety rules.
3. COLLEGE_ADMIN may mutate only their own college.
4. Ordinary college members may not cross college boundaries.
5. Resource ownership is resolved server-side from the resource, not accepted from the client.
6. LEARNER self-service operations require the target learner profile to belong to that membership.
7. Missing/unresolvable ownership fails closed.
8. HR is fenced to explicit HR capabilities and grants.
9. TPO/Mentor capabilities come from roles, not faculty title.
10. Client-side portal guards are UX only; server-side policy is authoritative.

---

## 7. Tenant domains

Keep:

```text
tenant_domains
- id UUID PK
- college_id FK
- host TEXT UNIQUE
- is_primary
- is_verified
- verification_token
- verified_at
- last_checked_at
- last_check_result
- created_at
- updated_at
```

Do not let domain selection define authorization. Host resolution identifies a tenant UI context; the authenticated membership still decides what the user can access.

---

## 8. Account lifecycle

### Membership suspension

Suspending a learner/faculty role at one college should set:

```text
college_memberships.status = SUSPENDED
suspended_at
suspension_reason
```

The same human can remain active in another college membership.

Every request using a membership must verify that membership is active.

### Global disable

Use only for platform-level account disable/abuse:

```text
users.platform_status = DISABLED
+
disable/revoke in Identity Platform
```

### Sessions

Do not create a custom session table during the first core migration.

If we retain the current "view devices / revoke one session" product feature, add an application session registry intentionally later. Do not rebuild refresh-token blocklists and token-version logic by default.

---

## 9. Legacy-to-vNext mapping

| Legacy | vNext |
| --- | --- |
| learner.contact_mobile | users.phone_e164 |
| faculty.contact_mobile | users.phone_e164 |
| hr_user.contact_mobile | users.phone_e164 |
| learner row | college_membership + learner_profile |
| faculty row | college_membership + faculty_profile |
| hr_user row | user + hr_profile |
| learner.college_id | college_membership.college_id |
| faculty.college_id | college_membership.college_id |
| learner.user_type=LEARNER | membership_role LEARNER |
| faculty.user_type=FACULTY | membership_role FACULTY |
| faculty_type=ADMIN | membership_role COLLEGE_ADMIN |
| faculty_type=MENTOR | membership_role MENTOR (+ FACULTY) |
| faculty_type=TPO | membership_role TPO (+ FACULTY) |
| other faculty_type values | faculty profile employment/title fields |
| principal id=0 | system_role SUPER_ADMIN |
| learner/faculty suspended_at | membership suspension |
| token_version | removed after Identity Platform cutover |
| org membership inferred by mobile | explicit user → memberships |
| college unique_id | colleges.code |
| dept chair/vice IDs | not migrated initially |
| tenant_domain | tenant_domains |

---

## 10. Migration identity map

Every migrated legacy record must be traceable.

Create a migration-only table:

```text
legacy_id_map
- legacy_entity_type
- legacy_id
- new_entity_type
- new_id UUID
- migrated_at
- metadata JSONB

UNIQUE(legacy_entity_type, legacy_id, new_entity_type)
```

Important examples:

```text
LEARNER:123  -> MEMBERSHIP:<uuid>
LEARNER:123  -> LEARNER_PROFILE:<uuid>
FACULTY:77   -> MEMBERSHIP:<uuid>
FACULTY:77   -> FACULTY_PROFILE:<uuid>
COLLEGE:5    -> COLLEGE:<uuid>
DEPARTMENT:9 -> DEPARTMENT:<uuid>
```

This makes later module migration deterministic.

---

## 11. Required data-quality checks before account migration

Before converting production users:

1. Normalize every phone to E.164.
2. Find multiple learner rows sharing a phone.
3. Find multiple faculty rows sharing a phone.
4. Find learner + faculty rows sharing a phone.
5. Flag same-phone records with conflicting names that may represent different humans.
6. Flag rows with no usable phone.
7. Flag duplicate emails.
8. Verify every learner/faculty college exists and is active.
9. Verify every faculty department belongs to the same college.
10. Identify `user` table accounts that are still actually used.
11. Identify legacy role rows still required by any active endpoint.
12. Export all collisions into a reconciliation report; never auto-merge ambiguous identities.

---

## 12. Department-specific migration rules

For each legacy department:

1. map legacy college ID through `legacy_id_map`
2. trim name
3. reject/flag blank names
4. detect case-insensitive duplicates within the same college
5. create active vNext department
6. record legacy mapping
7. record legacy chair/vice-chair IDs in migration diagnostics only
8. do not attach leadership until a real vNext leadership feature exists

No department may move colleges through a generic update operation.

---

## 13. First implementation batch

Do not build Projects/Courses/Placements yet.

### Batch A — schema primitives

Create:
- enums/status primitives
- organizations
- colleges
- users
- college_memberships
- membership_roles
- system_roles
- departments
- tenant_domains
- legacy_id_map

Plus database constraints and indexes.

### Batch B — policy primitives

Create:
- authenticated user context
- membership context
- role resolution
- centralized `can()`/require-policy helpers
- tenant-boundary tests
- superadmin/global-scope tests

### Batch C — first vertical slice: Departments

Implement:
- list departments
- create department
- rename/update department
- archive department
- uniqueness rule
- dependency guard placeholders
- college-admin and superadmin policy
- UI page
- unit + integration + Playwright tests

This proves the full vNext pattern before larger modules migrate.

---

## 14. Explicit non-goals for the first batch

Do not add:
- microservices
- Redis
- Pub/Sub
- Kafka
- GKE
- dynamic permission tables
- organization/college JWT reminting
- custom refresh-token blocklist
- user-session registry
- chair/vice-chair columns
- Projects
- Placements
- Course migration
- AI features

---

## 15. Decisions still intentionally deferred

These should be resolved only when their migration phase starts:

1. custom-domain SSO/handoff mechanism
2. whether device/session management is worth retaining
3. exact split of faculty `employment_type` vs `academic_title`
4. HR company model during Placements migration
5. how much learner profile JSON should normalize into relational tables
6. final production treatment of legacy `user` and `role` tables after data audit

---

## 16. Definition of done for the core platform

The core platform is ready for module migration when:

- one Identity Platform user maps to one vNext user
- that user can have multiple explicit college memberships
- memberships can carry multiple roles
- SUPER_ADMIN is a real global role
- selected admin scope does not alter authentication identity
- cross-college access fails closed in automated tests
- suspended memberships cannot access tenant data
- organizations/colleges/departments are protected by DB constraints and policy checks
- legacy IDs are traceable through `legacy_id_map`
- Departments works end-to-end as the first migrated vertical slice

At that point we have a stable platform on which Academics, Projects and Placements can migrate independently.
