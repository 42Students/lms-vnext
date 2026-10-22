# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/mentor-calendar-filters.test.ts (1 failing)
- Mentor global calendar filters — migrated PostgreSQL > shows current same-college meetings, literal search and denied actors

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-calendar-filters.test.ts:43:7
  41|       "project_meetings","project_members","project_resources","projec…
  42|       "project_sprints","project_releases"]){
  43|       await pool.query("delete from "+table+" where project_id=any($1:…
  |       ^
  44|     }
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

## tests/integration/projects-placements-pg-harness-placements.test.ts (1 failing)
- PROJ-HARNESS-PLACEMENTS canonical real PostgreSQL fixtures > PROJ-HARNESS-RECRUITER-22 company-bound verified recruiter grant is not a college membership

  ```
  error: syntax error at or near "grant"
  ❯ node_modules/pg/lib/client.js:694:17
  ❯ Object.query tests/integration/support/projects-placements-pg-harness.ts:139:17
  137|       client, runId: randomUUID(),
  138|       async query<T extends QueryResultRow>(sql: string, values?: unkn…
  139|         return (await client.query<T>(sql, values)).rows;
  |                 ^
  140|       },
  ```

## tests/integration/tpo-no-show-history-denials.test.ts (1 failing)
- TPO learner history and no-show PostgreSQL boundaries > returns no learner history for unknown and cross-college membership

  ```
  AssertionError: promise rejected "AuthorizationError: Missing permission: p…" instead of resolving
  ❯ tests/integration/tpo-no-show-history-denials.test.ts:60:8
  58|     await expect(getTpoStudentPlacementHistory(foreign, {
  59|       membershipId: SEED_IDS.learnerCollegeAMembership,
  60|     })).resolves.toBeNull();
  |        ^
  61|   });
  62|
  ```
