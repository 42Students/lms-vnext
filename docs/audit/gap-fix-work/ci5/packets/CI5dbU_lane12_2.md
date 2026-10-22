# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
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

## tests/integration/placements-p9-seasons.test.ts (1 failing)
- Placement P9 seasons > binds new drives to the active season and keeps historical seasons read-only

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

## tests/integration/storage-files-projects-db.test.ts (6 failing)
- project resource files against PostgreSQL > hides in-flight and failed files from learners but shows them to mentors

  ```
  
  ```
- project resource files against PostgreSQL > updates details, soft deletes and stops serving the file

  ```
  
  ```
- project resource files against PostgreSQL > links a file to an active project resource and rejects foreign resources

  ```
  
  ```
- project resource files against PostgreSQL > blocks uploads to archived projects, honours limits and requires an uploader membership

  ```
  
  ```
- project resource files against PostgreSQL > does not serve a file whose object was replaced after verification

  ```
  
  ```
- database guarantees for project resource files > rejects college and project mismatches through composite foreign keys

  ```
  error: update or delete on table "project_instances" violates foreign key constraint "project_resource_audit_project_id_fkey" on table "project_resource_audit"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/storage-files-projects-db.test.ts:74:3
  72|   await pool.query(`delete from project_sprints where project_id in ($…
  73|   await pool.query(`delete from project_releases where project_id in (…
  74|   await pool.query(`delete from project_instances where slug like '${S…
  |   ^
  75|   await pool.query(`delete from project_template_college_assignments w…
  ```
