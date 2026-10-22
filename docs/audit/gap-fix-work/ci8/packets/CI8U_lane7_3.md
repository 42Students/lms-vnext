# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-final-faculty-discussion.test.ts (1 failing)
- chat-5 final sprint: Faculty course discussions > FAC-courses-R06 preserves latest successfully fetched discussion messages and exposes retry on refresh failure even when posting permission is revoked

  ```
  AssertionError: expected 22618 to be less than 20378
  ❯ tests/unit/chat5-final-faculty-discussion.test.ts:30:41
  28|   expect(page).toContain("onClick={()=>void load(true)}>Retry</Button>…
  29|   expect(page).toContain("onClick={()=>void load(true)}");
  30|   expect(page.indexOf(staleBannerGate)).toBeLessThan(page.indexOf("{pi…
  |                                         ^
  31|   expect(page).toContain('reconcileLatestDiscussionPage(previous, inco…
  32|   expect(page).toContain('if (learnerDiscussionRefreshIsCurrent(refres…
  ```

## tests/unit/chat6-superadmin-middle-inbound-mail-26.test.tsx (1 failing)
- SA-middle-inbound-mail-26 private inbox role and partial states > does not query inbox data on duplicate selector keys or impossible pages

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'Invalid filters'
  Expected: "Invalid filters"
  Received: "<div class="min-w-0 space-y-4 md:space-y-6"><header class="space-y-2"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-hea
  ```
