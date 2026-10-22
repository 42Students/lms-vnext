# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-offer-extension-request.test.ts (1 failing)
- learner issued-offer expiry extension request on real PostgreSQL > rejects stale expiry and writes one audited own request without changing offer

  ```
  Error: Failed query: insert into "placement_learner_requests" ("id", "application_id", "request_type", "round_id", "offer_id", "scope_key", "reason", "effect_payload", "status", "requested_by_user_id", "requested_at", "decided_by_user_id", "decided_at", "decision_note", "updated_at") values (default
  params: b4b0b3ba-7d97-48d8-bfe8-0694d684590a,OFFER_EXTENSION,,0f26d34f-f39d-4040-bc29-7ead685d4bcd,OFFER_EXTENSION:b4b0b3ba-7d97-48d8-bfe8-0694d684590a:0f26d34f-f39d-4040-bc29-7ead685d4bcd,University exam overlaps deadline,{"requestedExpiresAt":"2030-11-04T00:00:00.000Z"},0952da40-e34b-44d3-b8b8-de1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/placements-learner-job-feed.test.ts (5 failing)
- Learner placement job feed > shows only published jobs in the learner's active college and carries application state

  ```
  
  ```
- Learner placement job feed > rejects non-learners instead of exposing the learner feed as a generic college read

  ```
  
  ```
- Learner placement job feed > denies feed and new applications when the college has not bought Placements

  ```
  
  ```
- Learner placement job feed > denies feed and new applications for an explicitly ineligible learner even when a job would otherwise admit them

  ```
  
  ```
- Learner placement job feed > denies forged learner membership context even if its role and placement choice look valid

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-learner-job-feed.test.ts:112:3
  110|     "delete from placement_application_status_history",
  111|   );
  112|   await pool.query(
  |   ^
  113|     "delete from placement_applications",
  ```

## tests/integration/projects-p2-templates.test.ts (1 failing)
- Projects P2 template persistence > advances active college assignments when a revised template is republished

  ```
  AssertionError: expected [ { …(9) }, { …(9) }, { …(9) }, …(2) ] to deeply equal [ ObjectContaining{…} ]
  - Expected
  + Received
  [
  {
  +     "assignedAt": 2026-10-22T05:37:02.186Z,
  +     "assignmentId": "9c793e53-7021-48f4-978e-093870f8aba0",
  +     "blueprint": {
  ```

## tests/integration/super-admin-feature-detail-mobile.test.ts (1 failing)
- Super Admin module detail cards PostgreSQL boundary > reads own in-test college, excludes foreign scope, rejects wrong role

  ```
  AssertionError: expected [ { module: 'projects', …(5) }, …(1) ] to have a length of 3 but got 2
  - Expected
  + Received
  - 3
  + 2
  ```
