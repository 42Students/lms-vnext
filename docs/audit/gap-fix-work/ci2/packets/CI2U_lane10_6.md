# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-first-third-skin.test.ts (1 failing)
- chat-13 Super Admin first third NORTH STAR manual skin drift > TOPBAR-SA-SKIN-01 checks all 37 documented first-third route sources for dark primary-button text and literal palette colors

  ```
  AssertionError: expected 'src/app/(authenticated)/admin/hr/page…' to contain '/admin/features/[collegeId]/trace/pag…'
  Expected: "/admin/features/[collegeId]/trace/page.tsx"
  Received: "src/app/(authenticated)/admin/hr/page.tsx"
  ```

## tests/unit/chat13-superadmin-needs-attention.test.ts (1 failing)
- Super Admin placement operational attention > GR-38 attention thresholds are bounded positive days

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  desc,\n  …' to contain 'Math.max(1,Math.min(90,staleApplicati…'
  - Expected
  + Received
  - Math.max(1,Math.min(90,staleApplicationDays))
  + import {
  +   and,
  +   asc,
  +   desc,
  ```

## tests/unit/chat15-final-sprint-superadmin-projects.test.ts (1 failing)
- Super Admin project gap final-sprint acceptance > SA-placements-projects-91 routes admin task writes through authorized API handlers, not client-side status guesses

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'canAdminSettleDelivery(status,locked,…'
  - Expected
  + Received
  - canAdminSettleDelivery(status,locked,projectStatus,action)
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Banner } from "@/components/ui/banner";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```

## tests/unit/chat16-campaign-unsubscribe-post-route-16.test.ts (4 failing)
- chat-16 explicit public campaign suppression API response and side effects > campaign-unsubscribe-route-17 rejects absent, unsigned and huge tokens without falsely confirming removal

  ```
  AssertionError: expected [ 303, 303, 303 ] to deeply equal [ 400, 400, 400 ]
  - Expected
  + Received
  [
  -   400,
  -   400,
  -   400,
  +   303,
  ```
- chat-16 explicit public campaign suppression API response and side effects > campaign-unsubscribe-route-19 returns 400 when the locked campaign recipient no longer exists

  ```
  AssertionError: expected 303 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 303
  ```
- chat-16 explicit public campaign suppression API response and side effects > campaign-unsubscribe-route-20 distinguishes unregistered global suppression storage from successful opt-out

  ```
  AssertionError: expected 303 to be 503 // Object.is equality
  - Expected
  + Received
  - 503
  + 303
  ```
- chat-16 explicit public campaign suppression API response and side effects > campaign-unsubscribe-route-21 stores only a signed opaque global recipient key, never a caller address

  ```
  AssertionError: expected 'https://42lms.com/campaign-unsubscrib…' to be 'https://42lms.com/campaign-unsubscrib…' // Object.is equality
  Expected: "https://42lms.com/campaign-unsubscribe/confirmed"
  Received: "https://42lms.com/campaign-unsubscribe/confirmed?scope=placement-cell"
  ```

## tests/unit/chat16-mentor-calendar-status-r5.test.ts (2 failing)
- chat-16 mentor calendar persisted statuses > MEN-projects-meetings-69 shows DRAFT and RESCHEDULED without guessing missing states

  ```
  AssertionError: expected 'https://meet.example.org/room' to be null
  - Expected:
  null
  + Received:
  "https://meet.example.org/room"
  ```
- chat-16 mentor calendar persisted statuses > MEN-projects-meetings-69 does not allow a past rescheduled or cancelled meeting join

  ```
  AssertionError: expected 'https://meet.example.org/room' to be null
  - Expected:
  null
  + Received:
  "https://meet.example.org/room"
  ```

## tests/unit/chat16-public-company-share-page-16.test.ts (4 failing)
- chat-16 public company-share page private applicant and access states > UX-chat16-company-share-16 requires a separate six-digit access proof before rendering applicants

  ```
  RangeError: Invalid time value
  ❯ Module.CompanySharePage src/app/company-share/[token]/page.tsx:41:207
  ❯ tests/unit/chat16-public-company-share-page-16.test.ts:23:35
  ```
- chat-16 public company-share page private applicant and access states > UX-chat16-company-share-17 denies an expired or withdrawn link without rendering a code form

  ```
  AssertionError: expected '<main class="_page_f6fce7 mx-auto min…' to contain 'role="alert"'
  Expected: "role="alert""
  Received: "<main class="_page_f6fce7 mx-auto min-h-dvh max-w-[1000px] px-4 py-12"><section aria-label="Restricted applicant share" class="mx-auto mt-12 max-w-[480px] space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 md:p-6"><header data-slot="page-h
  ```
- chat-16 public company-share page private applicant and access states > UX-chat16-company-share-18 keeps temporary provider errors private and provides a retry

  ```
  AssertionError: expected '<main class="_page_f6fce7 mx-auto min…' to contain 'This page is temporarily unavailable.…'
  Expected: "This page is temporarily unavailable. Try again."
  Received: "<main class="_page_f6fce7 mx-auto min-h-dvh max-w-[1000px] px-4 py-12"><section aria-label="Shared applicants unavailable" class="mx-auto mt-12 max-w-[480px] rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5"><section data-slot="error-state" role="
  ```
- chat-16 public company-share page private applicant and access states > UX-chat16-company-share-19 honors selected columns and does not leak unselected contact details

  ```
  AssertionError: expected '<main class="_page_f6fce7 relative is…' to contain 'Shared with Acme'
  - Expected
  + Received
  - Shared with Acme
  + <main class="_page_f6fce7 relative isolate mx-auto min-w-0 max-w-[1000px] space-y-4 px-4 py-12"><div aria-hidden="true" class="pointer-events-none fixed inset-0 z-[1] flex -rotate-[20deg] scale-[1.4] select-none flex-wrap content-start overflow-hidden text-lg font-semibold text-muted-foreground op
  ```
