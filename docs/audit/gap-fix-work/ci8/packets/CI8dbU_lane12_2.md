# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/super-admin-faculty-assignments-read.test.ts (1 failing)
- Super Admin faculty assignment PostgreSQL > resolves only selected-college teaching assignments and denies wrong role

  ```
  RangeError: Invalid time value
  ❯ format src/modules/admin-ui/super-admin-faculty-assignments-service.ts:141:107
  139|   .orderBy(desc(sql<string>`"admin_faculty_assignment_directory"."admi…
  140|   .limit(query.pageSize).offset((page-1)*query.pageSize);
  141|  const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle…
  |                                                                                                           ^
  142|  return {query:{...query,page},total,totalPages,
  143|   rangeStart:total===0?0:(page-1)*query.pageSize+1,
  ```
