# Work packet (wave 2): edit src/app/api/courses/assignment-submissions/[submissionId]/grade/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-048  [P2] GAP  facet F10  effort M
- Legacy: AssignmentController.java:270-293 PATCH /updatePoints accepts query string grade.
- vNext now: grade/route.ts:17-40 PATCH JSON `pointsAwarded,feedback,expectedVersion`.
- Fix: Map grade mutation to explicit version/feedback request and post-save view refresh.
