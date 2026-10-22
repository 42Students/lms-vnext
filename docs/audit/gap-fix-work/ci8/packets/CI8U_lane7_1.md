# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-scoped-directory-states.test.tsx (2 failing)
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-105 optional summary failure keeps filtered primary records reachable

  ```
  AssertionError: expected 'Registered Students Scoped list Direc…' to contain '0 of 0 students'
  Expected: "0 of 0 students"
  Received: "Registered Students Scoped list Directory totals are temporarily unavailable. The filtered records below remain visible. Search Status Any status Active Suspended Ended Filter Filters Rows per page 0 matching records  · showing  0 – 0  · page  1  of  1"
  ```
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-106 legitimate empty list remains a distinct zero-state

  ```
  AssertionError: expected 4 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 4
  ```

## tests/unit/UX-tpo-drive-day-01.test.ts (1 failing)
- UX-tpo-drive-day-01 /tpo/drive-day > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'md:min-h-9'
  - Expected
  + Received
  - md:min-h-9
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```
