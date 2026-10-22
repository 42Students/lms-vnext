# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
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

## tests/integration/placements-p6b-rounds.test.ts (5 failing)
- Placement P6B rounds > assigns stable order and supports atomic reorder before scheduling

  ```
  
  ```
- Placement P6B rounds > keeps scheduling explicit, time-safe and auditable

  ```
  
  ```
- Placement P6B rounds > retains cancelled history without consuming the active sequence

  ```
  
  ```
- Placement P6B rounds > makes closed jobs read-only for round operations

  ```
  
  ```
- Placement P6B rounds > blocks round management across colleges

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p6b-rounds.test.ts:91:3
  89|     "delete from placement_application_status_history",
  90|   );
  91|   await pool.query(
  |   ^
  92|     "delete from placement_applications",
  ```

## tests/integration/projects-placements-pg-harness-groups.test.ts (1 failing)
- PROJ-HARNESS real PostgreSQL schema group examples > PROJ-HARNESS-17 placement companies, relationships and drives enforce keys and lifecycle

  ```
  Error: PROJ-HARNESS: expected SQLSTATE 23514 but operation succeeded
  ❯ tests/integration/support/projects-placements-pg-harness.ts:165:30
  163|             }
  164|           }
  165|           if (!failed) throw new Error("PROJ-HARNESS: expected SQLSTAT…
  |                              ^
  166|         }, true);
  167|       },
  ```

## tests/integration/tpo-my-notifications-service.test.ts (1 failing)
- TPO my notifications against PostgreSQL > reads own notifications and preferences

  ```
  AuthorizationError: Missing permission: placements.manage
  ❯ src/modules/placements/tpo-my-notifications-service.ts:226:13
  224|     });
  225|     if(!hasMembershipRole(persisted,"TPO"))
  226|       throw new AuthorizationError("placements.manage");
  |             ^
  227|   });
  228|
  ```
