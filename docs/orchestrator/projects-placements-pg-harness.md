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
