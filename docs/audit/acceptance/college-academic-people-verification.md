# College Academic and People — chat-4 verified gap closure

Authoritative audit: `docs/audit/pages/college/academic-people-review.md`. Tests authored, **not run** by the builder; integrated acceptance remains with orchestrator.

| ID | Status | Evidence |
|---|---|---|
| COL-academic-setup-R03 | DONE | `src/modules/admin-ui/admin-dashboard-navigation.ts` surfaces academic periods before Batches, `src/modules/people/college-legacy-tabs-model.ts` provides route-reachable period tab without altering the six legacy guided stages, and `src/components/academics/college-{cohort,section}-management.tsx` link directly to the setup route from empty states; `tests/unit/chat4-college-academic-people-gap-closure.test.ts` test `COL-academic-setup-R03`. |
| COL-academic-setup-R04 | DONE | `src/modules/academics/college-batch-promotion-service.ts` locks and checks real `program_term_courses` for the active target term, `college-batch-promotion-model.ts` blocks missing mapped courses, UI links to curriculum, and `executeCollegeBatchPromotion` shares transactional preview recheck. `tests/unit/college-batch-promotion-model.test.ts`, `tests/integration/college-batch-promotion-preview.test.ts`, and `tests/integration/college-batch-promotion-execute.test.ts` have tests named `COL-academic-setup-R04`. |
