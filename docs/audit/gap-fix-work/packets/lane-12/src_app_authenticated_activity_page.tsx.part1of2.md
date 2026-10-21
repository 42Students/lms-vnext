# Work packet: edit src/app/(authenticated)/activity/page.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-10/superadmin-audit.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md, docs/audit/gap2/lane-9/superadmin-audit-hub.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md

## G2-18-024-015  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:110-112,175-183 — category important/setup/people/teaching/projects overrides actionKey/entity filters.
- vNext now: src/app/(authenticated)/activity/page.tsx:90-97 — quick importance/module links with different category semantics.
- Fix: Reproduce legacy category feed classification with a category→event mapping.

## G2-10-003-020  [P1] GAP  facet F05  effort M
- Legacy: Old category choice Important by default, everything explicit `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:23-30` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:60-61`
- vNext now: New route defaults to 30-day period but module/importance filter initially unset: can show Everything `src/app/(authenticated)/activity/page.tsx:67-105` `src/app/(authenticated)/activity/page.tsx:79-97`
- Fix: Default importance to HIGH/CRITICAL Important unless user explicitly selects Everything

## G2-10-003-023  [P1] GAP  facet F05  effort M
- Legacy: Old important category matches deletion restore promotion suspension impersonation access feature identity reads and bulk statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:72-98`
- vNext now: New Important links filter importance HIGH only and excludes CRITICAL explicitly `src/app/(authenticated)/activity/page.tsx:90-96` `src/modules/activity/service.ts:543-553`
- Fix: Use importantOnly HIGH or CRITICAL and legacy action coverage; do not exclude CRITICAL

## G2-8-031-023  [P1] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:60-61 defaults category Important and range 30d.
- vNext now: src/app/(authenticated)/activity/page.tsx:80 defaultFrom 29d and :90-97 preset labels; default importance is unset so first load includes everything, not Important.
- Fix: Default importance=HIGH/CRITICAL or equivalent legacy important taxonomy on initial load.

## G2-9-026-002  [P1] GAP  facet F01  effort M
- Legacy: Hub receives both selectedOrganizationId and selectedCollegeId `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:4-35`
- vNext now: Shared page derives context and optional collegeId filter, organizationId not in route query schema `src/app/(authenticated)/activity/page.tsx:53-74`
- Fix: Preserve org-only scope selection and its explanatory banner.

## G2-9-026-017  [P1] GAP  facet F05  effort L
- Legacy: Filter category important/setup/people/teaching/projects/all mapped to server category `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:23-30,100-107`
- vNext now: Maps to importance HIGH or module ACADEMICS/IDENTITY/COURSES/PROJECTS with independent filters `src/app/(authenticated)/activity/page.tsx:90-97,99-131`
- Fix: Compare legacy category action-key catalog and reproduce 'Important' event definition.

## G2-9-026-019  [P1] GAP  facet F05  effort M
- Legacy: Default Important category and 30d range `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:59-62,97-107`
- vNext now: Default 30-day range but absent importance filter selects all meaningful events `src/app/(authenticated)/activity/page.tsx:79-81,90-97`
- Fix: Default to legacy Important feed, not all activity.

## G2-9-026-024  [P1] GAP  facet F06  effort M
- Legacy: Scope managed exclusively by header context `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:10-31`
- vNext now: New in-page College select may override header safety scope `src/app/(authenticated)/activity/page.tsx:253-263`
- Fix: Pin inherited college in UI when selected, prevent misleading broader filter.

## G2-9-026-041  [P1] GAP  facet F12  effort M
- Legacy: Raw IP included in legacy CSV export `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:156-175`
- vNext now: New event schema has no IP field; export likely cannot include it `src/app/(authenticated)/activity/page.tsx:194-221` `src/db/schema/activity.ts:9-65`
- Fix: Decide security-sensitive IP retention/export policy; document deliberate omission.

## G2-9-026-046  [P1] GAP  facet F14  effort M
- Legacy: CSV export with Time, Who, What, Item, Action key, IP `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:156-175`
- vNext now: Export via /api/activity/admin-export with server-side schema and sanitization `src/app/(authenticated)/activity/page.tsx:194-221`
- Fix: Verify CSV headers/columns, IP policy and scope against old consumers.

## G2-9-026-063  [P1] GAP  facet F23  effort M
- Legacy: Default Important category + 30d compact segmented control `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:181-188`
- vNext now: Presets and richer filters, but default all meaningful events and navigation to /activity `src/app/(authenticated)/activity/page.tsx:90-97,237-251`
- Fix: Default Important and preserve Super Admin audit route during category navigation.

## G2-9-027-001  [P1] GAP  facet F01  effort L
- Legacy: Raw audit log shared component supports fixedCollegeId, allowGlobal, fixedEntityId and hideFilters `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:21-32`
- vNext now: Super Admin audit route only renders generic ActivityPage; no raw table or per-record mode props `src/app/(authenticated)/admin/audit/page.tsx:10-23` `src/app/(authenticated)/activity/page.tsx:48-74`
- Fix: Add faithful raw Audit Logs subview including fixed-entity and scoped modes.

## G2-9-027-023  [P1] GAP  facet F05  effort S
- Legacy: Initial raw audit filters blank, all available history when searched `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:32-35`
- vNext now: New automatic default last30days `src/app/(authenticated)/activity/page.tsx:79-81`
- Fix: Distinguish raw forensic all-time default vs feed 30d.

## G2-9-027-034  [P1] GAP  facet F10  effort L
- Legacy: GET /api/v1/superadmin/audit with actionKey, actorUserId, organizationId, collegeId, entityId,type,since/until,page,size `docs/legacy-source/frontend/src/api/Services/SuperAdminAuditService.js:1-4` `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:61-89`
- vNext now: listActivityEvents new schema module,importance,collegeId,eventType,subjectType/id,from/to,cursor limit50 `src/app/(authenticated)/activity/page.tsx:98-131`
- Fix: Write migration crosswalk for raw audit query parameters.

## G2-9-027-045  [P1] GAP  facet F14  effort M
- Legacy: Export only current filtered loaded page with 8 columns `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:155-184`
- vNext now: Server CSV export all filtered events from newest, may be capped `src/app/(authenticated)/activity/page.tsx:194-221`
- Fix: Document and offer current-page export vs full export distinctly.

## G2-10-003-027  [P2] GAP  facet F07  effort M
- Legacy: Old malformed server audit request surfaced Couldn't load activity. with Retry `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:117-123` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:199-201`
- vNext now: New activity page calls listActivityEvents during render and no same-page error callback shown `src/app/(authenticated)/activity/page.tsx:98-131` `src/app/(authenticated)/activity/page.tsx:210-416`
- Fix: Add route error/retry treatment matching legacy fetch failure copy

## G2-10-003-029  [P2] MISSING  facet F08  effort S
- Legacy: Old Refresh button icon ReloadOutlined and loading spinner `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:180-186`
- vNext now: New page has Apply filters/Reset links but no Refresh control in category bar `src/app/(authenticated)/activity/page.tsx:237-251` `src/app/(authenticated)/activity/page.tsx:394-403`
- Fix: Restore explicit Refresh with pending indication

## G2-8-031-026  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:97-105 failure 'Failed to load audit logs. Please try again.' scoped to current query, not empty data.
- vNext now: src/app/(authenticated)/activity/page.tsx:98-131 directly awaits listActivityEvents; on service error route-level error boundary rather than legacy inline Retry banner.
- Fix: Render inline retry with query preserved and do not equate DB failure with empty feed.

## G2-8-031-027  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:117-122 exact fallback 'Couldn't load activity.' and preserves rows for same-query refresh.
- vNext now: src/app/(authenticated)/activity/page.tsx:98-131 SSR list; no in-place Refresh/retry banner in ActivityCenter.
- Fix: Add refreshing stale-state alert with exact copy and Retry control.

## G2-8-031-030  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:184-186 Refresh/Export buttons; :117-129 keeps prior items on refresh failure with banner.
- vNext now: src/app/(authenticated)/activity/page.tsx:194-220 Export anchor; no Refresh success/info in SSR page, browser navigation reload only.
- Fix: Restore 'Refresh' action with visible 'Refreshing activity…' status and stale warning.
