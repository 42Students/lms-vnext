# Work packet: edit src/components/projects/project-admin-audit-page.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u030-superadmin-project-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-7-030-003  [P1] GAP  facet F01  effort M
- Legacy: audit/index.js:398-404 entity workspace Open goes to /superadmin/projects/workspaces/{id}/summary?from=audit
- vNext now: project-admin-audit-page.tsx:93-127 ActivityCenter display with no matching workspace Open per item
- Fix: Add direct workspace Open link with from=audit and UUID crosswalk

## G2-7-030-020  [P1] GAP  facet F04  effort M
- Legacy: audit/index.js:285-292 summary action count, unique actors, destructive count from loaded items
- vNext now: project-admin-audit-page.tsx:303-310 counts groups and latest actor of each group
- Fix: Count raw events/actors rather than group representatives; disclose aggregation

## G2-7-030-023  [P1] GAP  facet F05  effort M
- Legacy: audit/index.js:635-645 All time only paginated 25/page; today/7d/30d up to200
- vNext now: project-admin-audit-page.tsx:65-79 always limit40 cursor events
- Fix: Implement 200 wide range / 25 all-time and cap disclosure

## G2-7-030-027  [P1] GAP  facet F06  effort L
- Legacy: audit/index.js:577-584 actionKey optional clearable with exact legacy options
- vNext now: project-admin-audit-page.tsx:217-223 projects.* event types options
- Fix: Map all old action keys, including PROJECT_TEMPLATE_* and role actions

## G2-7-030-036  [P1] GAP  facet F08  effort M
- Legacy: audit/index.js:295-297 labels cap reach first200 and statistics as floors
- vNext now: project-admin-audit-page.tsx:303-314 Actions shown from grouped 40 events, no cap warning
- Fix: Disclose partial coverage and per-page count everywhere

## G2-7-030-042  [P1] GAP  facet F10  effort L
- Legacy: AdminService.js:473-474 GET /api/v1/admin/projects/audit with collegeId, actionKey, entityId, sinceMillis, page, size
- vNext now: project-admin-audit-page.tsx:65-79 listActivityEvents with module,importance,eventType,subjectId,from,to,before cursor
- Fix: Create field and event taxonomy mapping of legacy admin audit to activityEvents

## G2-7-030-048  [P1] GAP  facet F12  effort M
- Legacy: audit/index.js:76-101 explicit destructive action set includes release deletion after ship/template unassign
- vNext now: project-admin-audit-page.tsx:308-310 regex archive/delete/revoke/remove/unassign
- Fix: Use exact audited destructive event taxonomy, not regex on latest group row

## G2-7-030-051  [P1] GAP  facet F12  effort M
- Legacy: audit/index.js:285-293 counts on individual actions
- vNext now: project-admin-audit-page.tsx:303-310 counts event group counts and unique latest actor
- Fix: Correct statistics so grouped actors not undercounted

## G2-7-030-070  [P1] GAP  facet F19  effort L
- Legacy: audit/index.js:110-115 fetches200 for short ranges and25 for All
- vNext now: project-admin-audit-page.tsx:78 limit40
- Fix: Paginate or count all actions in range, disclose truncation

## G2-7-030-075  [P1] GAP  facet F21  effort L
- Legacy: audit/index.js:10 API AdminAuditLogRepository supports global template events for Super Admin
- vNext now: project-admin-audit-page.tsx:58-60 globalTemplateAudit, listActivityEvents:65-79
- Fix: Map global template history and old audit logs into shared activity events

## G2-7-030-081  [P1] GAP  facet F23  effort M
- Legacy: audit/index.js:525-571 three summary cards reflect loaded rows
- vNext now: project-admin-audit-page.tsx:303-315 stat tiles from groups
- Fix: Ensure precise counts and qualifiers across both presentations

## G2-15-017-001  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:71-100 workspace-specific audit tab
- vNext now: src/components/projects/project-admin-audit-page.tsx:193-211 global project audit; no resource-history page
- Fix: Implement scoped workspace Resource activity subpage with exact route/navigation

## G2-7-030-031  [P2] GAP  facet F07  effort S
- Legacy: audit/index.js:508 Audit log could not be loaded with specific error
- vNext now: project-admin-audit-page.tsx:82-89 Project audit unavailable generic error
- Fix: Match exact heading and sanitized server detail

## G2-7-030-033  [P2] GAP  facet F07  effort M
- Legacy: audit/index.js:261-276 failed load clears items and title Failed to load audit log.
- vNext now: project-admin-audit-page.tsx:80-90 ErrorState, Retry audit
- Fix: Show legacy fallback and retry inside shell

## G2-7-030-037  [P2] GAP  facet F08  effort S
- Legacy: audit/index.js:508 shows error Alert after failure
- vNext now: project-admin-audit-page.tsx:82-90 full ErrorState
- Fix: Match error feedback tone/position

## G2-7-030-038  [P2] GAP  facet F08  effort S
- Legacy: audit/index.js:499 Refresh loading indicator on header Button
- vNext now: project-admin-audit-page.tsx:318 simple Refresh link without pending state
- Fix: Add visible loading feedback and disabled repeated action
