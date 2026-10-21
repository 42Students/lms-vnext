# Work packet: edit src/modules/courses/assignment-submission-deadline-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-033  [P2] GAP  facet F07  effort M
- Legacy: AssignmentServiceImpl.java:501-517 errors on non-assignment, deleted, inactive, missing or expired deadlines.
- vNext now: assignment-submission-service.ts:111-137 / 218-236 checks published status; `assignment-submission-deadline-policy.ts` separately enforces due date.
- Fix: Document exact error matrix and distinguish deadline-unset, expired, hidden and unpublished cases.
