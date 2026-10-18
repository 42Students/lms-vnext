# UX review: /college/electives/slot/id/offerings/offering/id/roster

- Route: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`; owner chat-4, first-half College UX rollout.
- Legacy copy, persisted data, mutation endpoints and permission checks unchanged.
- Source improvements: Keyboard-scrolling wide roster with sticky student names, semantic headers, 44px move/remove actions and contrast-safe destructive action text.
- Empty/error and pending states: existing copy retained. Wide tables remain desktop semantic tables, with an explicit keyboard-focusable scroll region on phones; sticky identity or selection column prevents context loss.
- Regression: `tests/unit/UX-college-college-electives-slot-id-offerings-offering-id-roster-01.test.ts`, written but not executed. WebView, real-device and screen-reader validation pending.
