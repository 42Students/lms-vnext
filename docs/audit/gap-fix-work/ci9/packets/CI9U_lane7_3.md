# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-final-fac-courses-28.test.ts (1 failing)
- FAC-courses-28 roster parity with secure image fallback > FAC-courses-28 makes a keyboard-operable, namespaced avatar preview and always-visible result count

  ```
  AssertionError: expected '"use client";\n\nimport { useMemo, us…' to contain 'No photo is available for this studen…'
  - Expected
  + Received
  - No photo is available for this student.
  + "use client";
  +
  + import { useMemo, useState } from "react";
  + import Link from "next/link";
  ```
