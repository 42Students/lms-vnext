# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-offer-extension-request.test.ts (1 failing)
- learner issued-offer expiry extension request on real PostgreSQL > rejects stale expiry and writes one audited own request without changing offer

  ```
  Error: Failed query: insert into "placement_learner_requests" ("id", "application_id", "request_type", "round_id", "offer_id", "scope_key", "reason", "effect_payload", "status", "requested_by_user_id", "requested_at", "decided_by_user_id", "decided_at", "decision_note", "updated_at") values (default
  params: a32f57fc-8d4f-4ca7-8c64-46391cc1fccf,OFFER_EXTENSION,,fe85aa25-61c8-415b-9e26-904acae0fc0b,OFFER_EXTENSION:a32f57fc-8d4f-4ca7-8c64-46391cc1fccf:fe85aa25-61c8-415b-9e26-904acae0fc0b,University exam overlaps deadline,{"requestedExpiresAt":"2030-11-04T00:00:00.000Z"},e8721b07-a22b-4ef4-bafe-e2a
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/placements-learner-journey.test.ts (1 failing)
- Learner placement journey > hides internal screening state while exposing confirmed learner-facing decisions and applied results

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

## tests/integration/super-admin-template-college-availability.test.ts (1 failing)
- Template college availability in PostgreSQL > retains in-test own assignment and hides it from foreign scoped college and wrong-role

  ```
  AssertionError: expected [ { …(7) } ] to have a length of +0 but got 1
  - Expected
  + Received
  - 0
  + 1
  ```
