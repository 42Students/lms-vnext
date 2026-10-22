# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/mentor-meeting-reschedule.test.ts (1 failing)
- Mentor meeting reschedule PostgreSQL audit and CAS > reschedules once, logs audit and denies stale/conflicting/wrong-scope writes

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-meeting-reschedule.test.ts:37:7
  35|       "project_meetings","project_members","project_resources","projec…
  36|       "project_sprints","project_releases"]){
  37|       await pool.query("delete from "+table+" where project_id=any($1:…
  |       ^
  38|     }
  ```

## tests/integration/placements-p8-offers.test.ts (30 failing)
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-NOTIFY-31 DB records expiry without alerting learner who disabled application notices

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-NOTIFY-30 DB records and notifies exactly once after offer deadline, never from a GET

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-RACE-05 DB serializes sweep versus same-offer learner acceptance into one terminal outcome

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > TPO-2ND-PAGE-OFFERS-DB-01 protects live register and export against a foreign-college actor

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > TPO-2ND-PAGE-OFFER-EVIDENCE-DB-02 rejects a real offer ID paired with a different drive

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > PLACEMENTS-IDOR-01 refuses a wrong-college TPO, learner issuing an offer and TPO self-acceptance

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-ESCALATE-21 DB escalates a future round only once, with a real college TPO recipient

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-NOTICE-19 DB preference opt-out suppresses TPO notice without dropping audited decision

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-NOTICE-18 DB issues exactly one preference-scoped learner notice per durable TPO decision

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- Placement P8 offers and joining > TPO-JOIN-TRACKER-DB-35 projects only accepted offers and never interprets pending joining as JOINED

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
- … 20 more in this file

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

## tests/integration/tpo-settings-read-service.test.ts (1 failing)
- TPO settings read service against PostgreSQL > reads seasons and rules for the TPO college

  ```
  AuthorizationError: Missing permission: placements.manage
  ❯ src/modules/placements/tpo-settings-read-service.ts:56:44
  54|    collegeId,organizationId:college.organizationId,
  55|   });
  56|   if(!hasMembershipRole(actor,"TPO"))throw new AuthorizationError("pla…
  |                                            ^
  57|  });
  58| }
  ```
