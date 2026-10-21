# Work packet (wave 2): edit src/app/(authenticated)/activity/page.tsx (part 2 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-audit-hub.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md, docs/audit/gap2/lane-10/superadmin-audit.md

## G2-9-026-003  [P2] GAP  facet F01  effort S
- Legacy: Scope banner shows exact one of Showing this college / Showing this organization / Platform-wide activity `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:10-31`
- vNext now: Single border-bottom text status College:... / Organization-wide activity / Platform-wide activity `src/app/(authenticated)/activity/page.tsx:230-236`
- Fix: Use informational Ant Alert banner with per-scope exact wording.

## G2-9-026-004  [P2] GAP  facet F02  effort L
- Legacy: Hub has banner then uninterrupted ActivityCenter feed `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:9-35`
- vNext now: PageHeader with export/board links, scope line, presets navigation, date chips, extensive filter form `src/app/(authenticated)/activity/page.tsx:210-252`
- Fix: Restore banner then compact feed; move extra filters to disclosure.

## G2-9-026-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy one bar houses category Segmented and range Segmented plus Refresh/Export `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:178-188`
- vNext now: Preset link groups plus four-column Filter form, Export in header, no Refresh button `src/app/(authenticated)/activity/page.tsx:237-252,389-410`
- Fix: Show both segmented bars and adjacent Refresh/Export in legacy order.

## G2-9-026-007  [P2] GAP  facet F03  effort M
- Legacy: Six category Segmented options and four date-range segmented options `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:23-37,180-187`
- vNext now: Category links in collapsed details and date links styled as outlined pills `src/app/(authenticated)/activity/page.tsx:90-97,237-250`
- Fix: Use Ant-like selected segmented control and default highlighted Important/30 days.

## G2-9-026-008  [P2] MISSING  facet F03  effort S
- Legacy: Refresh button with ReloadOutlined, loading spinner, small Export icon `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:184-187`
- vNext now: Header Export and audit findings; no Refresh `src/app/(authenticated)/activity/page.tsx:212-227`
- Fix: Add explicit Refresh that re-queries same filters with preserved data.

## G2-9-026-009  [P2] GAP  facet F03  effort S
- Legacy: Important category hint displays meaningful deletions, restores, promotions, suspensions etc `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:189-193`
- vNext now: Short preset helper Choose a preset... Important activity shows high-priority events `src/app/(authenticated)/activity/page.tsx:90-97,237-243`
- Fix: Restore full Important-hint sentence below toolbar.

## G2-9-026-018  [P2] GAP  facet F05  effort M
- Legacy: Ranges today, 7d, 30d, all; 7d begins day seven days ago `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:32-44`
- vNext now: Date chips Today/7days/30days/All time with 6/29-day lookback `src/app/(authenticated)/activity/page.tsx:74-97,244-250`
- Fix: Match exact included day boundaries and backdated events.

## G2-9-026-021  [P2] GAP  facet F05  effort M
- Legacy: Load more appends 50 rows beneath current feed `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:250-255`
- vNext now: 50 rows per page, Load more navigates to older URL replacing shown page `src/app/(authenticated)/activity/page.tsx:129-131,172-208` `src/components/activity/activity-center.tsx:197-204`
- Fix: Keep prior rows in view during Load more; support cumulative timeline.

## G2-9-026-032  [P2] GAP  facet F09  effort S
- Legacy: Scope info is Alert not modal `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:10-31`
- vNext now: Scope shown as plain status line `src/app/(authenticated)/activity/page.tsx:230-236`
- Fix: Restore banner for each scope.

## G2-9-026-033  [P2] GAP  facet F10  effort M
- Legacy: GET /api/v1/superadmin/audit, params category,since,page,size,org/college `docs/legacy-source/frontend/src/api/Services/SuperAdminAuditService.js:1-4` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:99-107`
- vNext now: Calls listActivityEvents server-side with module,importance,from,to,cursor,limit50 `src/app/(authenticated)/activity/page.tsx:99-131`
- Fix: Map old API query semantics and pagination to new service.

## G2-9-026-035  [P2] GAP  facet F10  effort M
- Legacy: Export local loaded rows to activity-CATEGORY-YYYY-MM-DD.csv `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:156-175`
- vNext now: Server CSV Export queries newest full filtered set `src/app/(authenticated)/activity/page.tsx:194-221`
- Fix: Match filename and selected-range behavior or document full-export enhancement.

## G2-9-026-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy response includes items,page,size,total,actorNames,targetNames `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:105-125`
- vNext now: New grouped activity entries and nextCursor; actors embedded `src/app/(authenticated)/activity/page.tsx:98-170`
- Fix: Document response DTO mapping and name fallback

## G2-9-026-042  [P2] GAP  facet F13  effort M
- Legacy: Refresh shows Refreshing activity… while preserving old rows `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:195-205`
- vNext now: SSR page has no explicit same-query Refresh UI/status `src/app/(authenticated)/activity/page.tsx:210-252`
- Fix: Add Refresh control/status and same-scope results preservation.

## G2-9-026-043  [P2] GAP  facet F13  effort M
- Legacy: Six-row ListSkeleton Loading activity on initial/changed scope `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:203-209`
- vNext now: Server rendering and route loader; no inline feed skeleton in source `src/app/(authenticated)/activity/page.tsx:210-252`
- Fix: Match list loading skeleton and retry state.

## G2-9-026-044  [P2] GAP  facet F13  effort M
- Legacy: Refresh failure retains rows for same query but clears when changed `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:117-129`
- vNext now: Server loader failure can replace whole page; no local snapshot `src/app/(authenticated)/activity/page.tsx:99-131`
- Fix: Preserve existing scoped feed when Refresh fails.

## G2-9-026-049  [P2] GAP  facet F16  effort M
- Legacy: Legacy two segmented toolbars and compact feed responsive via CSS `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:179-188`
- vNext now: New responsive form grid and article cards `src/app/(authenticated)/activity/page.tsx:237-252` `src/components/activity/activity-center.tsx:113-207`
- Fix: Match header/control density and day-separator gap on desktop/mobile.

## G2-9-026-051  [P2] GAP  facet F18  effort S
- Legacy: Literal scope info messages and detailed instructions to change header scope `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:10-31`
- vNext now: Short status sentence and new in-page college selector `src/app/(authenticated)/activity/page.tsx:230-236`
- Fix: Restore full legacy scope messages.

## G2-9-026-054  [P2] GAP  facet F19  effort M
- Legacy: 50-row pages with append and total `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:21-22,100-107`
- vNext now: 50 limit per cursor with grouped summaries (may collapse multiple events) `src/app/(authenticated)/activity/page.tsx:129-131` `src/components/activity/activity-center.tsx:197-204`
- Fix: Clarify whether 50 means raw events or groups, show accurate remaining.

## G2-9-026-058  [P2] GAP  facet F21  effort L
- Legacy: Depends on SuperAdminAuditService, activityText descriptor and project date parser `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:6-10`
- vNext now: New activity taxonomy, listActivityEvents and metadata sanitizer `src/modules/activity/service.ts:45-113` `src/app/(authenticated)/activity/page.tsx:98-131`
- Fix: Map legacy action keys to new event taxonomy and humanized prose.

## G2-9-026-064  [P2] GAP  facet F23  effort S
- Legacy: Unscoped Super Admin sees full platform activity info banner `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:23-31`
- vNext now: Status says Platform-wide activity; no full instructions `src/app/(authenticated)/activity/page.tsx:230-236`
- Fix: Restore explanatory platform-wide warning text.

## G2-9-027-003  [P2] GAP  facet F01  effort S
- Legacy: Unscoped when not allowGlobal: Select a College to view audit logs warning `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:238-251`
- vNext now: Global Super Admin sees platform activity; college scope optional `src/app/(authenticated)/admin/audit/page.tsx:10-23` `src/app/(authenticated)/activity/page.tsx:230-236`
- Fix: Honor allowGlobal setting at call site; warn scoped-only views without college.

## G2-9-027-004  [P2] GAP  facet F02  effort M
- Legacy: Top framed Card title Audit Logs with five inputs, RangePicker, Search/Export `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:250-299`
- vNext now: Independent PageHeader, presets and filter grid, no Audit Logs Card `src/app/(authenticated)/activity/page.tsx:210-252,290-390`
- Fix: Restore bordered Audit Logs card and compact controls.

## G2-9-027-006  [P2] GAP  facet F02  effort M
- Legacy: Embedded fixed-record mode can hide filter Card fields and simplify table `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:21-28`
- vNext now: Shared page always shows filter form with more filters `src/app/(authenticated)/activity/page.tsx:252-392`
- Fix: Support hideFilters mode and retain Refresh/Export.

## G2-9-027-007  [P2] GAP  facet F03  effort S
- Legacy: Search primary, Export CSV secondary inline `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:281-285`
- vNext now: Apply filters primary, server Export header action `src/app/(authenticated)/activity/page.tsx:390-412,217-221`
- Fix: Use exact Search/Export CSV labels and position.

## G2-9-027-008  [P2] MISSING  facet F03  effort S
- Legacy: When hideFilters, controls are Refresh and Export CSV `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:289-297`
- vNext now: No equivalent hideFilters flag or Refresh control `src/app/(authenticated)/activity/page.tsx:210-228`
- Fix: Add fixed-entity Refresh/Export toolbar.

## G2-9-027-009  [P2] GAP  facet F03  effort M
- Legacy: Ant DatePicker.RangePicker From(any)/To(any) inclusive `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:275-280`
- vNext now: Two separate DateInput fields with From (IST), To (IST) `src/app/(authenticated)/activity/page.tsx:301-324`
- Fix: Use one range picker matching legacy placeholders.

## G2-9-027-018  [P2] GAP  facet F05  effort M
- Legacy: Five text inputs across Ant Row md widths 5/5/5/5/4 `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:254-270`
- vNext now: Native select Module/Importance/College; advanced fields in More filters `src/app/(authenticated)/activity/page.tsx:252-388`
- Fix: Recreate grid and exact input order.

## G2-9-027-021  [P2] GAP  facet F05  effort M
- Legacy: Search resets page=0; Table change supplies page and pageSize `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:109-120`
- vNext now: URL filter applies from beginning; cursor paginator no size selector `src/app/(authenticated)/activity/page.tsx:129-131,172-208`
- Fix: Restore pages 1..N and selectable page sizes.

## G2-9-027-022  [P2] GAP  facet F05  effort M
- Legacy: Default pageSize50, options25/50/100/200 `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:11,29-31,321-328`
- vNext now: Fixed limit50 in ActivityPage, no 25/100/200 selector `src/app/(authenticated)/activity/page.tsx:129-131`
- Fix: Add page-size selection/limit up to200 with backend strategy.

## G2-9-027-024  [P2] GAP  facet F06  effort S
- Legacy: Action key placeholder and Entity id fields `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:254-270`
- vNext now: Event type and Subject/entity ID fields hidden under More filters `src/app/(authenticated)/activity/page.tsx:325-371`
- Fix: Restore exact placeholders and field positions.

## G2-9-027-035  [P2] GAP  facet F10  effort M
- Legacy: Backend returns page,total,items,actorNames,targetNames `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:105-128`
- vNext now: New grouped event DTO/latest actor and cursor `src/app/(authenticated)/activity/page.tsx:133-170`
- Fix: Preserve raw row results and resolved target names in raw mode.

## G2-9-027-036  [P2] GAP  facet F10  effort M
- Legacy: Pagination supports random page number and page size `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:114-120`
- vNext now: Cursor-based Load more only, no arbitrary jump `src/app/(authenticated)/activity/page.tsx:199-208` `src/components/activity/activity-center.tsx:197-204`
- Fix: Support direct page navigation for forensic investigations.

## G2-9-027-042  [P2] GAP  facet F13  effort M
- Legacy: Changed scope clears rows; same-scope refresh retains last data `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:78-106`
- vNext now: Server renders new query; no retained client dataset `src/app/(authenticated)/activity/page.tsx:48-65,98-131`
- Fix: Keep scope-aware stale view and Retry.

## G2-9-027-043  [P2] GAP  facet F13  effort M
- Legacy: Refreshing audit logs… inline and 10x8 TableSkeleton `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:300-314`
- vNext now: New grouped cards no table skeleton in this component `src/app/(authenticated)/activity/page.tsx:210-252`
- Fix: Restore table skeleton/responsive placeholders.

## G2-9-027-052  [P2] GAP  facet F18  effort S
- Legacy: Audit Logs, Search, Export CSV exact card/action copy `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:251-255,281-285`
- vNext now: Activity Log, Apply filters, Export `src/app/(authenticated)/activity/page.tsx:212-228,390-410`
- Fix: Restore raw-mode title/buttons while keeping shared feed separate.

## G2-9-027-053  [P2] GAP  facet F18  effort S
- Legacy: Input placeholders Action key, Actor userId, OrgId, CollegeId, Entity id `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:256-269`
- vNext now: Uses College/Module/Importance/Actor user ID etc; different casing/placeholders `src/app/(authenticated)/activity/page.tsx:254-387`
- Fix: Restore exact raw forensic field labels.

## G2-9-027-054  [P2] GAP  facet F19  effort M
- Legacy: Legacy GET page up to200, shows total entries `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:11,321-329`
- vNext now: Limit50, remainingCount, grouped activity feed `src/app/(authenticated)/activity/page.tsx:129-131` `src/components/activity/activity-center.tsx:197-204`
- Fix: Implement raw server paging and exact total.

## G2-9-027-058  [P2] GAP  facet F21  effort L
- Legacy: Depends on SuperAdminAuditService, statusLabel, csvExport and scope context `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:6-9,155-184`
- vNext now: Uses activity event service, metadata sanitizer and server CSV export `src/modules/activity/service.ts:45-113` `src/app/(authenticated)/activity/page.tsx:194-221`
- Fix: Document old-to-new event/action mapping and field redaction.

## G2-10-003-048  [P3] GAP  facet F14  effort S
- Legacy: Old export is disabled when no loaded rows `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:184-187`
- vNext now: New Export always visible server link, whether results empty or not `src/app/(authenticated)/activity/page.tsx:215-221`
- Fix: Disable export with zero matching rows or show an explicit zero-row result explanation

## G2-10-003-054  [P3] GAP  facet F17  effort S
- Legacy: Old scope info has visible information icon and rich explanation `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:9-31`
- vNext now: New scope is plain status paragraph with accessible aria-label `src/app/(authenticated)/activity/page.tsx:230-236`
- Fix: Keep prominent icon and textual scope explanation
