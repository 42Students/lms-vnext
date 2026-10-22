# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/mentor-board-health.test.ts (2 failing)
- Mentor final delivery reviewed with immutable audit > accepts default now() token once and denies stale/foreign/wrong-role

  ```
  ProjectsServiceError: PROJECT_SUBMISSION_INVALID_STATE
  ❯ src/modules/projects/mentor-final-delivery-decision-service.ts:40:10
  38|   if(!submission)throw new ProjectsServiceError("PROJECT_SUBMISSION_NO…
  39|   if(!project||!mentorFinalDeliveryCanReview(submission.status,project…
  40|    throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  |          ^
  41|   // The project row lock serializes new draft/version creation. Never…
  42|   // a stale URL naming an older submission, even if its status was co…
  ```
- Mentor meeting audited optimistic decisions on disposable PostgreSQL > completes a SQL-backed meeting and denies replay/foreign/wrong-role

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

## tests/integration/placements-p6c-results.test.ts (5 failing)
- Placement P6C staged results > keeps staged results private until an authorized apply after round completion

  ```
  
  ```
- Placement P6C staged results > preserves staged correction history and makes applied results immutable

  ```
  
  ```
- Placement P6C staged results > allows a later evaluative round only after every prior evaluative round has an applied pass

  ```
  
  ```
- Placement P6C staged results > does not advance a failed candidate into the next evaluative round

  ```
  
  ```
- Placement P6C staged results > blocks result operations across college boundaries

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p6c-results.test.ts:117:3
  115|     "delete from placement_application_status_history",
  116|   );
  117|   await pool.query(
  |   ^
  118|     "delete from placement_applications",
  ```

## tests/integration/sa-courses-content-authoring.test.ts (2 failing)
- Super Admin Video, Resources and Live Classes authoring (real PostgreSQL) > SA-academics-people-58: a Super Admin with no membership authors, edits, publishes and archives YouTube, Resource and Live class content

  ```
  Error: You tried to reference "hasLegacyRichContent" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.
  ❯ SelectionProxyHandler.get node_modules/src/selection-proxy.ts:95:10
  ❯ node_modules/src/pg-core/query-builders/select.ts:131:16
  ```
- Super Admin Video, Resources and Live Classes authoring (real PostgreSQL) > SA-academics-people-58: lessons can be created, edited and archived by a Super Admin without membership

  ```
  ZodError: [
  {
  "expected": "string",
  "code": "invalid_type",
  "path": [
  "expectedUpdatedAt"
  ],
  "message": "Invalid input: expected string, received undefined"
  ```
