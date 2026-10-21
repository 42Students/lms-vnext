# Work packet: edit src/modules/courses/assignment-validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-027  [P1] GAP  facet F06  effort L
- Legacy: AssignmentServiceImpl.java:315-372 permits an array of mixed submission assets and enforces distinct asset IDs.
- vNext now: assignment-validation.ts:135-143 accepts exactly one discriminated submission type per request.
- Fix: Implement complete mixed submissionParts payload and duplicate asset ID checks at service boundary.

## G2-2-026-032  [P2] GAP  facet F07  effort M
- Legacy: AssignmentController.java:77-91 errors `lessonContentId must be a positive integer`, `Lesson content not found`, or missing class/course scope.
- vNext now: assignment-validation.ts:14-17 validates UUID and `assignment-scope.ts` uses CoursesServiceError codes.
- Fix: Map old invalid/missing/scope errors to clear, precise API and inline copy.

## G2-2-026-034  [P2] GAP  facet F07  effort M
- Legacy: AssignmentServiceImpl.java:325-364 has explicit `Duplicate submission item ID.` and each-item invalid messages.
- vNext now: assignment-validation.ts:135-143 discriminated single type; multipart path separate.
- Fix: Provide exact per-part server/field errors, duplicate ID and unsupported method treatment.
