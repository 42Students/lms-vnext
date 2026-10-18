# /tracker/issues — UX source review

- **Surface:** `src/app/(authenticated)/tracker/issues/page.tsx`.
- **Before:** Cards were locally styled and empty/invalid filters lacked shared semantic state components.
- **After:** Issue rows now use the shared Card with preserved issue metadata; shared EmptyState offers existing Reset action, ErrorState preserves invalid-filter recovery, Button handles Apply filters, 44px targets and improved focus style.
- **Access and state contract:** Admin-only gate and query-preserving cursor pagination remain; no issue data moved client-side.
- **Test:** `tests/unit/UX-tracker-issues-01.test.ts` (authored, not executed).
- **Verification outstanding:** 320/360/390px, screen reader, real keyboard and typecheck/unit evidence; a source review or redirect test is not browser acceptance.
