# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat7-mentor-meeting-facilitation.test.ts (3 failing)
- MEN-projects-meetings-27 persisted facilitator lifecycle > MEN-projects-meetings-27 keeps saved and cancelled private drafts hidden from learners

  ```
  AssertionError: expected 1 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 1
  ```
- MEN-projects-meetings-27 persisted facilitator lifecycle > MEN-projects-meetings-27 keeps saved and cancelled private drafts hidden from learners

  ```
  
  ```
- MEN-projects-meetings-27 persisted facilitator lifecycle > MEN-projects-meetings-27 persists facilitator notes without leaking them into learner workspace

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/chat7-mentor-meeting-facilitation.test.ts:47:4
  45|    "project_meetings","project_members","project_resources","project_t…
  46|    "project_sprints","project_releases"]){
  47|    await pool.query("delete from "+table+" where project_id=any($1::uu…
  |    ^
  48|   }
  ```

## tests/integration/courses-c3-progress.test.ts (2 failing)
- courses C3 learner progress against PostgreSQL > keeps media progress monotonic and completes only from authored duration

  ```
  AssertionError: expected 20 to be 50 // Object.is equality
  - Expected
  + Received
  - 50
  + 20
  ```
- courses C3 learner progress against PostgreSQL > keeps scheduled content locked and Course discussions isolated to the learner's delivery

  ```
  AssertionError: expected { …(14) } to match object { availability: 'SCHEDULED', …(2) }
  (21 matching properties omitted from actual)
  - Expected
  + Received
  {
  "availability": "SCHEDULED",
  -   "externalUrl": null,
  +   "externalUrl": "https://meet.example.com/c3-future",
  ```

## tests/integration/hr-drive-list-structured-filters.test.ts (1 failing)
- HR drive structured filter PG > filters a new own-company job but excludes other company/college and wrong role

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
