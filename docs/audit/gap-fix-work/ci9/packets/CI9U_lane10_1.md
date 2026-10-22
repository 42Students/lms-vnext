# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-kit-projects-hardening-chat17.test.tsx (1 failing)
- UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states > UX-kit-HARDEN-02 Input/Select/Textarea expose 16px input, invalid state and 44px target

  ```
  AssertionError: expected '<textarea data-slot="textarea" aria-i…' to contain 'min-h-'
  Expected: "min-h-"
  Received: "<textarea data-slot="textarea" aria-invalid="true" id="reason" class="[min-height:112px] w-full min-w-0 resize-y disabled:resize-none font-[inherit] scroll-mt-3 rounded-[var(--lms-field-radius)] border-0 bg-[var(--lms-form-bg)] px-[10px] py-[15px] text-[var(--lms-font-base)] font-normal l
  ```
