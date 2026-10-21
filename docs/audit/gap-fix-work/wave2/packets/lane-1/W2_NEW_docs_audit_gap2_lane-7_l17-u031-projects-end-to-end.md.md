# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

9 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

## G2-17-031-001  [P2] GAP  facet F01  effort M
- Legacy: LBE/controller/AdminProjectController.java:50,173-307 exposes college-admin workspace create/list/page; ProjectWorkspaceController.java:56,81-119 exposes member `/me` and detail.
- vNext now: V/modules/projects/instance-service.ts:34-48 and V/app/(authenticated)/mentor/projects/[projectId]/page.tsx:16-48 use UUID instance and role-specific links.
- Fix: Retain legacy route aliases, contextual back links and project/account identity.

## G2-17-031-004  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:100-130 loads WorkspaceShell, error Retry, Skeleton, TasksEditor.
- vNext now: V/app/(authenticated)/learn/projects/[projectId]/page.tsx:92-130 loads learner board and filtered tasks.
- Fix: Verify college-admin task screen retains legacy section order and shared one-canvas shell.

## G2-17-031-005  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:35-62 WorkspaceShell, delivery subtitle, alert/skeleton, WorkspaceDeliveryOverview.
- vNext now: V/app/(authenticated)/mentor/projects/[projectId]/page.tsx:28-48 shows Delivery as one of mentor tabs.
- Fix: Keep evidence/revisions/review content hierarchy and loading/error recovery.

## G2-17-031-006  [P2] GAP  facet F02  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:135-303 update overview, sprints, releases, tasks, resources in independent units.
- vNext now: V/app/(authenticated)/mentor/projects/[projectId]/page.tsx:25-46 Overview, People & Meetings, Releases and Sprints, Board, Allocation, Resources, Delivery, Activity.
- Fix: Order tabs per legacy account and clearly label extra allocation pages.

## G2-17-031-016  [P2] GAP  facet F06  effort M
- Legacy: LBE/controller/AdminProjectController.java:173-242 create and bulk preflight; ProjectWorkspaceController.java:135-305 section editing.
- vNext now: V/modules/projects/validation.ts:1-65 key max64/title max200/description max4000; priority MEDIUM, estimate 1-13.
- Fix: Compare title, key, description, date, estimate, required/min/max/default across all forms.

## G2-17-031-034  [P2] GAP  facet F12  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:153-201 sprint lifecycle.
- vNext now: V/modules/projects/mentor-sprint-write-service.ts:33-49 disallows ARCHIVED/COMPLETED project and SHIPPED release.
- Fix: Map legacy reopened sprint behavior and project status transition exceptions.

## G2-17-031-036  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:16-62 missing college Alert, fetch Retry, Skeleton, Workspace not found.
- vNext now: V/app/(authenticated)/learn/projects/[projectId]/page.tsx:58-108 redirects/notFound and filter ErrorState.
- Fix: Compare role-specific warning, loading/error/offline/session-expired recovery states.

## G2-17-031-047  [P2] GAP  facet F18  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:105-121 exact subtitle Shape the work breakdown and review learner submission activity for this workspace.
- vNext now: V/app/(authenticated)/mentor/projects/[projectId]/page.tsx:31-41 Board / Task Allocation labels.
- Fix: Restore exact college section subtitle independent of mentor layout.

## G2-17-031-044  [P3] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:35-62 AdminWorkspaceShell continuity.
- vNext now: V/app/(authenticated)/mentor/projects/[projectId]/page.tsx:69-84 separate header/tabs with project workspace.
- Fix: Preserve one-canvas spacing and error shells in role-appropriate view.
