# UX review: /college/departments

- Audited route: `src/app/(authenticated)/college/departments/page.tsx`; existing scoped auth, exact copy, navigation and successful data unchanged.
- Changes: accessible deep teal links; 44px targets; no page horizontal scroll.
- State checks: read-only/permission/error and empty paths retained. No direct DataTable; downstream shared directory owns empty states. Focus targets and responsive containment follow the signed-off playbook.
- Regression: `tests/unit/UX-college-college-departments-01.test.ts` (authored, not executed); browser WebView and screen-reader evidence pending.
