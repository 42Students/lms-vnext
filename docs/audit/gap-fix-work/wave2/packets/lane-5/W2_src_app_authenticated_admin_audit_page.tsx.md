# Work packet (wave 2): edit src/app/(authenticated)/admin/audit/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-audit-hub.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md, docs/audit/gap2/lane-16/u021-admin-audit-log.md

## G2-18-024-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:124-140 — endpoint allows Super Admin or college faculty ADMIN.
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:10-14 — /admin/audit redirects non-Super-Admin; college uses /activity.
- Fix: Preserve college admin access via appropriate route/visible menu.

## G2-18-024-039  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:103-123 — service direct server request, session handled by principal.
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:13-20 — redirects unauthorised to dashboard or invalid query error.
- Fix: Show distinct session-expired state/relogin route.

## G2-2-024-006  [P2] MISSING  facet F03  effort M
- Legacy: AdminSmsLogController.java:57 size default50, max200
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:10-24 general filters only
- Fix: Add 50/100/200 page-size selector and next/previous controls.

## G2-2-024-009  [P2] GAP  facet F05  effort M
- Legacy: SmsDeliveryLogRepository.java:18-24 newest first by createdAt DESC,id DESC
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:10-24 generic Activity Log sorting
- Fix: Default to latest SMS attempts, stable tie-break.

## G2-2-024-013  [P2] MISSING  facet F06  effort M
- Legacy: AdminSmsLogController.java:61-72 size clamped 1..200, page >=0
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:14-22 validates different UUID/date filters
- Fix: Match page clamping and explicit maximum per page.

## G2-2-024-020  [P2] GAP  facet F09  effort M
- Legacy: SmsDeliveryLog.java:45-49 providerMessageId/errorSummary, potentially long
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:16-22 generic event details
- Fix: Use accessible details drawer for provider response fields with no body/number.

## G2-2-024-040  [P2] MISSING  facet F19  effort M
- Legacy: AdminSmsLogController.java:71-72 50 default,max200
- vNext now: src/app/(authenticated)/admin/audit/page.tsx:10-24 general activity filters
- Fix: Bound every query to max200 and support cursor/page.

## G2-5-030-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy Activity embedded audit list college fixed, filters hidden. `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:21-22,89-116`
- vNext now: vNext Activity tab links `/activity?collegeId`, audit page separate with query filter. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:29-31`, `src/app/(authenticated)/admin/audit/page.tsx:10-24`
- Fix: Apply fixed college filter and suppress redundant filters when embedded.

## G2-5-030-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy Activity fetches scoped audit logs in drawer. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:174-179`, `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:89-116`
- vNext now: vNext activity link separate page with collegeId query. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:29-31`, `src/app/(authenticated)/admin/audit/page.tsx:10-24`
- Fix: Carry fixed college ID and restore editor tab on return.

## G2-5-030-056  [P2] GAP  facet F19  effort M
- Legacy: Legacy AdminUsers and AuditLogs can page/search in-place. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:91-104`, `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:323-326`
- vNext now: vNext admin directory first500 truncation notice; activity page paged. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:32-44`, `src/app/(authenticated)/admin/audit/page.tsx:10-24`
- Fix: Expose proper pagination beyond 500 records.

## G2-9-026-001  [P2] GAP  facet F01  effort M
- Legacy: AuditHub is a container beneath Super Admin navigation `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:4-9`
- vNext now: /admin/audit forwards to shared /activity screen with independent PageHeader `src/app/(authenticated)/admin/audit/page.tsx:10-23`
- Fix: Restore legacy Activity Log tab/shell continuity from Super Admin.

## G2-9-027-003  [P2] GAP  facet F01  effort S
- Legacy: Unscoped when not allowGlobal: Select a College to view audit logs warning `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:238-251`
- vNext now: Global Super Admin sees platform activity; college scope optional `src/app/(authenticated)/admin/audit/page.tsx:10-23` `src/app/(authenticated)/activity/page.tsx:230-236`
- Fix: Honor allowGlobal setting at call site; warn scoped-only views without college.

## G2-9-027-010  [P2] GAP  facet F03  effort M
- Legacy: Error Alert red or warning with Retry button `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:303-309`
- vNext now: Invalid audit filter ErrorState; runtime query errors are not in feed inline `src/app/(authenticated)/admin/audit/page.tsx:15-20`
- Fix: Restore contextual load-error alert and Retry.

## G2-9-027-038  [P2] GAP  facet F11  effort M
- Legacy: canSearch false for no fixed college and !allowGlobal `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:59-60,139-148`
- vNext now: Super Admin has global activity path by default `src/app/(authenticated)/admin/audit/page.tsx:10-23`
- Fix: Expose allowGlobal option on raw Audit Logs route and honor warnings.

## G2-16-021-027  [P3] GAP  facet F18  effort S
- Legacy: AdminAuditLog.java:34 actionKey code strings.
- vNext now: admin/audit/page.tsx:16 title `Activity Log`, old audience uses Audit Log.
- Fix: Compare exact sidebar/title casing `Audit Log` vs `Activity Log`.
