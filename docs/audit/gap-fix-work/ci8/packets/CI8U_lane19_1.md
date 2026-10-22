# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-kit-role-and-overlay-chat17.test.tsx (1 failing)
- UX-kit-HARDEN-23 authorization boundaries and WebView history > UX-kit-HARDEN-32 external evidence rejects backslash, trailing whitespace and embedded controls

  ```
  AssertionError: expected '<span class="inline-flex min-w-0 flex…' to contain 'target="_blank"'
  Expected: "target="_blank""
  Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.test/proof%20one" rel="noopener noreferrer" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border
  ```

## tests/unit/chat12-tpo-student-marks-export-truth.test.ts (2 failing)
- TPO-students-export-TRUTH-02 marks-verification evidence provenance > exports missing marks-verification as empty rather than falsely claiming No

  ```
  AssertionError: expected '"Not recorded"' to be '""' // Object.is equality
  Expected: """"
  Received: ""Not recorded""
  ```
- TPO-students-export-TRUTH-02 marks-verification evidence provenance > retains explicit persisted Yes and No outcomes without inferring them from grades

  ```
  AssertionError: expected '"Verified"' to be '"Yes"' // Object.is equality
  Expected: ""Yes""
  Received: ""Verified""
  ```
