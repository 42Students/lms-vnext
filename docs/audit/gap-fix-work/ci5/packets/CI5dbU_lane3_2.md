# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-profile-sections-write.test.ts (1 failing)
- own education skills projects jsonb_set PATCH on fresh PostgreSQL > denies stale contact edits and audits without storing phone/email in events

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

## tests/integration/placements-p1-companies.test.ts (2 failing)
- Placements P1 companies and employer relationships > keeps placement management role-aware and cross-college closed

  ```
  AssertionError: expected ZodError: [
  {
  "code": "custom",
  … { …(2) } to be an instance of AuthorizationError
  ```
- Placements P1 companies and employer relationships > supports tenant-private trust and owner state without mutating canonical identity

  ```
  AssertionError: promise resolved "{ company: { …(19) }, …(4) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "alreadyLinked": false,
  +   "company": {
  ```

## tests/integration/projects-p6b-final-evaluation.test.ts (4 failing)
- Projects P6B final delivery and evaluation > PROJ-BREAK-submissions-10 supports draft editing, gates readiness and enforces exact saved revision

  ```
  ProjectsServiceError: PROJECT_RELEASE_INVALID_STATE
  ❯ shipProjectRelease src/modules/projects/lifecycle-service.ts:754:47
  752|     );
  753|   const expected=projectReleaseVersionInputSchema.parse(rawInput).expe…
  754|   if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError…
  |                                               ^
  755|   const releaseId =
  756|     projectReleaseIdSchema.parse(releaseIdInput);
  ```
- Projects P6B final delivery and evaluation > keeps immutable review history across final submission versions

  ```
  ProjectsServiceError: PROJECT_RELEASE_INVALID_STATE
  ❯ shipProjectRelease src/modules/projects/lifecycle-service.ts:754:47
  752|     );
  753|   const expected=projectReleaseVersionInputSchema.parse(rawInput).expe…
  754|   if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError…
  |                                               ^
  755|   const releaseId =
  756|     projectReleaseIdSchema.parse(releaseIdInput);
  ```
- Projects P6B final delivery and evaluation > locks approved delivery, audits mentor reopen, then permits exactly one new draft version

  ```
  ProjectsServiceError: PROJECT_RELEASE_INVALID_STATE
  ❯ shipProjectRelease src/modules/projects/lifecycle-service.ts:754:47
  752|     );
  753|   const expected=projectReleaseVersionInputSchema.parse(rawInput).expe…
  754|   if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError…
  |                                               ^
  755|   const releaseId =
  756|     projectReleaseIdSchema.parse(releaseIdInput);
  ```
- Projects P6B final delivery and evaluation > creates one rubric evaluation only for an approved submission and exposes it to participants

  ```
  ProjectsServiceError: PROJECT_RELEASE_INVALID_STATE
  ❯ shipProjectRelease src/modules/projects/lifecycle-service.ts:754:47
  752|     );
  753|   const expected=projectReleaseVersionInputSchema.parse(rawInput).expe…
  754|   if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError…
  |                                               ^
  755|   const releaseId =
  756|     projectReleaseIdSchema.parse(releaseIdInput);
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
