# Placements / TPO / HR — vNext Architecture

**Status:** current-state inventory complete; implementation foundation active  
**Repository:** `42Students/lms-vnext`  
**Legacy references only:** `42Students/lms@40640eca`, `42Students/lms2-fe@5f445a00`

The legacy repos are behavior, safety and UX references. vNext is greenfield and does not migrate legacy placement data.

## 1. Product contract

Placement is a first-class LMS domain, not a separate portal bolted onto the product.

The operating model is:

1. know the learner before placement begins,
2. preserve employer relationship memory across seasons,
3. run opportunities, applications, rounds, offers and joining with explicit state machines,
4. tell the placement team what requires attention,
5. connect Course, assessment and Project evidence to placement readiness,
6. keep consequential decisions human-controlled and explainable,
7. add AI only after structured events, evidence, actions and permissions are reliable.

Deterministic rules and evidence come before AI scoring or a generic chatbot.

## 2. Actors and authorization

### Learner

A learner may read and mutate only their own placement state through learner-specific services. A generic same-college learner permission never grants access to another learner.

### TPO

`TPO` is a membership role. It is not a separate identity and it is not a Faculty title. A user may be `FACULTY + TPO`.

TPO can manage placement operations only inside the active membership's college.

### College Admin

College Admin is a placement manager for its own college. This preserves the existing fallback where a college can operate placements before a dedicated TPO account exists.

### Super Admin

SUPER_ADMIN uses the existing selected-scope safety rail. A college-scoped superadmin may operate on that college; a mismatched scope fails closed.

### Recruiter / HR

Recruiter access will use the canonical `users` identity plus an employer profile and explicit college grants. HR is not silently converted into a Faculty or college membership.

A recruiter can have access to multiple colleges without those colleges sharing private notes, applicant data or relationship state.

## 3. Hard invariants

- college ownership is resolved server-side; client-supplied college IDs are never trusted for an existing resource
- learner self-service always resolves the learner from the active membership
- TPO/College Admin mutations require `placements.manage`
- historical seasons and closed drives are read-only except explicit post-close operations
- application, result, offer and joining history is retained; terminal history is not erased to simplify UI
- state changes happen through domain transition services, not arbitrary status PATCHes
- repeated consequential requests are idempotent or concurrency-safe
- deadlines and interviews store instants plus the intended timezone where local-clock meaning matters
- recruiter-visible learner data goes through one centralized privacy policy
- exports and recruiter downloads are auditable
- no UI claims success before the backend confirms the outcome
- bulk actions preview scope and report partial failures explicitly
- every derived risk/readiness signal exposes its evidence
- project/course/assessment evidence is permission-filtered before placement or recruiter use

## 4. Canonical domain boundaries

### Employer identity

Use one canonical employer identity rather than recreating the legacy `Company` + `IndustryCompany` split.

Planned shape:

- `placement_companies`: global, low-sensitivity canonical employer identity
- `placement_company_relationships`: college-owned CRM relationship and ownership
- recruiter/contact records attach to the canonical company
- college-private notes/activity never live on the global company row

This lets one employer or recruiter work with multiple colleges while tenant-private relationship history remains isolated.

### Placement seasons and rules

A season is college-owned and supplies the operating time boundary for drives, reporting and placement rules.

Past seasons are read-only. Starting a new season carries forward employer identity/relationship memory, not stale operational tasks.

### Learner placement profile and preferences

Placement registration, consent, job preferences, academic/readiness evidence and learner-controlled visibility remain separate from the base learner profile.

Academic truth comes from Academics/Courses where possible rather than copied placement-only fields.

### Drives / opportunities

One canonical drive root represents an employer hiring process. One drive may expose one or more role options.

The learner-facing Jobs surface is a view over eligible published role opportunities; it is not a second job data model.

Current vNext implementation keeps `placement_jobs` as the durable drive root and compatibility projection for the primary role, while `placement_job_role_options` stores the exact active/archived role options. Creating a drive creates one primary role atomically, draft edits keep that primary role synchronized, and additional roles are managed independently before publish. Every application stores an exact `role_option_id`; the legacy no-role apply shape remains compatible only when a drive has exactly one active role. Eligibility and round configuration stay drive-scoped, while screening, results, offers and learner timelines retain application/role identity.

A drive owns:

- company relationship
- season
- mode and lifecycle
- role/pay options
- eligibility policy
- application window
- rounds
- results
- offers
- recruiter access
- activity

### Eligibility

Eligibility is deterministic and explainable.

Store the rule configuration and, where operationally necessary, an evaluation snapshot/reason set. Overrides are explicit, authorized, reasoned and auditable.

Missing data semantics must be intentional; they must not silently become eligible/ineligible because of null handling.

### Applications

An application belongs to the exact learner membership and exact opportunity/role identity.

Application history is append-only through status-history/event records. Withdrawal, rejection, waitlist, offer and hire transitions have explicit policy gates.

Application ID is the canonical action identity; job/drive IDs are never substituted for it.

### Rounds, interviews and results

Rounds belong to a drive. Interview/assessment participation belongs to an application.

Schedule/reschedule/decline behavior is explicit, timezone-safe and conflict-aware. Result import/staging never mutates application state until an authorized apply step succeeds.

### Offers and joining

Offers are durable records separate from application status. Acceptance, withdrawal, dispute windows, joining outcome and reversal policies are explicit transitions.

### Requests and exceptions

Learner requests cover withdrawal, reschedule, absence dispute, correction, offer extension and other approved categories. Approval must atomically execute the requested domain effect or fail; an APPROVED request with no effect is invalid.

### Employer CRM

Leads, contacts, follow-ups and employer activity build on the canonical company + college relationship. The CRM is college-private even when the underlying company identity is shared.

### Activity, notifications and action engine

Placement domain events should later feed the shared Activity/Notifications phase.

TPO "Needs attention", HR work queues, notifications and future AI should converge on one structured action/event model rather than page-specific reminder logic.

## 5. Legacy consolidation

| Legacy concept | vNext |
| --- | --- |
| `Company` + `IndustryCompany` | one canonical placement company identity |
| TPO company memory | college-company relationship + activity |
| `HrUser` | canonical user + recruiter profile |
| `HrCollegeAccess` | explicit recruiter-college grant |
| FacultyType/TPO coupling | membership role `TPO` |
| `Job` plus overlapping drive semantics | one drive/opportunity aggregate with role options |
| learner/job actions by mixed IDs | exact resource IDs, especially application ID |
| scattered eligibility checks | one eligibility policy/evaluator |
| scattered recruiter visibility checks | one recruiter privacy policy |
| scattered status writes | domain transition services + history |
| legacy migration maps | not required; vNext starts fresh |

## 6. UI contract

Placements stays inside the shared authenticated `AppShell`.

Do not build separate TPO or HR visual shells.

The main sidebar should expose a small number of workspaces, not every placement page. Placement-specific navigation belongs inside the Placement workspace.

The visual system remains white/neutral with the canonical LMS teal tokens. Status colors have semantic meaning only.

Mobile uses the shared drawer navigation; placement tables/actions must also receive a dedicated mobile pass.

## 7. Implementation order

1. current-state inventory + centralized placement permissions
2. canonical companies/employers + college relationship boundary
3. learner candidate preferences/placement profile
4. placement seasons/rules needed by jobs
5. drive/job aggregate + role options
6. deterministic eligibility + overrides
7. applications + transition history
8. screening/rounds/interviews/results
9. offers + joining outcomes
10. TPO operational workspaces and action queues
11. recruiter/HR profile, grants and workflows
12. learner Placement workspace
13. cross-module readiness evidence
14. activity/notifications/analytics integration
15. AI tools only after the structured foundation is proven

## 8. Test requirements

Every placement batch must include applicable:

- tenant-isolation tests
- role/capability tests
- exact-resource identity tests
- invalid/stale state transition tests
- concurrency/idempotency tests for consequential writes
- historical/read-only tests
- timezone/deadline boundary tests
- recruiter privacy tests
- learner self-scope tests
- browser regression for completed user journeys

No placement milestone is closed only because a page renders.
