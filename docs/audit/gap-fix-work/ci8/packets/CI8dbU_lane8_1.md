# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/faculty-contacts-students-acceptance.test.ts (1 failing)
- Faculty Students Contacts registered PostgreSQL acceptance > searches public fields, caps page size, and never searches private login email

  ```
  AssertionError: expected undefined to be defined
  ❯ tests/integration/faculty-contacts-students-acceptance.test.ts:52:21
  50|     const listed=await listFacultyContacts(faculty,{tab:"LEARNER",sear…
  51|     const student=listed.items.find(x=>x.membershipId===SEED_IDS.learn…
  52|     expect(student).toBeDefined();
  |                     ^
  53|     if(student!.displayName?.trim()){
  54|       const searched=await listFacultyContacts(faculty,{
  ```
