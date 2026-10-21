# Work packet: edit src/components/projects/admin-project-section-page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md, docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md, docs/audit/gap2/lane-3/superadmin-workspace-delivery.md, docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md

## G2-18-028-008  [P1] GAP  facet F03  effort M
- Legacy: Old missing college warning and Retry error or Workspace not found notices; overview.js:107-145
- vNext now: Server route throws errors and no inline missing-college state; admin-project-section-page.tsx:34-47
- Fix: Restore contextual shell warnings/retry when appropriate

## G2-16-028-030  [P1] GAP  facet F11  effort M
- Legacy: SuperAdminWorkspaceShell.jsx:8-29 presents SA page with college selector; resources.js:69-85 recovers missing college in shell.
- vNext now: admin-project-section-page.tsx:18-44 reads membership context and requireProjectManageAccess; no SA-specific missing-scope panel.
- Fix: Provide SA acting-college selector/empty-scope recovery before resource mutation and preserve shell.

## G2-13-028-028  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:106-108 'Workspace could not be loaded' plus Retry
- vNext now: src/components/projects/admin-project-section-page.tsx:38-47 server read can throw route error
- Fix: Keep page-level retry with loaded workspace preserved where safe.

## G2-3-029-024  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:45-53`
- vNext now: `src/components/projects/admin-project-section-page.tsx:34-47`
- Fix: Legacy distinguishes error with Retry vs not-found warning; vNext no inline error message Workspace could not be loaded.

## G2-7-012-023  [P2] GAP  facet F07  effort M
- Legacy: readiness.js:83-90 Workspace could not be loaded with description and Retry
- vNext now: admin-project-section-page.tsx:38-47 error before section render
- Fix: Add scoped retryable loading error

## G2-7-012-024  [P2] GAP  facet F07  effort M
- Legacy: readiness.js:88-95 Workspace not found separate from transport error
- vNext now: admin-project-section-page.tsx:38-47 no such distinct section state
- Fix: Distinguish 404/forbidden/fetch failures

## G2-7-012-025  [P2] GAP  facet F07  effort M
- Legacy: readiness.js:43-59 Admin not assigned to a college warning within tabs
- vNext now: admin-project-section-page.tsx:38-42 access denial before UI
- Fix: Add contextual missing-college state
