# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat19-hr-page-contracts.test.ts (1 failing)
- HR page-level access, recovery and mobile contracts > HR-XA-02 HR-XA-03 HR-XA-04 show recovery and readable back navigation after load failures

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import Link from "next/link";
  + import { cx } from "@/lib/class-names";
  + import { isSafeInternalHref } from "@/lib/safe-internal-href";
  +
  ```
