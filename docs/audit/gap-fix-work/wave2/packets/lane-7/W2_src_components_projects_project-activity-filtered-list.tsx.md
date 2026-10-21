# Work packet (wave 2): edit src/components/projects/project-activity-filtered-list.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md

## G2-4-029-009  [P2] MISSING  facet F03  effort S
- Legacy: Counters Changes/Added/Edited/Removed (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:99-110`)
- vNext now: Filter count only; no aggregate metric tiles (`src/components/projects/project-activity-filtered-list.tsx:109-130`)
- Fix: Add four category counters based on all fetched history.

## G2-4-029-012  [P2] MISSING  facet F04  effort S
- Legacy: `resource-` prefix stripped, hyphens spaced, first capitalized (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:18-29`)
- vNext now: Displays summary instead of resourceKey-normalized label (`src/components/projects/project-activity-filtered-list.tsx:121-129`)
- Fix: Implement resourceLabel normalization for historical resource keys.

## G2-4-029-013  [P2] GAP  facet F04  effort S
- Legacy: FACULTY→Staff LEARNER→Student ADMIN→Admin (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:14-16`)
- vNext now: ActorDisplayName or System; no actor user type (`src/components/projects/project-activity-filtered-list.tsx:125-129`)
- Fix: Expose actorUserType and old labels.

## G2-4-029-014  [P2] GAP  facet F04  effort S
- Legacy: Actor name fallback actorUserId and subline actorType (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:77-84`)
- vNext now: ActorDisplayName or System, lacks ID/type fallback (`src/components/projects/project-activity-filtered-list.tsx:125-129`)
- Fix: Add stable actor identity fallback and label.

## G2-4-029-015  [P2] GAP  facet F04  effort S
- Legacy: Date rendered via formatTimestamp helper (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:84`)
- vNext now: Relative time with full date only tooltip (`src/components/projects/project-activity-filtered-list.tsx:126-129`)
- Fix: Render visible full timestamp in When column and timezone consistent with old.

## G2-4-029-017  [P2] GAP  facet F05  effort S
- Legacy: Case-insensitive client search across resource, actor name/id/type, action label (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:36-54`)
- vNext now: Search event summary/displayName/type only (`src/components/projects/project-activity-filtered-list.tsx:57-67`)
- Fix: Search all resource-key and actor-type fields as legacy.

## G2-4-029-018  [P2] GAP  facet F05  effort S
- Legacy: Filter exact action value ALL/CREATE/UPDATE/UPSERT/DELETE (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:33-54`)
- vNext now: Resource action Added/Edited/Saved/Removed derived eventType (`src/components/projects/project-activity-filtered-list.tsx:49-80`)
- Fix: Map action enum and keep Saved separate from Edited.

## G2-4-029-019  [P2] GAP  facet F05  effort S
- Legacy: Table pagination10, disabled size changer, total `x–y of N matching changes` (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:149-160`)
- vNext now: Cursor load more 100 events (`src/components/projects/project-activity-filtered-list.tsx:19-45`)
- Fix: Add 10 per page and exact total string while paginating all historic rows.

## G2-4-029-022  [P2] GAP  facet F06  effort S
- Legacy: Search placeholder Search resource or actor, clear allowed (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:114-120`)
- vNext now: Search placeholder Search activity (`src/components/projects/project-activity-filtered-list.tsx:70-74`)
- Fix: Restore placeholder and explicit clear button.

## G2-4-029-023  [P2] GAP  facet F06  effort S
- Legacy: Action select defaults ALL with five option labels (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:121-133`)
- vNext now: Filter ALL named All resource changes, Added/Edited/Saved/Removed (`src/components/projects/project-activity-filtered-list.tsx:75-81`)
- Fix: Display exact All actions and option mapping.

## G2-4-029-034  [P2] GAP  facet F10  effort S
- Legacy: Retry reissues resource audit GET; aborts stale updates with mounted flag (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:31-45`)
- vNext now: Cursor load-more rather than fresh full audit retry (`src/components/projects/project-activity-filtered-list.tsx:25-48`)
- Fix: Restore retry of dedicated endpoint and avoid stale updates on workspace switch.

## G2-4-029-042  [P2] GAP  facet F13  effort S
- Legacy: Loading Skeleton 5 rows and error/zero/filter-empty separately (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:135-161`)
- vNext now: Activity empty state and asynchronous load more (`src/components/projects/project-activity-filtered-list.tsx:109-130`)
- Fix: Restore initial 5-row skeleton and distinct errors/empties.

## G2-4-029-048  [P2] GAP  facet F16  effort S
- Legacy: Legacy table horizontally scrolls x=max-content on mobile (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:149-160`)
- vNext now: New vertical feed has no horizontal table overflow (`src/components/projects/project-activity-filtered-list.tsx:119-130`)
- Fix: Use responsive table scroll and fixed column minimum widths.

## G2-4-029-050  [P2] GAP  facet F17  effort S
- Legacy: Semantic table column headers (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:149-160`)
- vNext now: role=feed with article list (`src/components/projects/project-activity-filtered-list.tsx:119-130`)
- Fix: Preserve table semantics for four-column audit and accessible announcements.

## G2-4-029-053  [P2] GAP  facet F18  effort S
- Legacy: Placeholder `Search resource or actor` (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:117-118`)
- vNext now: Placeholder `Search activity` (`src/components/projects/project-activity-filtered-list.tsx:71-74`)
- Fix: Use exact placeholder.

## G2-4-029-057  [P2] GAP  facet F19  effort M
- Legacy: Filtering all loaded resource events client-side, 10 per page (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:36-54`)
- vNext now: Initial activity 100 and Load more cursor (`src/components/projects/project-activity-filtered-list.tsx:19-45`)
- Fix: Avoid filtered results silently omitting older resource rows; provide server-side resource filters.

## G2-4-029-058  [P2] GAP  facet F20  effort S
- Legacy: Mounted flag prevents state update after unmount (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:25-45`)
- vNext now: Load-more guarded by useRef lock, not same cancellation (`src/components/projects/project-activity-filtered-list.tsx:25-48`)
- Fix: Prevent stale results when projectId changes or tab unmounts.

## G2-4-029-054  [P3] GAP  facet F18  effort S
- Legacy: Action dropdown All actions/Added/Edited/Saved/Removed (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:125-130`)
- vNext now: All resource changes/Added/Edited/Saved/Removed (`src/components/projects/project-activity-filtered-list.tsx:75-81`)
- Fix: Restore exact All actions copy.
