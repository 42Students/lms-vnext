# Work packet (wave 2): edit src/components/groups/college-group-detail-writes.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:233-265`
- vNext now: `src/components/groups/college-group-detail-writes.tsx:52-100`
- Fix: Legacy rule set/clear/preview/apply takes criteria JSON and autoRefresh, VNext UI uses text JSON editor, preview-only route and separate refresh service. Expose all actions and matching confirmation.

## G2-3-024-048  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:259-265`
- vNext now: `src/components/groups/college-group-detail-writes.tsx:52-100`, `src/modules/groups/rules-service.ts:78-217`
- Fix: Legacy one-click explicit rule apply on group is not surfaced in cited VNext detail actions; complete after bounded preview and user confirmation.
