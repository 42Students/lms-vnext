# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx (1 failing)
- UX-SPILL-TPO-CLIP-02: request mobile cards retain selection and full fields > keeps sorting, chooser and reset controls keyboard-focusable and 44px tall

  ```
  AssertionError: expected '<section aria-label="Request row tool…' to match /<summary[^>]*min-h-11[^>]*>Choose col…/
  - Expected:
  /<summary[^>]*min-h-11[^>]*>Choose columns/
  + Received:
  "<section aria-label=\"Request row tools\" class=\"space-y-2 border-y border-[var(--lms-canvas-border)] py-3\"><p class=\"text-sm font-semibold\">Select and copy request rows</p><p role=\"status\" aria-live=\"polite\" class=\"text-xs\">0 selected of 1 on this page.</p><div class=\"flex flex-wrap gap
  ```
