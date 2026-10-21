# Work packet: edit src/modules/courses/assignment-scope.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-032  [P2] GAP  facet F07  effort M
- Legacy: AssignmentController.java:77-91 errors `lessonContentId must be a positive integer`, `Lesson content not found`, or missing class/course scope.
- vNext now: assignment-validation.ts:14-17 validates UUID and `assignment-scope.ts` uses CoursesServiceError codes.
- Fix: Map old invalid/missing/scope errors to clear, precise API and inline copy.
