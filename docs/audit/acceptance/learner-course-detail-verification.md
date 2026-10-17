# Learner Course Detail — chat-11 round five source acceptance

These are source-level checks and ID-named tests; orchestration must execute unit, integration and browser checks.

| ID | Status | Evidence |
|---|---|---|
| LEARNER-course-detail-08 | DONE | src/components/courses/resource-progress-control.tsx, learner-interaction-model.ts, src/modules/courses/progress-service.ts; tests/unit/learner-course-detail-round5.test.ts — `it("LEARNER-course-detail-08 allows manual Resource and Live session completion with legacy confirmation copy")` |
| LEARNER-course-detail-14 | DONE | src/components/courses/learner-roadmap-item-dialog.tsx, learner-course-workspace.tsx; tests/unit/learner-course-detail-round5.test.ts — `it("LEARNER-course-detail-14 displays content kind, progress and due labels on learning items")` |
| LEARNER-course-detail-15 | DONE | src/components/courses/learner-course-workspace.tsx; tests/unit/learner-course-detail-round5.test.ts — `it("LEARNER-course-detail-15 defaults to next unfinished lesson and shows legacy status and numbering")` |
| LEARNER-course-detail-16 | DONE | src/components/courses/learner-course-workspace.tsx; tests/unit/learner-course-detail-round5.test.ts — `it("LEARNER-course-detail-16 gives lesson-focused previous next and back navigation")` |

## Remaining
LEARNER-course-detail-03/04/05/09/10/11/12/13/17/18 and other audit entries are not claimed by this batch.
