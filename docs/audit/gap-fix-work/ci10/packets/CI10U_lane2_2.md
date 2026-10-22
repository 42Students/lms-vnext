# CI unit-test packet (round 10)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-college-assessment-export-service-weak.test.ts (2 failing)
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns quoted spreadsheet and bounded pagination

  ```
  AssertionError: expected undefined to be 'QUIZ' // Object.is equality
  - Expected:
  "QUIZ"
  + Received:
  undefined
  ```
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and never fetches page 41

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:57:77
  55|  it("cannot silently export more than 1000 rows, labels truncated set …
  56|   state.reader.mockImplementation(async (_ctx,_kind,query)=>({
  57|    items:Array.from({length:COLLEGE_ASSESSMENT_PAGE_SIZE},(_,i)=>row((…
  |                                                                             ^
  58|    total:1001,totalPages:Math.ceil(1001/COLLEGE_ASSESSMENT_PAGE_SIZE),
  59|   }));
  ```
