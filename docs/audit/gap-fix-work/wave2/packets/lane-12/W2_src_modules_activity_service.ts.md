# Work packet (wave 2): edit src/modules/activity/service.ts

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-10/superadmin-audit.md, docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md, docs/audit/gap2/lane-9/college-admin-audit.md, docs/audit/gap2/lane-9/superadmin-audit-hub.md

## G2-18-024-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:43-83 — actor names fetched in two batched faculty/learner lookups, mobile/key fallback.
- vNext now: src/modules/activity/service.ts:631-650 — joined users.displayName; no raw FACULTY:id/mobile fallback.
- Fix: Preserve old actor fallback for removed user accounts.

## G2-18-024-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:103-123 — default page0, size25; all results include total.
- vNext now: src/modules/activity/service.ts:64-104,631-685 — keyset cursor, default40; UI requests50, remainingCount.
- Fix: Restore page size/default and total if needed for legacy table.

## G2-18-024-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:132-136 — page clamped >=0, size 1..500.
- vNext now: src/modules/activity/service.ts:98-104 — limit range1..100; no positional page numbers.
- Fix: Preserve API paging contract or transition client URLs.

## G2-18-024-020  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:123, S:132-136 — size capped500 even if requested >500, page clamped.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:11-24 and src/modules/activity/service.ts:98-104 — cursor/limit <=100, fixed page UI 50.
- Fix: Provide explicit size validation or clear migration message.

## G2-18-024-029  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:184-196 — constructs actorNames/targetNames using two batched actor queries + per-kind target resolver.
- vNext now: src/modules/activity/service.ts:631-650 — SQL join to users; subjectLabel stored at write.
- Fix: Add best-effort legacy actor/target fallback without N+1.

## G2-18-024-036  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:132-136 — page defaults0 size25 max500.
- vNext now: src/modules/activity/service.ts:98-104 — default40, max100, admin page requests50.
- Fix: Define explicit parity default/maximum.

## G2-18-024-037  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:67-83 — actor display lookup failure logged as warning, raw audit rows still returned.
- vNext now: src/modules/activity/service.ts:631-650 — joined user may be null; no fallback mobile/actor key.
- Fix: Keep visible fallback actor key and nonfatal resolver failure.

## G2-18-024-045  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:36-42 — actor named or fallback mobile/raw key.
- vNext now: src/modules/activity/service.ts:631-650 — displayName/email joined; no raw legacy user type key.
- Fix: Retain human-readable fallback descriptions.

## G2-18-024-047  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:132-136 — bounded 500 max with Spring Page total.
- vNext now: src/modules/activity/service.ts:98-104,631-685 — <=100 keyset, COUNT when hasMore.
- Fix: Preserve bounded query with consistent full count when needed.

## G2-18-024-048  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:53-54,78-81 — actor fallback handles deleted users/mobile missing.
- vNext now: src/modules/activity/service.ts:631-650 — deleted user row may be null from join.
- Fix: Backfill/decorate removed user actor label.

## G2-18-024-051  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:43-83, T:73-104 — Faculty/Learner and target-name lookup services as read-side integration.
- vNext now: src/modules/activity/service.ts:631-650 — users join, no per-kind resolver.
- Fix: Create fallback target name resolver for historic events.

## G2-10-003-022  [P2] GAP  facet F05  effort M
- Legacy: Old category projects matches only PROJECT PROJECT_TASK PROJECT_TEMPLATE entities `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:84-105`
- vNext now: New preset filters module PROJECTS, based on event taxonomy `src/app/(authenticated)/activity/page.tsx:90-97` `src/modules/activity/service.ts:535-541`
- Fix: Audit category membership and map legacy project-template actions into PROJECTS module

## G2-10-003-032  [P2] GAP  facet F10  effort M
- Legacy: Old UI GET /api/v1/superadmin/audit via searchAuditLogs, query category since page size `docs/legacy-source/frontend/src/api/Services/SuperAdminAuditService.js:1-4` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:97-107`
- vNext now: New server invokes listActivityEvents directly in server page, no GET fetch `src/app/(authenticated)/activity/page.tsx:98-131` `src/modules/activity/service.ts:504-516`
- Fix: Document backend contract mapping and match server-side category semantics

## G2-10-003-033  [P2] GAP  facet F10  effort M
- Legacy: Old API returns items actorNames targetNames page size total `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:175-196`
- vNext now: New service returns items groups cursor remainingCount, actor joined from users `src/modules/activity/service.ts:631-685`
- Fix: Preserve equivalent actor and target labels plus accurate total count in new view/export

## G2-10-003-037  [P2] GAP  facet F11  effort S
- Legacy: Old scope selector supplies selected org/college and Alert explains scope `docs/legacy-source/frontend/src/pages/superadmin/audit.js:9-18` `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:9-31`
- vNext now: New scope uses current adminScope and optional college picker; no explicit org picker on page `src/modules/activity/service.ts:422-501` `src/app/(authenticated)/activity/page.tsx:230-261`
- Fix: Restore selected-organization scope guidance in a prominent alert

## G2-10-003-039  [P2] GAP  facet F12  effort M
- Legacy: Old category and since computed on client using local day start and UTC serialization `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:39-44` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:97-105`
- vNext now: New from/to parsed IST and local presets resolved on server `src/app/(authenticated)/activity/page.tsx:73-97` `src/modules/activity/service.ts:50-61`
- Fix: Audit cutoff inclusive milliseconds and timezone conversion at midnight IST

## G2-10-003-060  [P2] GAP  facet F19  effort M
- Legacy: Legacy pageSize 50 initial and load-more appends all accumulated entries `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:20-21` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-116` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:250-255`
- vNext now: New limit 50 and cursor link replaces page, with group collapse of related records `src/app/(authenticated)/activity/page.tsx:98-131` `src/modules/activity/service.ts:698-749`
- Fix: Clarify and verify total/visible record counts for collapsed events and appended pages

## G2-7-002-039  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:244-246; api/Services/AdminService.js:475-478: GET `/api/v1/admin/projects/audit?collegeId,actionKey,entityId,sinceMillis,page,size`.
- vNext now: V/components/projects/project-admin-audit-page.tsx:65-80; modules/activity/service.ts:504-675: direct DB activity_events read, module=PROJECTS, limit40.
- Fix: Specify endpoint mapping, use new activity service without dropping legacy filters.

## G2-8-031-013  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:36-40 actorNames/targetNames maps from API, :46-52 resolves org and college display names.
- vNext now: src/components/activity/activity-center.tsx:45-55 uses actor displayName/email and subjectLabel; src/modules/activity/service.ts:631-660 joins users; original actor contact fallback absent.
- Fix: Fallback actor label System/Student #ID/Staff #ID and expose original actor identity in folded details.

## G2-8-031-036  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:103-123 GET /api/v1/superadmin/audit with page,size, actionKey, actor/scope and dates.
- vNext now: src/app/api/activity/route.ts:18-98 GET /api/activity with module,importance,eventType, cursor; src/modules/activity/service.ts:504-675 queries activity_events.
- Fix: Map filters/endpoints and response contract including actorNames/targetNames and total for compatibility.

## G2-8-031-042  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:23-43 important category from admin_audit_log action/category, default 30-day window; :144-153 groups by day.
- vNext now: src/components/activity/activity-center.tsx:45-67 humanized eventType, groupActivityEvents src/modules/activity/service.ts:698-744 groups related events and day headings in IST.
- Fix: Match grouping threshold/actor+subject key and day boundary under both server/local timezone.

## G2-9-001-037  [P2] GAP  facet F10  effort M
- Legacy: Controller returns items,page,size,total,actorNames,targetNames (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:101-200`)
- vNext now: Returns events + joined actor + cursor, no total/targetNames (`src/modules/activity/service.ts:460-650`)
- Fix: Restore remaining count and human target resolution where possible.

## G2-9-001-063  [P2] GAP  facet F19  effort M
- Legacy: Server caps page size at 500, client loads 50 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:114-149`)
- vNext now: Activity filter limits at most 100, client 25 (`src/modules/activity/service.ts:37-90`)
- Fix: Align initial page size while preserving bounded query.

## G2-9-026-034  [P2] GAP  facet F10  effort L
- Legacy: Legacy service supports category search, actionKey/entity filters and since/until `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:105-124`
- vNext now: New activityFilterSchema uses module,importance,eventType,subject,actor,from,to `src/modules/activity/service.ts:45-113`
- Fix: Build equivalence mapping by action categories and entity labels.

## G2-9-026-058  [P2] GAP  facet F21  effort L
- Legacy: Depends on SuperAdminAuditService, activityText descriptor and project date parser `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:6-10`
- vNext now: New activity taxonomy, listActivityEvents and metadata sanitizer `src/modules/activity/service.ts:45-113` `src/app/(authenticated)/activity/page.tsx:98-131`
- Fix: Map legacy action keys to new event taxonomy and humanized prose.

## G2-9-027-058  [P2] GAP  facet F21  effort L
- Legacy: Depends on SuperAdminAuditService, statusLabel, csvExport and scope context `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:6-9,155-184`
- vNext now: Uses activity event service, metadata sanitizer and server CSV export `src/modules/activity/service.ts:45-113` `src/app/(authenticated)/activity/page.tsx:194-221`
- Fix: Document old-to-new event/action mapping and field redaction.

## G2-10-003-061  [P3] GAP  facet F19  effort S
- Legacy: Legacy server pageable returns total count and simple date descending `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:184-195` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:84-105`
- vNext now: New uses limit+1 and remainingCount filtered group state `src/modules/activity/service.ts:631-685`
- Fix: Show accurate remaining raw events vs grouped cards count
