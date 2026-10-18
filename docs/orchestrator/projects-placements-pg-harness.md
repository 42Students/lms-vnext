# Projects + Placements PostgreSQL integration harness (IIT Dharwad)

**Owner:** chat-17 • **Priority:** PROJECTS TOP PRIORITY • **Source:** `tests/integration/support/projects-placements-pg-harness.ts`  
**Examples:** `tests/integration/projects-placements-pg-harness-groups.test.ts`  
**Scope:** Real PostgreSQL, current registered Drizzle schema, shared fixtures for the seven account journeys. **Not** a mocked database or a certification of production readiness.

## Run safely

1. Provision a *disposable* PostgreSQL database with a name containing `test`, `ci`, or `tmp` (for example `lms_vnext_projects_test`). Do not point it to production/staging or a database with live learner data.
2. Apply the repository's **registered** migration journal, not proposal-only SQL. Existing integration preparation is `npm run db:test:prepare` with the appropriate disposable `TEST_DATABASE_URL`; confirm its setup in your environment before invoking it. The harness never creates schemas, drops tables, truncates tables, issues COMMIT, or runs migration scripts.
3. Run:

```bash
export TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext_projects_test'
npm run test:db:projects-harness
```

The harness requires `TEST_DATABASE_URL` explicitly and **never** reads `DATABASE_URL`. It checks the URL's database name *and* `current_database()` on the connected server before writes, verifies 32 registered canonical table names, then starts a transaction. Every invocation calls `ROLLBACK` in a `finally` and releases its connection even if assertions fail. The pool is closed by each suite. Every test generates fresh IDs; it does **not** depend on mutable seed UUIDs.

Do not bypass the disposable-database-name guard; use a properly named test database. Remote developer CI must supply credentials as secrets, never include them in logs.

## Public fixture API

```ts
import { newHarnessPool, withProjectPg, createTenant, createPrincipal,
  createProjectFixture, createTaskSubmission, createFinalSubmission, submitFinalSubmission,
  createMeeting, createPlacementFixture, createPlacementCandidateFixture } from "./support/projects-placements-pg-harness";

const pool = newHarnessPool();
try {
  await withProjectPg(pool, async db => {
    const tenant = await createTenant(db, "IIT Dharwad test college");
    const other = await createTenant(db, "Other organization");
    const admin = await createPrincipal(db, tenant, ["COLLEGE_ADMIN"]);
    const mentor = await createPrincipal(db, tenant, ["MENTOR","FACULTY"]);
    const learner = await createPrincipal(db, tenant, ["LEARNER"]);
    const outsider = await createPrincipal(db, other, ["LEARNER"]);
    const project = await createProjectFixture(db, tenant, admin, mentor, learner);
    const taskSubmissionId = await createTaskSubmission(db, project, learner);
    const finalSubmissionId = await createFinalSubmission(db, project, learner);
    await submitFinalSubmission(db, finalSubmissionId, learner);
    const meetingId = await createMeeting(db, project, learner, admin);
    const drive = await createPlacementFixture(db, tenant, admin);
    const candidate = await createPlacementCandidateFixture(db, drive, learner, admin);
    // SELECT/query/UPDATE/etc. using db.query with parameter binding;
    // DB-backed service functions needing their own connection: see warning below.
    await db.expectSqlState(
      () => db.query("update project_tasks set sequence=-1 where id=$1",[project.taskId]),"23514",
    );
    // SAVEPOINT rolls back the invalid statement; the outer transaction is usable.
    void { outsider,taskSubmissionId,finalSubmissionId,meetingId,drive,candidate };
  });
} finally { await pool.end(); }
```

`PgHarness.client` exposes the actual `pg.PoolClient` for drivers that require it. `db.query<T>(sql, values)` returns typed rows. `db.savepoint(fn, rollback?)` brackets nested assertions; `db.expectSqlState(op, "23505" | "23514" | "23503")` checks the database error class and recovers the transaction by rolling back to a SAVEPOINT. Always parameterize values; the helper's internal SAVEPOINT names are generated numeric strings.

### Cross-account and concurrency helpers

`withTwoPgSessions(pool, async (a, b) => { /* ... */ })` opens two independent real PostgreSQL connections against the same *disposable* database, sets `SET LOCAL lock_timeout = '1500ms'`, and rolls back/releases both even on errors. It is for state races, stale sessions and shared **committed** seed records. Do not nest it within `withProjectPg` using the default two-connection pool (that would exhaust the pool). Example `PROJ-HARNESS-21` verifies separate client identities and safe parallel reads. For destructive races, choose disposable rows committed only by an explicitly managed service fixture lifecycle with cleanup; this rollback-only harness intentionally never publishes new data to other sessions.

**Critical isolation limitation:** PostgreSQL transaction fixtures are only visible on the *same connection*. Services that call `getDb()` allocate another pool connection and cannot read this uncommitted graph; this is expected MVCC behavior. Never conclude the service failed authorization from missing rows! For service-level/HTTP IDOR tests, use a separate explicitly disposable dedicated DB with a lifecycle-managed cleanup graph, or refactor service dependency injection to accept this connection; do not COMMIT these fixtures merely to make them visible. Other lanes own service tests, not this harness.

## Group-by-group acceptance examples

| Group | Canonical PostgreSQL tables | Representative cases |
|---|---|---|
| Tenant / identities / roles | organizations, colleges, users, college_memberships, membership_roles, system_roles | Two independent orgs, role combinations, wrong-college actor refused by fixture |
| Templates and versions | project_templates, project_template_versions | Case-folded slug unique 23505, version >= 1 check 23514 |
| Assignments | project_template_college_assignments | One active assignment per (template,college), no double-assignment |
| Workspaces | project_instances | Per-college slug uniqueness, project lifecycle status check |
| Releases | project_releases | Unique key and nonnegative order |
| Sprints | project_sprints | One active sprint, date bounds, sprint ordering |
| Tasks | project_tasks | Unique per-sprint ordering, status / sequence checks |
| Resources | project_resources | Status check, unique per-project key |
| Memberships | project_members | One active member, no learner as primary mentor |
| Task submissions / review | project_task_submissions | Only one active SUBMITTED, positive version, explicit review shape |
| Final delivery | project_submissions, project_delivery_events | No duplicate draft/open submission, submit-state shape, reason text, tenant-safe project/submission composite FK |
| Reviews / grading | project_submission_reviews, project_evaluations, project_evaluation_items | Changes-requested feedback, bounded rubric math, unique criteria order |
| Meetings | project_meetings | End after start, server IST label, required schedule actor |
| Placement companies / drives | placement_companies, placement_company_relationships, placement_seasons, placement_jobs, placement_job_rounds | Unique company-college relationship, positive openings, published status shape, round sequence uniqueness |
| Transactions / tenancy | all groups | Savepoint recovery after 23514, hard rollback with separate-connection proof, other-college rows excluded by explicit tenant predicates, two independent rollback-only sessions with a bounded lock wait |

**Cascades vs deletion:** Canonical project ancestry uses `ON DELETE RESTRICT` for the core project rows, **not** `ON DELETE CASCADE`. The example expressly verifies deletion of an instance with dependent tasks is blocked (23503); never assert a cascade that the registered database does not specify. Other table-specific cascades, if any, need exact migration evidence.

**Tenancy vs DB constraints:** The fixture refuses mismatched actor/college inputs and exercises tenant-scoped `WHERE college_id=$1` queries. It does not pretend that filtering alone proves route/service authorization. Candidate DB073/074/075 ancestry migrations have historically been staged; their separate tests use opt-in flags. Where those composite FKs are actually registered, `project_delivery_events(project_id,submission_id)` already has a registered composite FK and is tested here. Do not assert unregistered composites or silently accept a cross-project SQL write.

**Extended Placements examples:** `tests/integration/projects-placements-pg-harness-placements.test.ts` checks the registered season FK, second drive reusing the same active season, application uniqueness, screening lifecycle, round outcomes, offers, joining, restrict-on-delete, and fixture tenancy guard. `tests/integration/projects-placements-pg-harness-rollback.test.ts` checks rollback on thrown callbacks, savepoint discard, and restrictive template-version ancestry. The `test:db:projects-harness` command runs all three suites.

**Release bar:** The 21 project-group example tests (plus 9 placement and 3 rollback tests) are **authored**, not claimed passed. After a disposable migration replay, run the command and attach output to the project hardening ledger. Any failed constraint/tenancy witness is a defect, not a reason to weaken or skip a test. Request a different lane's review before describing IIT Dharwad readiness as verified.

## For other lanes

Use the same fixture helpers for: Super Admin acting scope, College Admin tenant ownership, faculty/mentor task access, learner submission and visibility, TPO/HR drive access. A single `withProjectPg` call can seed multiple organizations and users. Nested `savepoint` allows negative SQL cases without aborting later assertions. Test IDOR and HTTP boundaries separately with actor contexts and current production services, not only SQL selects.

## Cross-tenant and concurrency fixture examples (PROJ-HARNESS-22..28)

The registered suite `tests/integration/projects-placements-pg-harness-boundaries.test.ts` exercises:
- Foreign-college, non-rostered and wrong-role actors attempting task submissions, final submissions, and meeting requests.
- A foreign or stale tab attempting to complete someone else's draft final delivery; failed calls must leave the row DRAFT.
- A suspended college membership, a disabled user, an ended `project_members` roster membership and a `can_mutate=false` project member; none may create submissions through the fixture helpers.
- Genuine PostgreSQL two-session advisory lock contention, released by rolling back a SAVEPOINT. Neither session commits any rows.

`createTaskSubmission`, `createFinalSubmission`, `submitFinalSubmission` and `createMeeting` now verify tenant-linked active learner project membership and current mutation capability in the **same transaction** before writing. Meeting authors must be from the project college. This improves fixture integrity and does *not* claim service/route IDOR protection or background worker idempotency. To validate production security, test each service with an authenticated request context and a separate disposable database transaction/cleanup strategy.

Shared kit regression additions: `tests/unit/UX-kit-role-and-overlay-chat17.test.tsx` covers scoped rendering, expired actors, WebView back markers, safe table links, file prechecks, toast timer cleanup. Run `npm run test:ux:kit:hardening` for these and earlier UI checks.

## Additional schema and query-plan witnesses (PROJ-HARNESS-29..32)

`tests/integration/projects-placements-pg-harness-relations-chat17.test.ts` is included in `npm run test:db:projects-harness` and runs against the same guarded `TEST_DATABASE_URL`. It checks:

1. Migrated unique/partial indexes for college workspaces, active mentors, one active sprint, submissions, and evaluation item ordering via `pg_indexes`.
2. `EXPLAIN (FORMAT JSON)` plans for tenant-scoped workspace and project-task reads, verifying queries are accepted by real PostgreSQL. A one-row fixture is **not** evidence of planner index selection at scale.
3. Actual `pg_constraint.confdeltype='r'` for core Projects restricted foreign keys, rather than inventing cascade expectations.
4. Failed task and workspace deletions leave their submission and final-delivery descendants intact; each SQLSTATE `23503` is isolated by a SAVEPOINT and the entire transaction rolls back.

A separate high-volume seeded disposable database and `EXPLAIN ANALYZE` are required before claiming 1,000+ project/task query performance. Do not use these rollback-only fixtures as a throughput benchmark. CI must verify all examples on the currently registered Drizzle journal, and any failing constraint witness is a release bug, not a reason to skip the test.

## Actor-role fixture anti-forgery (PROJ-HARNESS-33..35)

`createProjectFixture` now verifies that its author holds an active `COLLEGE_ADMIN` membership, mentor has an active `MENTOR` membership, and learner has an active `LEARNER` membership in the same **active college**, including current user account state. `createPlacementFixture` likewise requires an active `COLLEGE_ADMIN` or `TPO` membership. The check joins `users`, `college_memberships`, `membership_roles` and `colleges` on the same PostgreSQL transaction before the fixture inserts a template, drive or company. User-supplied fixture role arrays alone are never authoritative. Negative cases cover role spoofing, suspended/disabled project authors, and suspended TPO initiators with zero writes. These are test-fixture integrity guardrails and must not be mistaken for route-level business authorization.

- **PROJ-HARNESS-36:** `createMeeting` now checks the meeting coordinator's current `COLLEGE_ADMIN` or `MENTOR` college role before inserting; merely possessing an active same-college membership is not enough. `tests/integration/projects-placements-pg-harness-boundaries.test.ts` denies a same-college learner acting as coordinator and verifies that a college administrator still creates the meeting. This is fixture integrity, not production route authorization.

## Placement fixture role-revocation boundary (PROJ-HARNESS-PLACEMENTS-09..11)

`createPlacementCandidateFixture` validates the **persisted** learner and coordinator membership role, active membership and active user state in the drive's college before inserting applications, results or offers. Tests cover a suspended applicant, a TPO who lost the role after the initial fixture, and a disabled coordinator. Each assertion verifies rejected work does not change related row counts. These are fixture guards, not replacement authorization in placement route/service handlers; the host CI must run the PostgreSQL suite on a migrated disposable `TEST_DATABASE_URL`.

## Round-to-drive ancestry — PROJ-HARNESS-PLACEMENTS-12

`createPlacementCandidateFixture` validates the supplied round ID against `placement_job_rounds.job_id` for the **same persisted drive** before writing an application, screening, round result or offer. Previously an otherwise well-typed fixture object could mix a valid job with another drive's round and attempt a cross-parent insert. `tests/integration/projects-placements-pg-harness-placements.test.ts` creates two drives in the same college, forges the wrong round into the first drive fixture, and checks rejection leaves the first drive's application count unchanged. This guards **fixture composition**, not a claim that production route/service ancestry checks are complete.

## Additional tenant, lineage and team-collaboration witnesses — PROJ-HARNESS-38..42

`tests/integration/projects-placements-pg-harness-boundaries.test.ts` now exercises rollback-only, real PostgreSQL constraints against the live registered migration graph:

- **38:** after an organization or college is archived, task submissions, final drafts, meetings and drive creation reject stale fixture principals before any new row; restoring status re-enables the valid path.
- **39:** an active project roster record does not restore the learner's revoked `membership_roles.LEARNER` grant; task, final and meeting mutations remain denied.
- **40:** a valid task UUID from a *different* workspace in the same college cannot be paired with the submitted project UUID. The two separate SQL foreign keys do not enforce this composite lineage on their own, so `createTaskSubmission` validates persisted `project_tasks.project_id` first.
- **41:** a mentor must have an active, writable project mentor roster, not merely an active `MENTOR` college role, to schedule a meeting. College Admin continues to coordinate legitimate meetings.
- **42:** final delivery is a **collaborative project artifact**, consistent with production `submitProjectSubmission`. A second active rostered learner may submit a teammate's draft; an outsider may not, and only one DRAFT→SUBMITTED transition succeeds. It is incorrect to enforce `created_by_membership_id=submitter` on the group final-delivery transition.

The fixture guards join currently active college, organization, user, membership and learner role records before writes. These are **fixture-example guards, not a substitute** for the production service's independently audited permission and state-machine checks. Run `npm run test:db:projects-harness` against a completely disposable, migrated PostgreSQL database. The local connector cannot execute it or certify a pass.

## Terminal project tasks and meetings (PROJ-HARNESS-46)

The shared `requireMutableFixtureProject` SQL guard rejects `project_instances.status in ('ARCHIVED','COMPLETED')` for task submissions, project final delivery (draft/new submit), and meetings. This matches the explicit terminal-state checks in `task-submission-service.ts`, `submission-service.ts` and `meeting-service.ts`. `tests/integration/projects-placements-pg-harness-boundaries.test.ts` verifies both terminal states refuse task/meeting writes and restored ACTIVE permits them. These are fixture-level examples, not equivalent to full service-layer testing.

## Assignee and sprint-guarded task submissions — PROJ-HARNESS-47

The registered `0082_project_task_assignee.sql` migration added `project_tasks.assignee_membership_id`; the production `submitProjectTask` service requires an explicitly assigned learner, ACTIVE sprint and task not DONE/IN_REVIEW. The harness's earlier canonical task was unassigned and its sample sprint PLANNED, despite inserting submissions. Canonical fixtures now create an ACTIVE sprint with an explicitly assigned learner task. `createTaskSubmission` joins the persisted task and sprint by project, checks the learner's exact assignee membership and verifies active/reviewable state **before inserting**. New `PROJ-HARNESS-47` PostgreSQL test proves an otherwise rostered teammate is denied, completed sprint is denied, IN_REVIEW task is denied, and the assigned learner can submit on an active sprint. Unit harness contract asserts the corresponding SQL and fixture fields. These are **fixture business invariant tests**, not proof that production routes enforce them. Run the disposable PostgreSQL suite after merging.


### PROJ-HARNESS-ROLLBACK-04: wrong SQLSTATE is recoverable
A regression in `tests/integration/projects-placements-pg-harness-rollback.test.ts` intentionally expects the wrong SQLSTATE (`23505`) for a real `23514` CHECK failure, verifies that `expectSqlState` rejects the mistaken assertion, then reads and asserts against the same still-usable outer transaction. A second expected-`23514` call must succeed without poisoning the connection. Cloud PostgreSQL acceptance remains pending.

### PROJ-HARNESS-ROLLBACK-05: two-connection failure isolation
`tests/integration/projects-placements-pg-harness-rollback.test.ts` starts two separate real PostgreSQL transactions, inserts distinct organization rows, confirms each session cannot see the other's uncommitted rows, deliberately throws, and verifies that neither row survives. It validates rollback and pooled-connection reuse without committing or touching an existing account. Requires migrated disposable `TEST_DATABASE_URL`; PostgreSQL CI pending.

The managed wildcard domain guard is separate from the PostgreSQL harness. It validates the configured suffix directly, including shorthand IPv4 spellings that appear DNS-like when a fake subdomain is prepended; see `WEAK-tenant-managed-20`. This additional application guard does not alter fixture DB setup.


### PROJ-HARNESS-48: realistic ACTIVE state and future fixture dates

The shared graph now explicitly creates an `ACTIVE` project (not an implicit `PLANNED` project with an already-active sprint). Write helpers accept only `ACTIVE` projects, rejecting pre-launch `PLANNED` as well as `COMPLETED` and `ARCHIVED` for task submissions, final drafts/transitions, and meetings. `PROJ-HARNESS-48` verifies both denial and successful activation on real rollback-only PostgreSQL. Meetings and placement seasons use deterministic year-2099 test timestamps instead of near-expiring 2026/2027 fixtures. The source-only `PROJ-HARNESS-GUARD-09` guards these fixture invariants. Requires CI; not claimed passing.

### PROJ-HARNESS-PLACEMENTS-13/14: real application-ready fixture

The shared `createPlacementFixture` builds a published drive with `published_at`, a future (2099) application deadline, a positive INR 800,000 annual pay figure and two openings. `createPlacementCandidateFixture` fails closed if the persisted drive is DRAFT, CLOSED or past its deadline, before inserting application, round or offer rows. Both cases are exercised against disposable PostgreSQL in `projects-placements-pg-harness-placements.test.ts`, and source contract `PROJ-HARNESS-GUARD-10` protects published prerequisites. This is a fixture validity assertion, not a replacement for the real TPO service's publication and eligibility tests.
