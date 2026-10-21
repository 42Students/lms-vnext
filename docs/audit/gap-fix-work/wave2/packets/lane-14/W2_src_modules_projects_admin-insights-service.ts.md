# Work packet (wave 2): edit src/modules/projects/admin-insights-service.ts

28 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md, docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md, docs/audit/gap2/lane-7/u029-superadmin-at-risk.md

## G2-10-031-038  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:99-106 — clamp page when delete/filter shrinks total.
- vNext now: src/modules/projects/admin-insights-service.ts:164-175 — project list may return empty out-of-range page.
- Fix: Standardize page clamp after deletes.

## G2-10-031-054  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:95-106 — last page clamped after removal.
- vNext now: src/modules/projects/admin-insights-service.ts:164-175 — no out-of-range total redirect.
- Fix: Define shared clamp after change.

## G2-10-031-057  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:81-103 — URL q/status/page/size, default20, 1-based in UI.
- vNext now: src/modules/projects/admin-projects-query-model.ts:26-55 — project URL parser defaults/allow-list; DB LIMIT/OFFSET src/modules/projects/admin-insights-service.ts:154-161.
- Fix: Create shared query convention with per-list allowed filters.

## G2-10-028-014  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:250-263; docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:125-142 — progress = rounded done tasks+sprints / all.
- vNext now: src/modules/projects/admin-insights-service.ts:18-19; src/modules/projects/progress-percentage-policy.ts:1-6 — noncomplete cap at 99.
- Fix: Reconcile progress numerator and rounding.

## G2-10-028-022  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:141-170 — reclamp on archive making last page empty.
- vNext now: src/modules/projects/admin-insights-service.ts:164-175 — returns empty out-of-range page.
- Fix: Reclamp after deletion/archive.

## G2-10-028-033  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:136-170 and docs/legacy-source/frontend/src/api/Services/AdminService.js:377-380 — GET /api/v1/admin/projects/page?collegeId,status,search,page,size.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:104-111 and src/modules/projects/admin-insights-service.ts:86-160 — direct database service with scoped query.
- Fix: Reproduce old status/search/default/response semantics.

## G2-10-028-038  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:125-142 — progress formula includes task+sprint completion.
- vNext now: src/modules/projects/admin-insights-service.ts:18-19; src/modules/projects/progress-percentage-policy.ts:1-6 — capped rounding.
- Fix: Align status/progress boundary.

## G2-10-028-054  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:141-170 — archive last row reclamps page.
- vNext now: src/modules/projects/admin-insights-service.ts:164-175 — empty out-of-range remains.
- Fix: Reclamp page.

## G2-10-028-057  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:113-142 — members array and tasks/sprints completion.
- vNext now: src/db/schema/projects.ts:172-198 and src/modules/projects/admin-insights-service.ts:178-189 — normalized table aggregates.
- Fix: Compare member/archival and completion inclusion.

## G2-2-020-012  [P2] GAP  facet F04  effort M
- Legacy: AdminProjectController.java:273-313 unbounded list plus paged 25 default
- vNext now: src/app/api/projects/route.ts:12-27 unpaged GET; admin-insights-service.ts:86-110 paged summaries
- Fix: Document paged API and use it for large admin lists.

## G2-11-028-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:96-100`
- vNext now: `src/modules/projects/admin-insights-service.ts:147-150`
- Fix: Legacy deleted records may retain original status/blocker; vNext archived row has current status and archivedAt timestamp; map recovered status consistently.

## G2-11-028-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:47-54`
- vNext now: `src/modules/projects/admin-insights-service.ts:134-160`
- Fix: Legacy GET /deleted supports server page number/size and totalRecords, no query; vNext listProjectAdminSnapshots combines optional q/status with SQL limit-offset.

## G2-11-028-019  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:53-57`
- vNext now: `src/modules/projects/admin-insights-service.ts:154-160`
- Fix: Legacy automatically steps back when last deleted row is restored from non-first page; vNext refresh does not explicitly decrement an overrun page after restore.

## G2-11-028-021  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:30-31`
- vNext now: `src/modules/projects/admin-insights-service.ts:57-70`
- Fix: Legacy initial deleted pageSize=20 with selectable 10/20/50/100; vNext service schema default pageSize=25 and min10 max100.

## G2-11-028-035  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:53-59`
- vNext now: `src/modules/projects/admin-insights-service.ts:134-160`
- Fix: Legacy deleted list totalRecords refreshed after each restore; vNext listing total for all statuses/filtered archived recalculated on SSR refresh.

## G2-11-028-060  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:47-48`
- vNext now: `src/modules/projects/admin-insights-service.ts:129-133`
- Fix: Legacy cheap deleted-only predicate vs vNext listProjectAdminSnapshots reads aggregated project insights for archived rows, more query work.

## G2-11-028-061  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:206-207`
- vNext now: `src/modules/projects/admin-insights-service.ts:155-160`
- Fix: Legacy configurable deleted pageSize20 default, vNext default25; impact on data volume and next page relative indices.

## G2-11-028-065  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:43-49`
- vNext now: `src/modules/projects/admin-insights-service.ts:86-115`
- Fix: Legacy reads Spring ProjectWorkspaceService deleted collection; vNext PostgreSQL project_instances query and aggregates, different operational instrumentation.

## G2-7-019-031  [P2] GAP  facet F05  effort S
- Legacy: AdminProjectController.java:306-325 uses search/status/page/size; workspaces/index.js:131
- vNext now: admin-insights-service.ts:127-161 server pagination, q/status/page/pageSize
- Fix: Maintain legacy URL search alias and zero-to-one based conversion on migrated links.

## G2-7-019-079  [P2] GAP  facet F19  effort S
- Legacy: AdminProjectController.java:300-325 paginated endpoint supports 0-based page and capped size; workspaces/index.js:43-45 starts size20
- vNext now: admin-insights-service.ts:57-71,134-161 1-based and default25, database limit/offset
- Fix: Default 20, preserve range display, and test legacy deep links converted.

## G2-7-029-026  [P2] GAP  facet F05  effort S
- Legacy: superadmin/projects/at-risk/index.js:239 Workspace alphabetical sortable
- vNext now: admin-insights-service.ts:617-624 default inactivity sorting unless riskSort chosen
- Fix: Expose Workspace-sort toggle with legacy comparator

## G2-7-029-027  [P2] GAP  facet F05  effort M
- Legacy: superadmin/projects/at-risk/index.js:255-256 Severity defaultSortOrder descend
- vNext now: admin-insights-service.ts:617-624 default lastActivityAt ascending
- Fix: Default severity descending with stable tie order

## G2-7-029-030  [P2] GAP  facet F05  effort M
- Legacy: superadmin/projects/at-risk/index.js:175-180 text search refines visible page; server query debounced
- vNext now: admin-insights-service.ts:501-513 searches title/slug/id on server
- Fix: Match visible row refinement and mentor display name search

## G2-7-029-046  [P2] GAP  facet F10  effort L
- Legacy: AdminService.js:377-380 GET /api/v1/admin/projects/page with view=AT_RISK and three AT_RISK_* views
- vNext now: admin-insights-service.ts:477-579 direct DB query per risk bucket, no public view string
- Fix: Map old server view semantics to riskBucket/SQL using exact criteria

## G2-7-029-057  [P2] GAP  facet F12  effort M
- Legacy: adminProjectUtils.js:228-246 staleDays null for no timestamp
- vNext now: admin-insights-service.ts:521-530 computes greatest persisted timestamps including project updatedAt
- Fix: Distinguish no reliable activity from project row update timestamp

## G2-7-029-082  [P2] GAP  facet F19  effort M
- Legacy: superadmin/projects/at-risk/index.js:69-75 debounce server search 300ms, instant local filtering
- vNext now: admin-insights-service.ts:501-513 server search as URL GET
- Fix: Match immediate visible narrowing and delayed network load

## G2-7-029-090  [P2] GAP  facet F21  effort L
- Legacy: superadmin/projects/at-risk/index.js:9 AdminService page endpoint with view signal
- vNext now: admin-insights-service.ts:477-630 direct SQL risk signals, no external integrations
- Fix: Document old view endpoints and new SQL mapping, especially task blockers

## G2-7-001-035  [P3] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:92-99; api/Services/AdminService.js:380-385: parallel GET /api/v1/admin/projects/page page 0/size1 for four counts and page/size25 for list.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:55-57; modules/projects/admin-insights-service.ts:497-630: direct Drizzle transaction aggregates and paginated query.
- Fix: Preserve functional response shape; document no standalone vNext GET API.
