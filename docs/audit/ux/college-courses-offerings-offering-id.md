# UX review: /college/courses/offerings/[offeringId]

- Audited route: `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx`; existing scoped auth, exact copy, navigation and successful data unchanged.
- Changes: delegated shared course/roster component remains source of truth; no redundant PageHeader introduced.
- State checks: read-only/permission/error and empty paths retained. No direct DataTable; downstream shared directory owns empty states. Focus targets and responsive containment follow the signed-off playbook.
- Regression: `tests/unit/UX-college-college-courses-offerings-offering-id-01.test.ts` (authored, not executed); browser WebView and screen-reader evidence pending.
