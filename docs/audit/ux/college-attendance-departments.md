# UX review: /college/attendance/departments

- Route: `src/app/(authenticated)/college/attendance/departments/page.tsx`. Owner: chat-4, first half of /college.
- Legacy wording: retained verbatim, including heading, controls, errors and action labels.
- Source changes: accessible deep-teal links; horizontal overflow containment.
- States: existing scoped reads, empty/error/partial notices, controls and navigation preserved. No direct DataTable; delegated directory owns its empty-state copy.
- Test authored: `tests/unit/UX-college-college-attendance-departments-01.test.ts`; device, WebView, CI and browser checks pending.
