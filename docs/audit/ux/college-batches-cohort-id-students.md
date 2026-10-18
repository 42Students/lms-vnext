# UX review: /college/batches/[cohortId]/students

- Owned route: `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx`; legacy labels and status wording unchanged.
- Improvements: contrast-safe action text; accessible links; bounded table scroll; overflow containment.
- Existing tenant guards, successful data and failure/empty states retained; no artificial metrics or new permissions. No direct DataTable.
- Test authored: `tests/unit/UX-college-college-batches-cohort-id-students-01.test.ts`; not yet executed by orchestrator, so checklist remains unticked.
