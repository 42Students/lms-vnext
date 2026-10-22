# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat4-college-student-placement-tenant.test.ts (1 failing)
- College Admin class placement tenant and actor guard (PostgreSQL)

  ```
  error: inconsistent types deduced for parameter $3
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat4-college-student-placement-tenant.test.ts:43:3
  41|    await pool.query("insert into membership_roles(membership_id,role) …
  42|   }
  43|   await pool.query("insert into academic_periods(id,college_id,name,co…
  |   ^
  44|    [ids.period,SEED_IDS.collegeA,tag]);
  ```

## tests/integration/core-platform-acceptance.test.ts (1 failing)
- core platform pre-browser acceptance flow > runs the tenant, people, role, membership and isolation story against PostgreSQL

  ```
  AssertionError: expected [ { …(14) } ] to deeply equal [ ObjectContaining{…} ]
  - Expected
  + Received
  [
  {
  -     "code": "ACCEPT-CORE",
  +     "addressLine1": null,
  +     "addressLine2": null,
  ```

## tests/integration/hr-company-report-outcomes.test.ts (1 failing)
- HR report result privacy > never returns report data for wrong role or a recruiter without company grants

  ```
  AuthorizationError: Missing permission: placements.recruiter.read
  ❯ resolveRecruiterCompanyScope src/modules/placements/recruiter-company-team-service.ts:63:11
  61|   if (!hasActiveRecruiter(context) || !context.recruiter ||
  62|       context.recruiter.userId !== context.user.id) {
  63|     throw new AuthorizationError("placements.recruiter.read");
  |           ^
  64|   }
  65|   const choices = context.recruiter.grants;
  ```

## tests/integration/learner-attendance-calendar.test.ts (1 failing)
- Learner attendance month calendar against disposable PostgreSQL > distinguishes future scheduled, missing months and a status filter

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
