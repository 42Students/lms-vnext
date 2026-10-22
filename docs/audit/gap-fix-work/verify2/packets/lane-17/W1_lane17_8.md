# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-027-052 [P1] GAP facet F20
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:55-67: update merges omitted start/end, enforces start<=end.
- Expected fix: Reconcile date-only legacy records into effective delivery period with timezone-safe conversion.

## G2-14-030-016 [P1] MISSING facet F06
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:320-329 roundDescription required, whitespace invalid, min10/max500, 3-row textarea and example.
- Expected fix: Add round description with exact min/max, placeholder, counter.

## G2-15-025-052 [P1] GAP facet F21
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LBE/controller/RecruiterCollegeController.java:71-75 overviewService depends on learner academic & placement metrics.
- Expected fix: Restore read-only aggregation and query-time privacy gate separate from drive pipeline.

## G2-17-031-056 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: src/modules/projects/evaluation-service.ts
- Legacy: LBE/controller/ProjectWorkspaceController.java:341-415 submissions/evaluations and history.
- Expected fix: Map every historical decision, approver, version, review and file evidence.

## G2-18-021-059 [P1] MISSING facet F22
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LBE/dto/response/JobImportantDateEventDTO.java:20,26 exposes eventType+type but no DB column in DTO.
- Expected fix: Add subtype migration/schema projection, never infer from free-text after migration.

## G2-7-001-040 [P1] GAP facet F12
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/adminProjectUtils.js:208-246: stale after >=7 days of activity timestamp; missing timestamp means not stalled.
- Expected fix: Reconcile actual activity sources and status interpretation.

## G2-7-002-078 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LBE/repository/AdminAuditLogRepository.java:14-70: projectDomainOnly project/template/task and exact entityId, createdAt DESC.
- Expected fix: Reconcile event taxonomy and subject ID semantics for audit history navigation.

## G2-7-005-026 [P1] GAP facet F09
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:160-166: old weaker modal create flow removed in favor of dedicated form.
- Expected fix: Add deep link to full workspace create form, never lightweight duplicate modal.

## G2-7-007-057 [P1] GAP facet F23
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:90-105: partial failure of workspace summary never hides audit.
- Expected fix: Prioritize resilient isolated resource-history read with independent Retry.

## G2-7-011-014 [P1] GAP facet F04
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:64-81: `definitionOfDone` array rendered newline separated.
- Expected fix: Map definitionOfDone to completionConditions bidirectionally during migration/compat read.

## G2-7-011-041 [P1] GAP facet F10
- Verification: OK — matching implementation identified in the referenced vNext component or route.
- Files: src/app/api/projects/[projectId]/brief/route.ts
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:91-111 and AdminService.js:361-362: PUT `/api/v1/admin/projects/{slug}?collegeId=N`, payload `{detailsToken, overview:{...unknown,goal,deliverables,definitionOfDone,personas}}`.
- Expected fix: Map payload keys and concurrency semantics; keep selected-college boundary on route.

## G2-7-013-014 [P1] GAP facet F04
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144-168: editable key,type,title,url,accessNotes,description,isPinned,isRequired
- Expected fix: Map isPinned -> pinned and isRequired -> required; preserve stable key on migration

## G2-7-014-027 [P1] GAP facet F06
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:26-37 useUnsavedFormGuard covers back/tab/unload
- Expected fix: Protect full-page multirow plan edits across navigation

## G2-7-015-035 [P1] GAP facet F07
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:348-354 changing estimation unit with existing estimates shows exact count warning
- Expected fix: Block mixed-unit history when existing task estimates present

## G2-7-016-036 [P1] GAP facet F10
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:77-80 tasksToken prevents whole-array stale overwrite
- Expected fix: Define equivalent concurrency on task bulk mutations

## G2-7-017-029 [P1] MISSING facet F06
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:437-450 checkbox Replace existing learners and on check seeds current learners
- Expected fix: Restore explicit replace toggle with current selection seeding

## G2-7-018-021 [P1] MISSING facet F05
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:55-59 auto page-- when last restored row leaves nonfirst page empty but total>0
- Expected fix: Implement post-restore page correction to prevent false empty page

## G2-7-020-045 [P1] GAP facet F07
- Verification: OK — matching implementation identified in the referenced vNext component or route.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:287-288 invalid cohort preflight yields Nothing was created error
- Expected fix: Render preflight load and invalid response errors explicitly

## G2-7-020-049 [P1] GAP facet F08
- Verification: OK — matching implementation identified in the referenced vNext component or route.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:335-344 partial creation and zero-workspace warning toasts
- Expected fix: Show warning with failure count and repeat-safety advice

## G2-7-020-056 [P1] GAP facet F10
- Verification: OK — matching implementation identified in the referenced vNext component or route.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: AdminService.js:347-351 POST /api/v1/admin/projects/bulk/preflight then /bulk
- Expected fix: Match preflight freshness and detailed outcome semantics

## G2-7-020-066 [P1] GAP facet F12
- Verification: OK — matching implementation identified in the referenced vNext component or route.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:283-316 refresh preflight every submit before confirmation
- Expected fix: Revalidate before each confirmation and show fresh count

## G2-7-020-094 [P1] GAP facet F19
- Verification: OK — matching implementation identified in the referenced vNext component or route.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:46-49,76-89 report in localStorage per admin/college, expires in seven days
- Expected fix: Persist per-admin report for seven days after reload

## G2-7-020-097 [P1] GAP facet F20
- Verification: OK — matching implementation identified in the referenced vNext component or route.
- Files: src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:318-346 distinguishes partial success, zero and already covered
- Expected fix: Prevent duplicate cohort writes after partial response or retry

## G2-7-027-056 [P1] GAP facet F12
- Verification: DEFERRED — requires deeper parity validation; no unsupported implementation claim.
- Files: src/app/(authenticated)/mentor/projects/[projectId]/page.tsx
- Legacy: PDC:822-871 ?tab=delivery maps overview and opens modal once
- Expected fix: Preserve legacy deep-link review initiation

## G2-7-035-040 [P1] GAP facet F10
- Verification: OK — matching implementation identified in the referenced vNext component or route.
- Files: src/components/projects/template-metadata-edit-control.tsx
- Legacy: overview.js:270-303 updateProjectTemplate sends full overview/delivery and preserves untouched unknown keys
- Expected fix: Expose versioned template blueprint revision endpoint for full Overview fields
