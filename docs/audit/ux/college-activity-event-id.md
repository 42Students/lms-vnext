# UX review: /college/activity/[eventId]

- Route: `src/app/(authenticated)/college/activity/[eventId]/page.tsx`. Owner: chat-4, first half of /college.
- Legacy wording: retained verbatim; no navigation, permission or business-rule changes.
- Source changes: accessible deep-teal links; bounded table scrolling; horizontal overflow containment.
- States: preserved existing permission/empty/error/success states; shared primitives retain focus, reduced-motion and loading contracts. No direct DataTable on this route; downstream list controls retain their own empty copy.
- Test authored: `tests/unit/UX-college-college-activity-event-id-01.test.ts`; runtime/browser and CI validation pending.
