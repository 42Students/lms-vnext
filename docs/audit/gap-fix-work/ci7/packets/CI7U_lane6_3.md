# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-college-placements-round3-ui.test.ts (1 failing)
- College Admin drive UI and graceful failure > COL-placements-25 renders selectable action-capable mobile application and drive cards

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:table-row'
  - Expected
  + Received
  - sm:table-row
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```

## tests/unit/chat7-college-assessment-export-service-weak.test.ts (3 failing)
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
  AssertionError: expected "vi.fn()" to be called 40 times, but got 41 times
  ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:63:24
  61|   expect(out.truncated).toBe(true);
  62|   expect(out.cap).toBe(1000);
  63|   expect(state.reader).toHaveBeenCalledTimes(40);
  |                        ^
  64|   expect(out.csv).toContain("EXPORT TRUNCATED");
  65|   expect(out.csv).toContain("Only the first 1000 matching records");
  ```
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and never fetches page 41

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:56:51
  54|  it("cannot silently export more than 1000 rows, labels truncated set …
  55|   state.reader.mockImplementation(async (_ctx,_kind,query)=>({
  56|    items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
  |                                                   ^
  57|    total:1001,totalPages:41,
  58|   }));
  ```

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

## tests/unit/chat9-super-admin-organizations-copy.test.ts (1 failing)
- Super Admin Organizations exact dev-legacy copy > retains exact legacy create control and example

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'disabled={pending}'
  - Expected
  + Received
  - disabled={pending}
  + "use client";
  +
  + import { useState } from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
