# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-admin-cross-chat-12-touch-contrast.test.ts (1 failing)
- UX-admin first third delegated touch and contrast audits > src/components/academics/academics-section-page.tsx

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to match /(?:^|[\\s"\'])\b(?:min-h-11|h-11)\b/
  - Expected:
  /(?:^|[\\s"\'])\b(?:min-h-11|h-11)\b/
  + Received:
  "import Link from \"next/link\";
  import { cx } from \"@/lib/class-names\";
  import { isSafeInternalHref } from \"@/lib/safe-internal-href\";
  export type PageBackLinkProps = {
  ```
