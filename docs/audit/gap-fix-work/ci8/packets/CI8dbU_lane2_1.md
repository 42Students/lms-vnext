# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat4-college-faculty-schedule-reassignment.test.ts (1 failing)
- College faculty schedule reassignment (disposable PostgreSQL) > COL-faculty-reassign-RACE-01 concurrent old faculty cannot create overlapping replacements

  ```
  error: conflicting key value violates exclusion constraint "section_schedule_events_section_no_overlap_excl"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat4-college-faculty-schedule-reassignment.test.ts:101:3
  99|    "select section_id,starts_at,ends_at from section_schedule_events w…
  100|   const current=row.rows[0]!;
  101|   await pool!.query("insert into section_schedule_events(id,section_id…
  |   ^
  102|    [ids.otherSession,current.section_id,ids.otherOld,tag+"-parallel",c…
  ```
