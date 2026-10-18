# UX review: /college/faculty/[membershipId]

- Route: `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`; checked current authorized College source and signed-off playbook.
- Legacy titles and labels retained verbatim; no permission, route or API contract changed.
- Changes: high-contrast primary action; accessible links; keyboard scroll bounds; horizontal overflow containment.
- Accessibility/states: No direct DataTable; shared underlying workspace owns list and empty state. Existing error/empty/denied and form behaviors retained.
- Test authored: `tests/unit/UX-college-college-faculty-membership-id-01.test.ts`; CI/browser not run, no checklist sign-off claimed.
