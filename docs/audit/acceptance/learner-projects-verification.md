# Learner / Projects — page gap verification

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`. Source branch `chatgpt/chat-11-b`.

**DONE indicates implemented and the named acceptance test authored, not executed.** The orchestrator must run unit tests, integration tests, typecheck and lint after merging before certifying closure. Source and tests were checked by inspection only; no tests were executed in this lane.

| ID | Status | Evidence (implementation; test file and test name) |
|---|---|---|
| LEARNER-projects-01 | DONE | src/components/projects/project-list.tsx; src/app/(authenticated)/learn/projects/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-01 ...")` |
| LEARNER-projects-02 | DONE | src/app/(authenticated)/learn/projects/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-02 ...")` |
| LEARNER-projects-03 | DONE | src/app/(authenticated)/learn/projects/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-03 ...")` |
| LEARNER-projects-05 | DONE | src/components/projects/project-participant-list-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-05 ...")` |
| LEARNER-projects-07 | DONE | src/modules/projects/learner-project-sort-model.ts; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-07 ...")` |
| LEARNER-projects-08 | DONE | src/app/(authenticated)/learn/projects/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-08 ...")` |
| LEARNER-projects-10 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-10 ...")` |
| LEARNER-projects-11 | DONE | src/app/(authenticated)/learn/projects/[projectId]/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-11 ...")` |
| LEARNER-projects-12 | DONE | src/modules/projects/learner-project-goals-model.ts; src/components/projects/learner-project-goals.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-12 ...")` |
| LEARNER-projects-13 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-13 ...")` |
| LEARNER-projects-16 | DONE | src/components/projects/learner-project-goals.tsx; src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-16 ...")` |
| LEARNER-projects-17 | DONE | src/components/projects/project-meeting-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-17 ...")` |
| LEARNER-projects-18 | DONE | src/components/projects/project-meeting-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-18 ...")` |
| LEARNER-projects-19 | DONE | src/components/projects/project-meeting-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-19 ...")` |
| LEARNER-projects-22 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-22 ...")` |
| LEARNER-projects-23 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-23 ...")` |
| LEARNER-projects-26 | DONE | src/modules/projects/learner-own-task-service.ts; src/components/projects/learner-own-task-controls.tsx; tests/integration/projects-p5-lifecycle.test.ts; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-26 ...")`; tests/integration/projects-p5-lifecycle.test.ts — `it("LEARNER-projects-26 ...")` |
| LEARNER-projects-27 | DONE | src/components/projects/learner-project-board-search.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-27 ...")` |
| LEARNER-projects-28 | DONE | src/components/projects/learner-board-task-detail-dialog.tsx; src/app/(authenticated)/learn/projects/[projectId]/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-28 ...")` |
| LEARNER-projects-29 | DONE | src/components/projects/learner-board-interactive.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-29 ...")` |
| LEARNER-projects-30 | DONE | src/components/projects/project-task-comments.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-30 ...")` |
| LEARNER-projects-31 | DONE | src/components/projects/learner-board-interactive.tsx; src/app/(authenticated)/learn/projects/[projectId]/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-31 ...")` |
| LEARNER-projects-32 | DONE | src/components/projects/learner-board-task-detail-dialog.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-32 ...")` |
| LEARNER-projects-33 | DONE | src/modules/projects/resource-service.ts; src/components/projects/project-resource-files-section.tsx; tests/integration/projects-p5-lifecycle.test.ts; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-33 ...")`; tests/integration/projects-p5-lifecycle.test.ts — `it("LEARNER-projects-33 ...")` |
| LEARNER-projects-36 | DONE | src/components/projects/project-final-delivery-controls.tsx; src/components/projects/project-delivery-file-uploader.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-36 ...")` |
| LEARNER-projects-37 | DONE | src/components/projects/project-final-delivery-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-37 ...")` |
| LEARNER-projects-38 | DONE | src/components/projects/project-final-delivery-controls.tsx; src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-38 ...")` |
| LEARNER-projects-39 | DONE | src/components/projects/project-final-delivery-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-39 ...")` |
| LEARNER-projects-40 | DONE | src/components/projects/project-final-delivery-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-40 ...")` |
| LEARNER-projects-R03 | DONE | src/components/projects/project-final-delivery-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-R03 ...")` |

## Still open on this page

These gaps are not claimed as closed. Some have partial source work or an authored test; they require complete legacy parity and runtime verification:

| ID | Remaining acceptance work |
|---|---|
| LEARNER-projects-04 | Resolve status semantics between legacy Active/In progress/Ready and normalized statuses; current Blocked attention and labels are partial |
| LEARNER-projects-06 | Validate full error, stale-refresh and loading copy in addition to verified empty states |
| LEARNER-projects-09 | Restore legacy shell title/subtitle/layout details |
| LEARNER-projects-14 | Render actual task-progress donut, including accurate empty state and sprint-signoff note |
| LEARNER-projects-15 | Use exact readiness reasons and Ready for review status in Overview |
| LEARNER-projects-20 | Reconcile Past meetings/Meeting history headings and exact empty copy |
| LEARNER-projects-21 | Verify roster/heading/count parity for all member role kinds |
| LEARNER-projects-34 | Resource-open error messages, invalid-link guard and stats tiles |
| LEARNER-projects-35 | Activity error and empty-state legacy copy |
| LEARNER-projects-R04 | Pending implementation and acceptance evidence |

`LEARNER-projects-38` has an additional acceptance witness even though it is not in this revision's chat-11 queue.

No new migrations proposed. Test execution delegated to orchestrator.
