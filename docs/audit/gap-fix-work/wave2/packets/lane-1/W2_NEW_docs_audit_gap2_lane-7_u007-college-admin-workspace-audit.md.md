# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u007-college-admin-workspace-audit.md

25 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u007-college-admin-workspace-audit.md

## G2-7-007-004  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:73-88: AdminWorkspaceShell title is workspace name, fixed subtitle and View audit trail header action.
- vNext now: V/components/projects/project-workspace.tsx:1658-1672: section intro h2 Activity and body subtitle, link within section.
- Fix: Put resource-audit page title, subtitle and full-audit CTA at workspace header positions.

## G2-7-007-006  [P2] GAP  facet F02  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:88-97: eyebrow `Resource activity`, headline and helper paragraph.
- vNext now: V/components/projects/project-workspace.tsx:1659-1666: heading `Activity`, generic task/sprint/resource subtitle.
- Fix: Restore resource-specific section hierarchy and content.

## G2-7-007-008  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:7-12,69-72: Action color-coded tags, green Added, gold Edited, blue Saved, red Removed.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:132-135: both neutral event type/category badges.
- Fix: Map resource-event type to four labeled colored tags.

## G2-7-007-009  [P2] MISSING  facet F03  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:99-111: four metric tiles Changes, Added, Edited, Removed.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:69-109: no metric tiles or resource action totals.
- Fix: Add four counts from full resource audit rows, not filtered list or first 100 global events.

## G2-7-007-010  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:18-29,63-85: Resource name strips `resource-` prefix, hyphen replacement, initial capital; `—` fallback.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:119-135: generic event.summary and taxonomy labels; no resourceKey transformation.
- Fix: Render dedicated normalized resourceKey with equivalent fallback.

## G2-7-007-011  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:14-16,74-85: Actor combines actorName/userId with actorUserType Staff/Student/Admin.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:124-130: actorDisplayName or System; no ID fallback or role.
- Fix: Include actor ID and actor role in resource history projection and Actor cell.

## G2-7-007-012  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:7-12: UPSERT=Saved, CREATE=Added, UPDATE=Edited, DELETE=Removed.
- vNext now: V/modules/projects/project-resource-audit-model.ts:3-10: taxonomy suffix `.created/.updated/.archived/.saved` normalized to Added/Edited/Removed/Saved, with no UPSERT mapping unless produced as `.saved`.
- Fix: Provide stable legacy actionType adapter, including UPSERT preserving Saved.

## G2-7-007-016  [P2] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:56-61: metrics counted on all resource records independent of client search/action filter.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:55-67: only filtered event list count, not action-category totals.
- Fix: Aggregate each resource-action category over unfiltered scoped audit set.

## G2-7-007-017  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:114-120: Input.Search allowClear, placeholder `Search resource or actor` and aria label `Search resource audit`.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:70-74: Input Search activity, searches summary,actorDisplayName,eventType only.
- Fix: Restore exact placeholder and searchable resourceKey/actorName/userId/actorType/action values.

## G2-7-007-018  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:121-131: Action dropdown All actions / Added / Edited / Saved / Removed.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:75-81: Resource change dropdown All resource changes and four actions plus separate Type and Date controls.
- Fix: Use legacy dropdown title and action keys; avoid mixing non-resource events into ALL.

## G2-7-007-019  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:31-54: instant client search/action select updates filtered rows and resets table paging.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:49-68: instant event filter, but range/date/type filters are extra and pager absent.
- Fix: Make action/search affect only resource audit and reset 10-row page.

## G2-7-007-030  [P2] GAP  facet F11  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:53-69: no college renders warning within AdminWorkspaceShell including tabs.
- vNext now: V/components/projects/admin-project-section-page.tsx:21-40: request context required; no in-component `no college` state.
- Fix: Use scoped warning and preserve workspace tabs in no-college state.

## G2-7-007-033  [P2] GAP  facet F12  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:58-60: edited metric combines UPDATE and UPSERT; Saved remains separately selectable.
- vNext now: V/modules/projects/project-resource-audit-model.ts:3-10: Saved maps `.saved` only; no aggregate edited metric.
- Fix: Count Saved as Edited in metric, retain separate Saved filter.

## G2-7-007-035  [P2] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:42-52: search includes raw actorUserId/userType and resourceKey.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:57-66: searches only summary/actorDisplayName/eventType.
- Fix: Extend search contract to legacy all-five fields before pagination.

## G2-7-007-037  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:144-147: empty descriptions distinguish no history and no match.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:110-118: `No project activity yet` or `No matching activity` generic with longer descriptions.
- Fix: Use `No resource changes yet` and `No resource changes match these filters` verbatim.

## G2-7-007-041  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:149-159: horizontally scrollable 4-column compact table on narrow screens.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:119-138: stacked responsive article feed, no horizontal table.
- Fix: Restore x-scroll table and 10-per-page pager on mobile.

## G2-7-007-042  [P2] GAP  facet F16  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:99-112: four horizontal metric tiles wrap via CSS at small breakpoints.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:69-109: no equivalent metric grid.
- Fix: Use legacy 4-cell responsive count grid.

## G2-7-007-044  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:149-159: semantic table headers, keyboard-accessible pagination.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:119-142: role=feed, Load more button; no column relationships.
- Fix: Use accessible four-column table with paging buttons and total.

## G2-7-007-045  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:75-86: subtitle `Trace resource changes here, or open the full project audit trail for broader events.` and `View audit trail`.
- vNext now: V/components/projects/project-workspace.tsx:1658-1670: subtitle `Task moves, sprint updates and resource changes from your project.` and `View full project audit`.
- Fix: Restore exact workspace audit subtitle/action label.

## G2-7-007-046  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:90-96: `Resource activity`, `See who changed project resources and when`, explicit context helper.
- vNext now: V/components/projects/project-workspace.tsx:1660-1666: `Activity` plus generalized project activity subtitle.
- Fix: Restore three exact resource-audit strings.

## G2-7-007-047  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:117-131: `Search resource or actor`, `All actions` and Added/Edited/Saved/Removed.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:70-81: `Search activity`, `All resource changes`, extra Date/Type labels.
- Fix: Match legacy control labels.

## G2-7-007-048  [P2] GAP  facet F19  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:31-51: fetches only workspace summary and resource history on audit route.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: 8 services in Promise.all plus roster/template/comments lookups at :68-112.
- Fix: Avoid costly meeting, task-submission, delivery reads for resource-audit-only page.

## G2-7-007-007  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:81-85: AuditOutlined button for full audit trail.
- vNext now: V/components/projects/project-workspace.tsx:1669-1670: plain text link without audit icon.
- Fix: Add audit icon and secondary button visual.

## G2-7-007-013  [P3] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:84: When full timestamp via formatTimestamp.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:125-129: primarily relative time, with native title full locale.
- Fix: Show full formatted timestamp in When column, keep full timestamp tooltip.

## G2-7-007-043  [P3] GAP  facet F17  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:114-133: aria-label Search resource audit and Filter audit actions.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:70-81: visible Search activity/Resource change labels, different names.
- Fix: Restore accessible names and consistent keyboard search/filter focus.
