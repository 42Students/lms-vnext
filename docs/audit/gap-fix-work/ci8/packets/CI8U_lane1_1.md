# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-notifications-page.test.ts (1 failing)
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > valid scoped query is passed unchanged to service and empty message is explicit

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/UX-kit-states-chat17.test.tsx (1 failing)
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-STATES-14 HTTPS links display fallback; script, HTTP and credential-bearing URLs never link

  ```
  AssertionError: expected '<span class="inline-flex min-w-0 flex…' to contain 'target="_blank"'
  Expected: "target="_blank""
  Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.test/meet" rel="noopener noreferrer" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-w
  ```
