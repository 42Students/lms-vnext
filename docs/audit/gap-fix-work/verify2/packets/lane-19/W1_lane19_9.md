# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-012-064 [P1] GAP facet F23
- Files: src/components/projects/project-workspace.tsx, src/components/projects/project-workspace-readiness.tsx
- Legacy: WorkspaceReadinessOverview.jsx:45-105 hero and override facts visible
- Expected fix: Unify canonical renderer and restore missing facts

## G2-7-013-016 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144: optional key preview from title, saved stable generated key
- Expected fix: Preserve legacy resource key identity and link references during migration

## G2-7-014-019 [P1] GAP facet F05
- Files: src/components/projects/project-workspace.tsx
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:62-95: add/remove/Undo/move unsaved rows
- Expected fix: Restore multirow save/undo/reorder or document deliberate reduction

## G2-7-014-036 [P1] GAP facet F09
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:104-108 inline Undo remove message
- Expected fix: Provide reversible removal path or record hard-delete vs staged edit rationale

## G2-7-015-044 [P1] GAP facet F09
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:312-362 unsaved edits guarded across tabs
- Expected fix: Add dirty guard for Cancel, Back, tabs and reload

## G2-7-015-084 [P1] GAP facet F23
- Files: src/components/projects/project-workspace.tsx
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:474-537 Change template, Archive, Delete and preview summary cards
- Expected fix: Bring back missing template/delete operations, document Restore as new control

## G2-7-016-042 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:280-345 key generation preserves task->sprint links
- Expected fix: Carry key mapping and linked meetings through migration

## G2-7-017-034 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:411-424 500 total validator detailed current/adding counts
- Expected fix: Surface exact count-based 500 limit warning and handle 100+ cases

## G2-7-018-029 [P1] GAP facet F08
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:93-101 success Workspace restored; mentorless warning Workspace restored, but its mentor could not be recovered — assign one to reactivate it.
- Expected fix: Preserve mentorless warning and restoration outcome handling

## G2-7-021-018 [P1] GAP facet F04
- Files: src/modules/projects/mentor-overload-model.ts
- Legacy: reassign-mentor.js:155-163 threshold max(avg*1.5, avg+3), >= threshold
- Expected fix: Match floor threshold plus >= comparison on boundary

## G2-7-021-056 [P1] GAP facet F12
- Files: src/modules/projects/mentor-overload-model.ts
- Legacy: reassign-mentor.js:158-163 overload threshold max(1.5x average, average+3), >=
- Expected fix: Match floor and threshold boundary exactly

## G2-7-027-017 [P1] GAP facet F03
- Files: src/components/projects/project-workspace.tsx
- Legacy: PDC:7113-7124 Project team and member count plus Add member action
- Expected fix: Record removed mentor action and restore count/heading; resolve intentional permission decision

## G2-7-027-057 [P1] GAP facet F12
- Files: src/components/projects/project-workspace.tsx
- Legacy: PDC:858-860 editable when mentor and not archived
- Expected fix: Test legacy completed-state edit rule and specify intentional lock

## G2-7-028-004 [P1] GAP facet F01
- Files: src/modules/projects/mentor-project-list-query.ts
- Legacy: ProjectsContent.jsx:154-193 URL search,status,attention,page uses page=0-based
- Expected fix: Translate old positive 0-based bookmarked page numbers without off-by-one

## G2-7-028-026 [P1] GAP facet F04
- Files: src/app/(authenticated)/mentor/projects/page.tsx
- Legacy: ProjectsContent.jsx:397-419 nextAction hidden when archived
- Expected fix: Suppress stale nextAction/action links on archived workspaces

## G2-7-028-086 [P1] GAP facet F20
- Files: src/modules/projects/mentor-project-list-query.ts
- Legacy: ProjectsContent.jsx:154-165 accepts 0-based URL page bookmarks
- Expected fix: Migrate all old bookmark pages consistently

## G2-7-029-004 [P1] GAP facet F01
- Files: src/modules/projects/admin-risk-query-model.ts
- Legacy: superadmin/projects/at-risk/index.js:82-101 URL filter and search are hydrated and persisted
- Expected fix: Translate legacy filter=stalled/blocker/review and search= into modern riskBucket/q

## G2-7-029-086 [P1] GAP facet F20
- Files: src/modules/projects/admin-risk-query-model.ts
- Legacy: superadmin/projects/at-risk/index.js:82-101 restores filter/search exact URL and shallow replace
- Expected fix: Translate old bookmarks before strict parsing

## G2-7-030-020 [P1] GAP facet F04
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: audit/index.js:285-292 summary action count, unique actors, destructive count from loaded items
- Expected fix: Count raw events/actors rather than group representatives; disclose aggregation

## G2-7-030-027 [P1] GAP facet F06
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: audit/index.js:577-584 actionKey optional clearable with exact legacy options
- Expected fix: Map all old action keys, including PROJECT_TEMPLATE_* and role actions

## G2-7-030-036 [P1] GAP facet F08
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: audit/index.js:295-297 labels cap reach first200 and statistics as floors
- Expected fix: Disclose partial coverage and per-page count everywhere

## G2-7-030-042 [P1] GAP facet F10
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: AdminService.js:473-474 GET /api/v1/admin/projects/audit with collegeId, actionKey, entityId, sinceMillis, page, size
- Expected fix: Create field and event taxonomy mapping of legacy admin audit to activityEvents

## G2-7-030-048 [P1] GAP facet F12
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: audit/index.js:76-101 explicit destructive action set includes release deletion after ship/template unassign
- Expected fix: Use exact audited destructive event taxonomy, not regex on latest group row

## G2-7-030-051 [P1] GAP facet F12
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: audit/index.js:285-293 counts on individual actions
- Expected fix: Correct statistics so grouped actors not undercounted

## G2-7-030-070 [P1] GAP facet F19
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: audit/index.js:110-115 fetches200 for short ranges and25 for All
- Expected fix: Paginate or count all actions in range, disclose truncation

### Lane-5 fast verification triage (2026-10-22)
- **G2-7-012-064 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-013-016 — DEFERRED**: New-feature or migration contract must be traced; no OK claim.
- **G2-7-014-019 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-014-036 — DEFERRED**: New-feature or migration contract must be traced; no OK claim.
- **G2-7-015-044 — DEFERRED**: New-feature or migration contract must be traced; no OK claim.
- **G2-7-015-084 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-016-042 — DEFERRED**: New-feature or migration contract must be traced; no OK claim.
- **G2-7-017-034 — DEFERRED**: New-feature or migration contract must be traced; no OK claim.
- **G2-7-018-029 — DEFERRED**: New-feature or migration contract must be traced; no OK claim.
- **G2-7-021-018 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-021-056 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-027-017 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-027-057 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-028-004 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-028-026 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-028-086 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-029-004 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-029-086 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-030-020 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-030-027 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-030-036 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-030-042 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-030-048 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-030-051 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
- **G2-7-030-070 — DEFERRED**: Source located; functional parity is not established from presence alone; no OK claim.
