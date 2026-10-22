# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-support-cancel.test.ts (2 failing)
- learner pending request cancellation, own isolated audit > cancels once with recorded status/audit and denies stale replay

  ```
  
  ```
- learner pending request cancellation, own isolated audit > denies foreign college, suspended and wrong-role cancellation

  ```
  error: null value in column "learner_membership_id" of relation "placement_learner_requests" violates not-null constraint
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/learner-support-cancel.test.ts:17:3
  15|   f=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarF…
  16|   requestId=randomUUID();
  17|   await pool.query("INSERT INTO placement_learner_requests(id,applicat…
  |   ^
  18|     [requestId,f.applicationId,"APPLICATION_WITHDRAWAL:"+f.application…
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
