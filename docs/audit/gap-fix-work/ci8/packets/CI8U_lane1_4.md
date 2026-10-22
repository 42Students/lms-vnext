# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts (3 failing)
- Super Admin assessment export service scoped pagination > SA-academics-people-64 passes the acting session and selected assignment filters to the authorized reader

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-65 never drops quiz results filters as later pages are read

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:55:21
  53|  it("SA-academics-people-65 never drops quiz results filters as later …
  54|   state.reader.mockImplementation(async (_context,_kind,query)=>{
  55|    const page=query.page as number;
  |                     ^
  56|    return {items:[row(page)],total:2,totalPages:2};
  57|   });
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-64 hard caps CSV at 500 rows and explicitly marks omitted records

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:72:51
  70|  it("SA-academics-people-64 hard caps CSV at 500 rows and explicitly m…
  71|   state.reader.mockImplementation(async (_context,_kind,query)=>({
  72|    items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
  |                                                   ^
  73|    total:501,totalPages:21,
  74|   }));
  ```

## tests/unit/learner-placement-parity.test.ts (1 failing)
- learner placement route parity > keeps every old learner placement sub-route materialized with real content

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'LearnerCareerCalendar'
  - Expected
  + Received
  - LearnerCareerCalendar
  + import { redirect } from "next/navigation";
  + import { z } from "zod";
  + import { parseLearnerCareerDate } from "@/modules/placements/learner-career-date-model";
  +
  ```
