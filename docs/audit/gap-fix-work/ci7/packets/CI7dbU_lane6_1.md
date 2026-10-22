# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/core-admin-domains.test.ts (1 failing)
- core admin domains against PostgreSQL > persists the superadmin organization -> college -> department flow

  ```
  AssertionError: promise rejected "OrganizationServiceError: ORGANIZATION_HA… { …(2) }" instead of resolving
  ❯ tests/integration/core-admin-domains.test.ts:233:6
  231|         organization.id,
  232|       ),
  233|     ).resolves.toMatchObject({
  |      ^
  234|       id: organization.id,
  235|       status: "ARCHIVED",
  ```

## tests/integration/placements-loi-kind.test.ts (2 failing)
- placement offer kind (letter of intent) > records an LOI distinctly, defaults to OFFER, stays idempotent per kind and notifies the learner

  ```
  
  ```
- placement offer kind (letter of intent) > defaults an omitted kind to OFFER, rejects unknown kinds and foreign colleges

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-loi-kind.test.ts:71:31
  69|
  70| async function cleanup() {
  71|   for (const table of TABLES) await pool.query("delete from " + table);
  |                               ^
  72| }
  ```
