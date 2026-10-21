# Work packet (wave 2): edit src/modules/bug-tracker/workflow.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-17-024-038  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:122-125 — Issue is not ready for retest text.
- vNext now: src/modules/bug-tracker/workflow.ts:90-100 — INVALID_STATE error code.
- Fix: Map exact rejection text.

## G2-4-021-039  [P2] GAP  facet F11  effort M
- Legacy: Legacy admin/manager can edit workflow after access check in service. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:67-110`)
- vNext now: New workflow requires active Super Admin only. (`src/modules/bug-tracker/workflow.ts:103-107`; `src/modules/bug-tracker/admin-service.ts:47-54`)
- Fix: Compare old manager role permissions, retain least privilege.
