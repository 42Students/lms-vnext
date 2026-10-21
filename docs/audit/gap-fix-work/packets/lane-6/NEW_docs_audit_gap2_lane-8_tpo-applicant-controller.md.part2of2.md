# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/tpo-applicant-controller.md (part 2 of 2)

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-032  [P2] GAP  facet F08  effort M
- Legacy: Legacy bulk reject audit is APPLICANTS_NOT_SELECTED with optional internal reason (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:99-105).
- vNext now: New bulk run summary uses PLACEMENTS_BULK_RUN and row activity, not legacy audit tag (src/modules/placements/tpo-bulk-action-confirm-service.ts:102-115).
- Fix: Retain status-specific audit action aliases and private reason restrictions.
