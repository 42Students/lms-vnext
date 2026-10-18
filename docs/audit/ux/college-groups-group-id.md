# UX review: /college/groups/[groupId]

- Route: `src/app/(authenticated)/college/groups/[groupId]/page.tsx`; checked current authorized College source and signed-off playbook.
- Legacy titles and labels retained verbatim; no permission, route or API contract changed.
- Changes: accessible links; horizontal overflow containment.
- Accessibility/states: 2 DataTable occurrence(s), each with explicit empty copy: true. Existing error/empty/denied and form behaviors retained.
- Test authored: `tests/unit/UX-college-college-groups-group-id-01.test.ts`; CI/browser not run, no checklist sign-off claimed.
