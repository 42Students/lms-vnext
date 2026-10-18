# UX review: /college/faculty-assignment

- Route: `src/app/(authenticated)/college/faculty-assignment/page.tsx`; checked current authorized College source and signed-off playbook.
- Legacy titles and labels retained verbatim; no permission, route or API contract changed.
- Changes: high-contrast primary action; accessible links; narrow form fields; keyboard scroll bounds; horizontal overflow containment.
- Accessibility/states: No direct DataTable; shared underlying workspace owns list and empty state. Existing error/empty/denied and form behaviors retained.
- Test authored: `tests/unit/UX-college-college-faculty-assignment-01.test.ts`; CI/browser not run, no checklist sign-off claimed.
