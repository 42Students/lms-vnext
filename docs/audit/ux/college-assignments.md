# UX review: /college/assignments

- Route: `src/app/(authenticated)/college/assignments/page.tsx`. Owner: chat-4, first half of /college.
- Legacy wording: retained verbatim, including heading, controls, errors and action labels.
- Source changes: horizontal overflow containment.
- States: existing scoped reads, empty/error/partial notices, controls and navigation preserved. No direct DataTable; delegated directory owns its empty-state copy.
- Test authored: `tests/unit/UX-college-college-assignments-01.test.ts`; device, WebView, CI and browser checks pending.
