# Work packet: edit src/modules/bug-tracker/workflow.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md

## G2-17-024-016  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:122-125 — retest only READY_FOR_RETEST, else 409 Issue is not ready for retest.
- vNext now: src/modules/bug-tracker/workflow.ts:90-100,190-240 — INVALID_STATE code, mapped in API error handler.
- Fix: Match 409 and sentence in UI.
