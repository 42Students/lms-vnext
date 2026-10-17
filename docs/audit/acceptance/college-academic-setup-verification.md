# College Academic Setup — chat-11 source verification

**DONE = implementation plus named test authored, not passed.** The orchestrator executes tests, typecheck, lint and database integrations. Source-level checks do not replace PostgreSQL behavior tests.

| ID | Status | Evidence |
|---|---|---|
| COL-academic-setup-02 | DONE | src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-02 verified academic workflow")` |
| COL-academic-setup-03 | DONE | src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-03 verified academic workflow")` |
| COL-academic-setup-04 | DONE | src/components/electives/college-elective-offering-manager.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-04 verified academic workflow")` |
| COL-academic-setup-05 | DONE | src/components/academics/college-structure-directory.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-05 verified academic workflow")` |
| COL-academic-setup-06 | DONE | src/components/academics/college-term-mapping-manager.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-06 verified academic workflow")` |
| COL-academic-setup-07 | DONE | src/components/academics/college-term-mapping-manager.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-07 verified academic workflow")` |
| COL-academic-setup-08 | DONE | src/components/academics/college-term-mapping-manager.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-08 verified academic workflow")` |
| COL-academic-setup-09 | DONE | src/modules/academics/college-term-mapping-service.ts; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-09 verified academic workflow")` |
| COL-academic-setup-10 | DONE | src/app/(authenticated)/college/semester-courses/page.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-10 verified academic workflow")` |
| COL-academic-setup-13 | DONE | src/components/college/college-legacy-group-tabs.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-13 verified academic workflow")` |
| COL-academic-setup-14 | DONE | src/components/academics/college-academic-directory.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-14 verified academic workflow")` |
| COL-academic-setup-22 | DONE | src/components/admin/admin-program-directory.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-22 verified academic workflow")` |
| COL-academic-setup-24 | DONE | src/components/admin/admin-program-directory.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-24 verified academic workflow")` |
| COL-academic-setup-25 | DONE | src/components/academics/college-semester-management.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-25 verified academic workflow")` |
| COL-academic-setup-27 | DONE | src/components/academics/college-cohort-management.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-27 verified academic workflow")` |
| COL-academic-setup-30 | DONE | src/components/academics/college-section-management.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-30 verified academic workflow")` |
| COL-academic-setup-31 | DONE | src/components/academics/college-recurring-preview.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-31 verified academic workflow")` |
| COL-academic-setup-33 | DONE | src/components/academics/college-cohort-management.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-33 verified academic workflow")` |
| COL-academic-setup-35 | DONE | src/modules/academics/college-batch-promotion-execute.ts; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-35 verified academic workflow")` |
| COL-academic-setup-38 | NOT-A-GAP | src/components/admin/lecture-hall-manager.tsx; tests/unit/college-academic-setup-gap-verification.test.ts — `it("COL-academic-setup-38 verified academic workflow")` (owner decision: archive instead of delete) |

| COL-academic-setup-17 | DONE | src/components/academics/college-cohort-management.tsx; tests/unit/college-academic-setup-round4-gap-verification.test.ts — `it("COL-academic-setup-17 provides named create/update/graduate success feedback")` |
| COL-academic-setup-20 | DONE | src/components/admin/department-actions.tsx; tests/unit/college-academic-setup-round4-gap-verification.test.ts — `it("COL-academic-setup-20 prompts with the changed department name before discarding")` |
| COL-academic-setup-21 | DONE | src/components/admin/department-directory.tsx, src/modules/admin-ui/department-directory.ts; tests/unit/college-academic-setup-round4-gap-verification.test.ts — `it("COL-academic-setup-21 sorts, paginates, counts and clears department searches")` |
| COL-academic-setup-36 | DONE | src/modules/academics/college-batch-promotion-model.ts, src/app/(authenticated)/college/batch-promotion/page.tsx; tests/unit/college-academic-setup-round4-gap-verification.test.ts — `it("COL-academic-setup-36 accepts consecutive YYYY-YY overrides and rejects invalid years")` |
| COL-academic-setup-40 | DONE | src/app/(authenticated)/college/departments/error.tsx, loading.tsx; tests/unit/college-academic-setup-round4-gap-verification.test.ts — `it("COL-academic-setup-40 provides department retry and safe loading feedback")` |

| COL-academic-setup-23 | DONE | src/components/admin/admin-program-directory.tsx, src/components/academics/academics-actions.tsx, src/modules/admin-ui/super-admin-program-input.ts; tests/unit/college-academic-setup-round5-gap-verification.test.ts — `it("COL-academic-setup-23 derives optional program code and preserves 1–10 integer year duration and editable department")` |
| COL-academic-setup-29 | DONE | src/components/academics/college-cohort-management.tsx, src/components/academics/college-academic-directory.tsx; tests/unit/college-academic-setup-round5-gap-verification.test.ts — `it("COL-academic-setup-29 disables dependent batch removal with explicit student and class counts")` |
| COL-academic-setup-32 | DONE | src/components/academics/college-structure-directory.tsx, src/app/(authenticated)/college/classes/recurring-preview/page.tsx, src/components/academics/college-recurring-preview.tsx; tests/unit/college-academic-setup-round5-gap-verification.test.ts — `it("COL-academic-setup-32 launches a selected class schedule from its list row")` |
| COL-academic-setup-39 | DONE | src/app/(authenticated)/college/{classes,batches,semesters,lecture-halls}/page.tsx; tests/unit/college-academic-setup-round5-gap-verification.test.ts — `it("COL-academic-setup-39 uses Export CSV labels and keeps intentional capped server export")` |

| COL-academic-setup-28 | DONE | src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx and src/components/college/student-class-move-action.tsx; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("COL-academic-setup-28 verifies batch roster, search and class-move entry")` |

| COL-academic-setup-19 | NOT-A-GAP | docs/audit/owner-decisions-resolved.md explicitly keeps archive instead of hard delete; src/components/admin/department-actions.tsx already disables archive with dependency tooltip and has Retry delete after server rejection; tests/unit/college-mentor-round7-gap-verification.test.ts — `it("COL-academic-setup-19 retains owner-approved archive and dependency blocking")`. |

## Partial (still open)

- COL-academic-setup-16: Styled class lifecycle and recurring schedule confirmations now exist; other create/edit and keyboard-modality parity is not yet verified. Source test: `it("COL-academic-setup-16 uses styled confirmation for class lifecycle and recurring schedules")` in `tests/unit/college-mentor-round7-gap-verification.test.ts`.

## Outstanding and partial
COL-academic-setup-15/16/41 remain open, including dirty-state modals and batch-level student moves. Some received partial improvements this round but are not certified. The archive-vs-delete distinction on COL-academic-setup-38 is intentional per docs/audit/owner-decisions-resolved.md.

Unit checks are source witnesses; the orchestrator must inspect PostgreSQL integration coverage for S1/S2 behavior.
