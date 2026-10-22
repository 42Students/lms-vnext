# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-offer-decision-write.test.ts (2 failing)
- own learner offer responses on isolated PostgreSQL > records ACCEPT exactly once, with immutable audit and stale-state denial

  ```
  ZodError: [
  {
  "code": "unrecognized_keys",
  "keys": [
  "metadata"
  ],
  "path": [],
  "message": "Unrecognized key: \"metadata\""
  ```
- own learner offer responses on isolated PostgreSQL > records DECLINE exactly once, with immutable audit and stale-state denial

  ```
  ZodError: [
  {
  "code": "unrecognized_keys",
  "keys": [
  "metadata"
  ],
  "path": [],
  "message": "Unrecognized key: \"metadata\""
  ```

## tests/integration/placements-evaluation-config.test.ts (4 failing)
- Placement evaluation configuration > creates, reorders and retries a stable round plan without duplicate audit noise

  ```
  
  ```
- Placement evaluation configuration > retires removed draft rounds instead of destroying their audit history

  ```
  
  ```
- Placement evaluation configuration > locks the evaluation plan as soon as round execution starts

  ```
  
  ```
- Placement evaluation configuration > keeps evaluation configuration tenant-scoped

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-evaluation-config.test.ts:91:3
  89|     "delete from placement_application_status_history",
  90|   );
  91|   await pool.query(
  |   ^
  92|     "delete from placement_applications",
  ```

## tests/integration/projects-adversarial.test.ts (11 failing)
- Projects adversarial isolation > reassigns the primary mentor atomically and rechecks the target role

  ```
  ProjectsServiceError: PROJECT_MEETING_INVALID_STATE
  ❯ scheduleProjectMeeting src/modules/projects/meeting-service.ts:370:11
  368|   const endsAt = new Date(input.endsAt);
  369|   if (!isFutureProjectMeetingWindow(startsAt, endsAt, Date.now())) {
  370|     throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  |           ^
  371|   }
  372|   const links = await validateMeetingLinks(scope.project.id,input.link…
  ```
- Projects adversarial isolation > rejects valid IDs borrowed from a different project

  ```
  AssertionError: expected ProjectsServiceError: PROJECT_MEETING_INV… { code: '…' } to match object { Object (code) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PROJECT_MEETING_LINK_INVALID",
  + ProjectsServiceError {
  +   "code": "PROJECT_MEETING_INVALID_STATE",
  ```
- Projects adversarial isolation > prevents learners from escalating into lifecycle, resource, review or evaluation actions

  ```
  
  ```
- Projects adversarial isolation > keeps final review bound to the exact project submission

  ```
  
  ```
- Projects adversarial isolation > does not let unsafe URL schemes cross submission or resource validation boundaries

  ```
  
  ```
- Projects adversarial isolation > keeps stale task state from bypassing submission review gates

  ```
  
  ```
- Projects adversarial isolation > serializes concurrent resource sequence allocation

  ```
  
  ```
- Projects adversarial isolation > allows only one concurrent task submission to win

  ```
  
  ```
- Projects adversarial isolation > serializes final delivery draft and evaluation creation

  ```
  
  ```
- Projects adversarial isolation > does not flag a project stalled when nested project activity is recent

  ```
  
  ```
- … 1 more in this file

## tests/integration/super-admin-faculty-read.test.ts (1 failing)
- Super Admin faculty read PostgreSQL > uses in-test faculty membership and hides foreign college/wrong role

  ```
  AssertionError: expected [ 'Department: -', …(19) ] to include 'Email: private-623a649e@example.test'
  ❯ tests/integration/super-admin-faculty-read.test.ts:25:33
  23|   const own=await listAdminScopedPeople(admin,"FACULTY",{q:code});
  24|   expect(own.items).toEqual([expect.objectContaining({id:row.rows[0]!.…
  25|   expect(own.items[0]!.details).toContain("Email: private-"+code+"@exa…
  |                                 ^
  26|   const foreign={...admin,adminScope:{organizationId:SEED_IDS.organiza…
  27|   expect((await listAdminScopedPeople(foreign,"FACULTY",{q:code})).ite…
  ```
