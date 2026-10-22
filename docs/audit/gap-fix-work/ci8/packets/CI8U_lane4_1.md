# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat14-sprint-task-routes.test.ts (1 failing)
- Sprint and task mutating routes under Mentor account > PROJ-BREAK-MENTOR-344 malformed Sprint/task editor JSON cannot invoke a write

  ```
  AssertionError: expected 403 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 403
  ```

## tests/unit/UX-superadmin-import-tables-chat17.test.ts (1 failing)
- UX-UNOWNED-TABLE-07/08 Super Admin import surfaces > student import history uses the shared mobile DataTable with intact four legacy headings

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'No import history found.'
  - Expected
  + Received
  - No import history found.
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
