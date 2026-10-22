# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/mentor-risk-readiness.test.ts (1 failing)
- Mentor exact-project risk and readiness drill-ins — PostgreSQL > uses registered status evidence with role, tenant and strict-query denial

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-risk-readiness.test.ts:37:7
  35|       "project_meetings","project_members","project_resources","projec…
  36|       "project_sprints","project_releases"]){
  37|       await pool.query("delete from "+table+" where project_id=any($1:…
  |       ^
  38|     }
  ```

## tests/integration/placements-role-options.test.ts (1 failing)
- Placement multi-role drives > keeps a primary compatibility role and binds each learner application to an exact role option

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

## tests/integration/super-admin-db10-broadcast.test.ts (1 failing)
- DB10 Super Admin announcement consent and transactional broadcast > publishes selected authorized colleges atomically with scoped Activity events

  ```
  AnnouncementError: STALE_AUDIENCE
  ❯ publishSuperAdminCollegeBroadcast src/modules/announcements/super-admin-college-broadcast-service.ts:83:9
  81|  if(!input.reviewedCollegeIds ||
  82|     !sameReviewedBroadcastAudience(input.reviewedCollegeIds,targets.ma…
  83|   throw new AnnouncementError("STALE_AUDIENCE");
  |         ^
  84|  if(input.audienceMode==="SELECTED_COLLEGES"&&targets.length!==request…
  85|  for(const target of targets){
  ```
