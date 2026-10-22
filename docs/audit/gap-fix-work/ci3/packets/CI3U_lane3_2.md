# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-contact-edit.test.ts (1 failing)
- Learner contact-only PATCH succeeds and denies in PostgreSQL > persists validated contacts, preserves other sections and audits without PII

  ```
  PeopleServiceError: ALTERNATE_PHONE_PRIMARY_REQUIRED
  ❯ src/modules/people/learner-contact-service.ts:68:29
  66|     const alternateIssue=validateLearnerAlternatePhoneAgainstPrimary(
  67|       input.contacts.alternatePhone,user.phoneE164);
  68|     if(alternateIssue)throw new PeopleServiceError(alternateIssue);
  |                             ^
  69|     // One locked profile row prevents same-contact lost updates while…
  70|     // allowing unrelated profile sections to merge through jsonb_set.
  ```

## tests/integration/mentor-task-details-update.test.ts (1 failing)
- Mentor task details PATCH: fresh PostgreSQL success, audit and denial > updates registered fields exactly once and rejects stale, forged and foreign inputs

  ```
  AssertionError: expected { …(4) } to match object { …(3) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  @@ -5,10 +5,11 @@
  "changedFields": [
  "title",
  "description",
  ```

## tests/integration/placements-tpo-operations.test.ts (2 failing)
- Placement TPO operations > prioritizes cross-job work into one deterministic queue

  ```
  
  ```
- Placement TPO operations > keeps the TPO operations center tenant-scoped

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-tpo-operations.test.ts:119:3
  117|     "delete from placement_application_status_history",
  118|   );
  119|   await pool.query(
  |   ^
  120|     "delete from placement_applications",
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
