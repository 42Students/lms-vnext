# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-interview-withdrawal-request.test.ts (1 failing)
- own interview application withdrawal request > records pending audited request without withdrawing application or closing round

  ```
  Error: Failed query: insert into "placement_learner_requests" ("id", "application_id", "request_type", "round_id", "offer_id", "scope_key", "reason", "effect_payload", "status", "requested_by_user_id", "requested_at", "decided_by_user_id", "decided_at", "decision_note", "updated_at") values (default
  params: 4a48ecf3-690c-475e-9df4-a292f6d8512a,APPLICATION_WITHDRAWAL,,,APPLICATION_WITHDRAWAL:4a48ecf3-690c-475e-9df4-a292f6d8512a,Exam conflict,{},c3f81e05-112d-4d3a-9904-d8c73073daa7,2026-10-22T05:40:51.806Z
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/placements-draft-edit.test.ts (2 failing)
- Placement draft edit reads > returns normalized policy values for the tenant-scoped draft editor

  ```
  
  ```
- Placement draft edit reads > denies cross-college draft and policy reads

  ```
  error: update or delete on table "placement_jobs" violates foreign key constraint "placement_applications_job_id_placement_jobs_id_fk" on table "placement_applications"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-draft-edit.test.ts:73:3
  71|     "delete from placement_job_eligibility_policies",
  72|   );
  73|   await pool.query("delete from placement_jobs");
  |   ^
  74|   await pool.query(
  ```

## tests/integration/placements-w04-coordinator-days.test.ts (6 failing)
- W04 coordinator same-day / tenant authorization > limits listing and roster to the assigned day's actual rounds

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
- W04 coordinator same-day / tenant authorization > revokes roster access immediately when assignment is removed

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
- W04 coordinator same-day / tenant authorization > does not treat a forged authenticated user as the assigned learner

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
- W04 coordinator same-day / tenant authorization > keeps cross-college managers out while preserving an authorized TPO's historical round view

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
- W04 coordinator same-day / tenant authorization > rejects adding an existing applicant as a Drive Day coordinator

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
- W04 coordinator same-day / tenant authorization > serializes application versus coordinator assignment so neither role can coexist

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
