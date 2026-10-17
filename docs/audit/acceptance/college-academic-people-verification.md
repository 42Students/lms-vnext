# College Academic and People — chat-4 verified gap closure

Authoritative audit: `docs/audit/pages/college/academic-people-review.md`. Tests authored, **not run** by the builder; integrated acceptance remains with orchestrator.

| ID | Status | Evidence |
|---|---|---|
| COL-academic-setup-R03 | DONE | `src/modules/admin-ui/admin-dashboard-navigation.ts` surfaces academic periods before Batches, `src/modules/people/college-legacy-tabs-model.ts` provides route-reachable period tab without altering the six legacy guided stages, and `src/components/academics/college-{cohort,section}-management.tsx` link directly to the setup route from empty states; `tests/unit/chat4-college-academic-people-gap-closure.test.ts` test `COL-academic-setup-R03`. |
