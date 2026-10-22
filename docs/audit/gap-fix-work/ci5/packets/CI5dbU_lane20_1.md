# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-dashboard-cards-scope.test.ts (2 failing)
- College dashboard cards registered PG > uses actual own-college persisted counts and fixed deep links

  ```
  Error: SETUP_COUNT_UNAVAILABLE:academic-periods
  ❯ src/modules/admin-ui/college-setup-checklist-model.ts:39:15
  37|       const count = counts[step.key];
  38|       if (count === undefined || !Number.isSafeInteger(count) || count…
  39|         throw new Error("SETUP_COUNT_UNAVAILABLE:" + step.key);
  |               ^
  40|       return {
  41|         key: step.key,
  ```
- College dashboard cards registered PG > uses different scoped counts for another college without leaking fixture

  ```
  Error: SETUP_COUNT_UNAVAILABLE:academic-periods
  ❯ src/modules/admin-ui/college-setup-checklist-model.ts:39:15
  37|       const count = counts[step.key];
  38|       if (count === undefined || !Number.isSafeInteger(count) || count…
  39|         throw new Error("SETUP_COUNT_UNAVAILABLE:" + step.key);
  |               ^
  40|       return {
  41|         key: step.key,
  ```

## tests/integration/db01-tenant-routing-lifecycle.test.ts (1 failing)
- DB01 tenant host lifecycle — real repository SQL > stops routing immediately after the owning admin removes a hostname

  ```
  Error: Failed query: select "platform_status" from "users" where "users"."id" = $1 limit $2 for share
  params: isolated-test-superadmin,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-job-activity.test.ts (1 failing)
- HR job activity PG scopes > reads own job publication but denies foreign employer and wrong role

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
