# UX-G001 — Shared notification inbox, filters, feedback and detail

Canonical status: `docs/tracker.json#uxReview.groups`. The sole UX group
covers `src/app/(authenticated)/notifications/{page,loading,error}.tsx`
and shared `notification-list.tsx` / `notification-toolbar.tsx`.

## Implemented and verified

- Selected-membership inbox only, with readable notification detail dialog,
  accessible All/Unread filters, a query search, category choices and reset.
- Invalid category or cursor yields a safe recovery link, not an unfiltered
  private feed; no unread notification is silently acknowledged by opening it.
- Explicit per-notification Mark read and a confirmation for Mark all as read.
  The confirmation explains that it affects unread items hidden by filters;
  Cancel makes no mutation. Success/failed feedback and retry are retained.
- Bounded route-specific loading and graceful recovery for errors were
  inspected. These existing shared controls retain their retry paths.
- The selected-college membership and recipient security predicates remain
  inside the existing notification services. No API route, permission, RLS,
  cache policy, or database schema was weakened.

## Executed acceptance — 8 November 2026

- [Green exact-source CI](https://github.com/42Students/lms-vnext/actions/runs/42460830534),
  source SHA `7b7680f7219aa3f2b950f1d1622e0c3d5fddb040`.
- Scoped ESLint, **full TypeScript** and **35/35** focused Vitest tests from
  six suites all passed, including cursor/filter links, safe actions,
  receipt ownership and selected-workspace isolation.
- Dedicated [Playwright spec](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/ux-g001-shared-notifications.spec.ts):
  **2/2** Chromium journeys on **1280×800 desktop** and **390×844 mobile**.
  No skipped/flaky cases. Each seeds a disposable actor with two active
  Faculty memberships in two genuinely distinct colleges and three
  persisted notification receipts.
- Browser checks execute the actual inbox, All/Unread counts, category nav,
  detail dialog, no-match search, invalid category and invalid cursor
  recovery, read-one, bulk confirmation Cancel then Confirm, data-consistent
  count updates and selected-college switching.
- The second college's unread receipt remains unread after bulk read in
  college A. A forged read request for the first college's receipt from the
  second college returns a denied HTTP status. All UI checks run through
  real server services, not a browser-only mock.
- [Two responsive screenshots / artifact](https://github.com/42Students/lms-vnext/actions/runs/42460830534/artifacts/13609736937).
- First workflow (42460498527) was red due to a test-only race where the
  native confirmation dialog's closing animation had not completed.
  The corrected test waits for the old dialog to be hidden before reopening
  and then passed at exact source SHA above.

**Boundary:** This is scoped notification UX acceptance, not global WCAG,
production messaging-provider, RLS, security or entire-release certification.
Other account-specific inboxes have their own groups and checks.
