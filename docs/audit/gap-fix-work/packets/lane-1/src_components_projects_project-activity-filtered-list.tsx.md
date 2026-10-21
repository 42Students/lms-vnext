# Work packet: edit src/components/projects/project-activity-filtered-list.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md

## G2-4-029-011  [P1] GAP  facet F04  effort S
- Legacy: Rows resourceKey/actionType/actorName-or-ID/userType/createdAt (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:63-85`)
- vNext now: Event summary, actor display and relative occurredAt (`src/components/projects/project-activity-filtered-list.tsx:12-14,120-129`)
- Fix: Render old four-column resource audit table with resource, action, actor and timestamp.

## G2-4-029-016  [P1] MISSING  facet F05  effort S
- Legacy: Column order Resource→Action→Actor→When (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:63-85`)
- vNext now: Feed articles without columns (`src/components/projects/project-activity-filtered-list.tsx:119-130`)
- Fix: Implement table with exact column order.

## G2-4-029-024  [P2] GAP  facet F07  effort S
- Legacy: Failed getProjectResourceAudit → Failed to load resource audit history. (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:31-39`)
- vNext now: Load-more fails `We couldn't load more activity. Try again.` (`src/components/projects/project-activity-filtered-list.tsx:25-47`)
- Fix: Differentiate first-load resource failure and load-more failure with exact copy.

## G2-4-029-025  [P2] GAP  facet F07  effort S
- Legacy: Alert message Resource audit could not be loaded, dynamic error description + Retry (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:135-143`)
- vNext now: Empty-state feed with load-more error below (`src/components/projects/project-activity-filtered-list.tsx:109-130`)
- Fix: Show distinct full-page resource audit error alert with Retry.

## G2-4-029-028  [P2] GAP  facet F08  effort S
- Legacy: Empty copy No resource changes yet or No resource changes match these filters (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:144-147`)
- vNext now: No project activity yet / No matching activity (`src/components/projects/project-activity-filtered-list.tsx:111-118`)
- Fix: Restore separate empty messages.
