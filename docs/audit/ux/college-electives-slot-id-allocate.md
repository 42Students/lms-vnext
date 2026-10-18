# UX review: /college/electives/[slotId]/allocate

- Route: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`; owner chat-4, first-half College UX rollout.
- Legacy copy, persisted data, mutation endpoints and permission checks unchanged.
- Source improvements: Accessible keyboard-scrollable allocation table with 44px selection targets, named checkboxes and sticky selection column.
- Empty/error and pending states: existing copy retained. Wide tables remain desktop semantic tables, with an explicit keyboard-focusable scroll region on phones; sticky identity or selection column prevents context loss.
- Regression: `tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts`, written but not executed. WebView, real-device and screen-reader validation pending.
