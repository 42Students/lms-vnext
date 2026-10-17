# Learner / Projects — page gap verification

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`. Source branch `chatgpt/chat-11-b`.

**DONE indicates implemented and the named acceptance test authored, not executed.** The orchestrator must run unit tests, integration tests, typecheck and lint after merging before certifying closure. Source and tests were checked by inspection only; no tests were executed in this lane.

| ID | Status | Evidence (implementation; test file and test name) |
|---|---|---|
| LEARNER-projects-01 | DONE | src/components/projects/project-list.tsx; src/app/(authenticated)/learn/projects/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-01 displays course, mentor, phase, due state on cards")` |
| LEARNER-projects-02 | DONE | src/app/(authenticated)/learn/projects/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-02 selects draft, review or blocker actions before generic navigation")` |
| LEARNER-projects-03 | DONE | src/app/(authenticated)/learn/projects/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-03 blocks are labelled and linked to Board blocked tasks")` |
| LEARNER-projects-05 | DONE | src/components/projects/project-participant-list-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-05 supports 10/25/50 per page and displays numeric range")` |
| LEARNER-projects-07 | DONE | src/modules/projects/learner-project-sort-model.ts; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-07 naturally orders numbered team titles")` |
| LEARNER-projects-08 | DONE | src/app/(authenticated)/learn/projects/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-08 exposes legacy task completion and manual estimate wording")` |
| LEARNER-projects-10 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-10 archived learner workspace has exact read-only copy")` |
| LEARNER-projects-11 | DONE | src/app/(authenticated)/learn/projects/[projectId]/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-11 performance alias targets learner Board and delivery remains available")` |
| LEARNER-projects-12 | DONE | src/modules/projects/learner-project-goals-model.ts; src/components/projects/learner-project-goals.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-12 reads authored done criteria and personas from pinned template")` |
| LEARNER-projects-13 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-13 gives mentor, due state and next step with blocker attention")` |
| LEARNER-projects-16 | DONE | src/components/projects/learner-project-goals.tsx; src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-16 Overview uses legacy learner section names")` |
| LEARNER-projects-17 | DONE | src/components/projects/project-meeting-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-17 request meeting button, dialog and success use legacy copy")` |
| LEARNER-projects-18 | DONE | src/components/projects/project-meeting-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-18 withdrawal copy distinguishes learner request cancellation")` |
| LEARNER-projects-19 | DONE | src/components/projects/project-meeting-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-19 rejects past meeting start and end before start")` |
| LEARNER-projects-22 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-22 roadmap links to colored release status sections")` |
| LEARNER-projects-23 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-23 shows releases and sprints without internal schema text")` |
| LEARNER-projects-26 | DONE | src/modules/projects/learner-own-task-service.ts; src/components/projects/learner-own-task-controls.tsx; tests/integration/projects-p5-lifecycle.test.ts; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-26 keeps self-assignment, backlog creation and own-task delete")`; tests/integration/projects-p5-lifecycle.test.ts — `it("LEARNER-projects-26 keeps self-assignment, backlog creation and own-task delete")` |
| LEARNER-projects-27 | DONE | src/components/projects/learner-project-board-search.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-27 preserves Mine and clear-all learner Board filters")` |
| LEARNER-projects-28 | DONE | src/components/projects/learner-board-task-detail-dialog.tsx; src/app/(authenticated)/learn/projects/[projectId]/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-28 task modal includes done when, approach, comments and task actions")` |
| LEARNER-projects-29 | DONE | src/components/projects/learner-board-interactive.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-29 pulling backlog task requires active sprint")` |
| LEARNER-projects-30 | DONE | src/components/projects/project-task-comments.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-30 comments validate nonempty note and expose comment kind")` |
| LEARNER-projects-31 | DONE | src/components/projects/learner-board-interactive.tsx; src/app/(authenticated)/learn/projects/[projectId]/page.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-31 Board shows Add my task, filters and saving feedback")` |
| LEARNER-projects-32 | DONE | src/components/projects/learner-board-task-detail-dialog.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-32 task detail shows real type and estimate fields")` |
| LEARNER-projects-33 | DONE | src/modules/projects/resource-service.ts; src/components/projects/project-resource-files-section.tsx; tests/integration/projects-p5-lifecycle.test.ts; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-33 permits team-visible learner resource links and uploads")`; tests/integration/projects-p5-lifecycle.test.ts — `it("LEARNER-projects-33 permits team-visible learner resource links and uploads")` |
| LEARNER-projects-36 | DONE | src/components/projects/project-final-delivery-controls.tsx; src/components/projects/project-delivery-file-uploader.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-36 has final-delivery upload and attachment validation")` |
| LEARNER-projects-37 | DONE | src/components/projects/project-final-delivery-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-37 final draft automatically saves after editing")` |
| LEARNER-projects-38 | DONE | src/components/projects/project-final-delivery-controls.tsx; src/components/projects/project-workspace.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-38 final delivery shares team context and latest review")` |
| LEARNER-projects-39 | DONE | src/components/projects/project-final-delivery-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-39 uses primary-link and final summary legacy field copy")` |
| LEARNER-projects-40 | DONE | src/components/projects/project-final-delivery-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-40 checks team confirmation and summary plus evidence")` |
| LEARNER-projects-R03 | DONE | src/components/projects/project-final-delivery-controls.tsx; tests/unit/learner-projects-gap-verification.test.ts — `it("LEARNER-projects-R03 disabled submit explains readiness to assistive technology")` |

| LEARNER-projects-04 | DONE | src/app/(authenticated)/learn/projects/page.tsx; src/components/projects/project-participant-list-controls.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-04 supports legacy Active In progress Ready and Blocked status choices")` |
| LEARNER-projects-06 | DONE | src/app/(authenticated)/learn/projects/error.tsx; src/app/(authenticated)/learn/projects/loading.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-06 shows legacy loading failure Retry and both empty messages")` |
| LEARNER-projects-09 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-09 uses Projects shell heading with the specific project subtitle")` |
| LEARNER-projects-14 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-14 displays task donut lane counts empty state and signoff note")` |
| LEARNER-projects-15 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-15 shows ready waiting submitted and accepted final delivery states")` |
| LEARNER-projects-20 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-20 includes Upcoming meetings and recent history and meeting history")` |
| LEARNER-projects-21 | DONE | src/components/projects/project-workspace.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-21 shows project team role explanation and roster count")` |
| LEARNER-projects-34 | DONE | src/components/projects/project-resource-open-link.tsx; src/components/projects/project-workspace.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-34 distinguishes no resource, malformed address and popup failures")` |
| LEARNER-projects-35 | DONE | src/modules/projects/learner-project-activity-empty-model.ts; src/components/projects/learner-project-activity.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-35 uses exact empty activity text and friendly retry state")` |
| LEARNER-projects-R04 | DONE | src/modules/projects/learner-sprint-progress-model.ts; src/components/projects/project-workspace.tsx; tests/unit/learner-projects-round2-gap-closure.test.ts — `it("LEARNER-projects-R04 calculates sprint overdue and per-sprint task completion safely")` |

## Round two source-complete; awaiting orchestrator test execution

The page's queued gaps now have written tests and source references. These are **not passing certifications**: orchestrator must run all tests, typecheck, lint and any acceptance checks. Runtime evidence may require revisions.

## Previous open gap inventory (resolved in round two)

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
