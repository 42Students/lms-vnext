# Work packet: edit src/modules/bug-tracker/admin-validation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md

## G2-17-024-017  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:73-80 — invalid status/resolution labels in server error.
- vNext now: src/modules/bug-tracker/admin-validation.ts:52-63 — strict Zod enum issues instead.
- Fix: Render clear human-readable field errors.
