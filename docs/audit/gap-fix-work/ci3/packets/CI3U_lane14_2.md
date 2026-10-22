# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-support-history-pagination.test.ts (2 failing)
- own authorized support request filtering and pagination > returns persisted own request under its real type/status

  ```
  
  ```
- own authorized support request filtering and pagination > denies forged college, suspended and wrong-role

  ```
  error: null value in column "learner_membership_id" of relation "placement_learner_requests" violates not-null constraint
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/learner-support-history-pagination.test.ts:17:3
  15|   fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCal…
  16|   id=randomUUID();
  17|   await pool.query(
  |   ^
  18|     "INSERT INTO placement_learner_requests(id,application_id,request_…
  ```

## tests/integration/placements-p5-applications.test.ts (5 failing)
- Placement P5 applications > enforces eligibility, creates one stable application and supports manager/self reads

  ```
  
  ```
- Placement P5 applications > makes hybrid channel choice explicit and requires confirmation for external applications

  ```
  
  ```
- Placement P5 applications > treats withdrawal as a stable terminal application state

  ```
  
  ```
- Placement P5 applications > denies new submissions after a published drive is closed

  ```
  
  ```
- Placement P5 applications > blocks expired jobs and cross-college learner substitution

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p5-applications.test.ts:105:3
  103|     "delete from placement_application_status_history",
  104|   );
  105|   await pool.query(
  |   ^
  106|     "delete from placement_applications",
  ```

## tests/integration/projects-p7b-meetings.test.ts (7 failing)
- Projects P7B meetings > lets a learner request and a mentor schedule then complete a meeting

  ```
  ProjectsServiceError: PROJECT_MEETING_STALE_VERSION
  ❯ src/modules/projects/meeting-service.ts:395:14
  393|       (existing && !input.expectedUpdatedAt) ||
  394|       (!existing && !input.expectedProjectUpdatedAt)
  395|     )) throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  |              ^
  396|     if (existing && input.expectedUpdatedAt &&
  397|       existing.updatedAt.getTime()!==new Date(input.expectedUpdatedAt)…
  ```
- Projects P7B meetings > lets a learner cancel only their own pending request

  ```
  
  ```
- Projects P7B meetings > supports direct mentor/admin scheduling with validated project links

  ```
  
  ```
- Projects P7B meetings > rejects invalid windows in validation and PostgreSQL

  ```
  
  ```
- Projects P7B meetings > aggregates only active mentor assignments into the personal calendar

  ```
  
  ```
- Projects P7B meetings > cannot revive a cancelled or completed meeting through a stale schedule

  ```
  
  ```
- Projects P7B meetings > denies disabled platform accounts in both project list and direct workspace reads

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/projects-p7b-meetings.test.ts:150:3
  148|
  149| async function cleanup() {
  150|   await pool.query(
  |   ^
  151|     `delete from project_meetings
  ```

## tests/integration/super-admin-videos-directory.test.ts (1 failing)
- Super Admin videos directory disposable PostgreSQL > returns only videos, hides other kinds and foreign-college content

  ```
  Error: You tried to reference "hasLegacyRichContent" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.
  ❯ SelectionProxyHandler.get node_modules/src/selection-proxy.ts:95:10
  ❯ node_modules/src/pg-core/query-builders/select.ts:131:16
  ```
