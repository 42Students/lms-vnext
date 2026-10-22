# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
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

## tests/integration/placements-loi-kind.test.ts (2 failing)
- placement offer kind (letter of intent) > records an LOI distinctly, defaults to OFFER, stays idempotent per kind and notifies the learner

  ```
  
  ```
- placement offer kind (letter of intent) > defaults an omitted kind to OFFER, rejects unknown kinds and foreign colleges

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-loi-kind.test.ts:70:31
  68|
  69| async function cleanup() {
  70|   for (const table of TABLES) await pool.query("delete from " + table);
  |                               ^
  71| }
  ```

## tests/integration/projects-p4-members.test.ts (1 failing)
- Projects P4 team and mentor membership > lists only eligible same-college candidates and excludes active teammates

  ```
  AssertionError: expected [ { …(3) }, { …(3) } ] to deeply equal [ ObjectContaining{…} ]
  - Expected
  + Received
  [
  {
  +     "displayName": "Adversarial Outsider",
  +     "email": null,
  +     "membershipId": "76000000-0000-4000-8000-000000000002",
  ```

## tests/integration/super-admin-feature-mobile-card.test.ts (1 failing)
- Super Admin feature controls mobile card facts (PG) > reads in-test college only in authorized scope, excludes foreign scope and denies wrong role

  ```
  AssertionError: expected [ { module: 'projects', …(7) }, …(1) ] to have a length of 3 but got 2
  - Expected
  + Received
  - 3
  + 2
  ```
