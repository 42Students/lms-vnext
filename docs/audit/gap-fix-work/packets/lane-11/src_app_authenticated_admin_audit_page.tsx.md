# Work packet: edit src/app/(authenticated)/admin/audit/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md, docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-9/superadmin-audit-hub.md

## G2-2-024-002  [P1] MISSING  facet F01  effort M
- Legacy: AdminSmsLogController.java:49-57 endpoint query recipientSuffix,purpose,page,size
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:10-24 generic Activity Log not provider SMS attempts
- Fix: Expose dedicated SMS attempt query API.

## G2-2-024-003  [P1] MISSING  facet F02  effort M
- Legacy: AdminSmsLogController.java:22-31 designed as restricted operational support log
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:16-22 audit events view; no SMS attempt table
- Fix: Add separate SMS delivery section under Super Admin operations.

## G2-9-027-001  [P1] GAP  facet F01  effort L
- Legacy: Raw audit log shared component supports fixedCollegeId, allowGlobal, fixedEntityId and hideFilters `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:21-32`
- vNext now: Super Admin audit route only renders generic ActivityPage; no raw table or per-record mode props `src/app/(authenticated)/admin/audit/page.tsx:10-23` `src/app/(authenticated)/activity/page.tsx:48-74`
- Fix: Add faithful raw Audit Logs subview including fixed-entity and scoped modes.

## G2-18-024-021  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:175-179 — invalid category 400 message Unknown activity category: X.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:33-37 and src/app/(authenticated)/admin/audit/page.tsx:15-20 — invalid filters rendered ErrorState, no same JSON message.
- Fix: Return legacy validation sentence where required.

## G2-18-024-022  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:131-139 — non-admin denied with Admin access required, missing college separate.
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:13 — redirects /dashboard, error lacks reason.
- Fix: Distinguish missing scope vs forbidden in safe UX.

## G2-9-026-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy failure error banner Couldn't load activity. with Retry `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-129`
- vNext now: Strict query validation leads to Invalid audit filters; service read errors may bubble to route error `src/app/(authenticated)/admin/audit/page.tsx:15-20` `src/app/(authenticated)/activity/page.tsx:99-131`
- Fix: Display fetch failure inline preserving same-query data and retry.

## G2-9-027-027  [P2] GAP  facet F07  effort S
- Legacy: Failure Failed to load audit logs. Please try again. `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:97-105`
- vNext now: Invalid audit filters message only for validation failure `src/app/(authenticated)/admin/audit/page.tsx:15-20`
- Fix: Show same fetch-failure copy on backend error.

## G2-9-027-030  [P2] GAP  facet F08  effort S
- Legacy: Couldn't refresh audit logs vs Couldn't load audit logs `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:305-309`
- vNext now: Invalid audit filters on rejected query, generic route error elsewhere `src/app/(authenticated)/admin/audit/page.tsx:15-20`
- Fix: Distinguish refresh/initial failures with exact heading.

## G2-18-024-026  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:175-179 — unknown category error response includes exact message.
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:19-20 — Invalid audit filters / Check date range, UUIDs and event filters.
- Fix: Map exact source error copy where appropriate.

## G2-2-024-016  [P3] GAP  facet F07  effort S
- Legacy: AdminSmsLogController.java:71-72 no 400 for invalid size: clamps
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:14-21 invalid audit filters ErrorState
- Fix: Decide whether clamp/default matches old API for invalid page/size.
