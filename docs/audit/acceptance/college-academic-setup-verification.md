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

## Outstanding and partial
COL-academic-setup-15/16/17/19/20/21/23/28/29/32/36/39/40/41 remain open, including dirty-state modals and batch-level student moves. Some received partial improvements this round but are not certified. The archive-vs-delete distinction on COL-academic-setup-38 is intentional per docs/audit/owner-decisions-resolved.md.

Unit checks are source witnesses; the orchestrator must inspect PostgreSQL integration coverage for S1/S2 behavior.
