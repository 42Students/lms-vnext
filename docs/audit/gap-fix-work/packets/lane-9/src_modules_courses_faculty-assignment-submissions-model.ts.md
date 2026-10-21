# Work packet: edit src/modules/courses/faculty-assignment-submissions-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-084  [P1] GAP  facet F19  effort M
- Legacy: AssignmentController.java:183-198 caps unpaged result to 50 and explicit size to 100.
- vNext now: assignment-submission-service.ts:602-651 reads all matched submissions then `faculty-assignment-submissions-model.ts:34-39` slices page size20 in memory.
- Fix: Push pagination to SQL with scoped count/limit/offset for >10000 submissions.
