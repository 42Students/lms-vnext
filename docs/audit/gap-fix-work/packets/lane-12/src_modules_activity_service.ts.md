# Work packet: edit src/modules/activity/service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-10/superadmin-audit.md, docs/audit/gap2/lane-16/u021-admin-audit-log.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-18-024-016  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:84-99 — category query filters persisted action/entity types before LIMIT/page.
- vNext now: src/modules/activity/service.ts:535-552 — module/importance filters on normalized events; different membership.
- Fix: Align old important/setup/people/teaching/projects membership before pagination.

## G2-18-024-028  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:175-183 — calls audit.search or audit.searchByCategory with derived scope.
- vNext now: src/modules/activity/service.ts:504-685 — SQL query filters normalized activity_events.
- Fix: Map legacy category/action semantics to activityEvents query.

## G2-10-003-023  [P1] GAP  facet F05  effort M
- Legacy: Old important category matches deletion restore promotion suspension impersonation access feature identity reads and bulk statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:72-98`
- vNext now: New Important links filter importance HIGH only and excludes CRITICAL explicitly `src/app/(authenticated)/activity/page.tsx:90-96` `src/modules/activity/service.ts:543-553`
- Fix: Use importantOnly HIGH or CRITICAL and legacy action coverage; do not exclude CRITICAL

## G2-10-003-034  [P1] GAP  facet F10  effort L
- Legacy: Old audit action classified by actionKey and entityType from AdminAuditLog `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:34-41` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:84-105`
- vNext now: New event classified eventType module importance subjectType with metadata `src/db/schema/activity.ts:40-68` `src/modules/activity/service.ts:535-589`
- Fix: Create crosswalk for every legacy action key and category before parity is claimed

## G2-10-003-065  [P1] GAP  facet F21  effort L
- Legacy: Legacy activity events originate from AdminAuditLogService.log writes by controllers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:31-82`
- vNext now: New writers use writeActivityEvent / recordActivityEventInTransaction with dedupeKey `src/modules/activity/service.ts:313-360`
- Fix: Inventory legacy writer coverage and preserve all important audit event emissions across modules

## G2-16-021-016  [P1] GAP  facet F10  effort M
- Legacy: AdminAuditLog.java:25-61 writes actor IP/UA/action/entity/payload.
- vNext now: activity/service.ts:136-149 records eventType/subject/sanitized metadata.
- Fix: Ensure all old mutation points emit event parity incl login/privileged action.

## G2-8-031-037  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:84-149 searchByCategory uses AdminAuditLogRepository; joins old logs from mutation controllers.
- vNext now: src/modules/activity/service.ts:340-355 recordActivityEvent or recordActivityEventInTransaction writes activity_events with metadata.
- Fix: Inventory all old audit event producers and ensure every high-impact mutation emits equivalent typed event.

## G2-8-031-051  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:47-80 logRequired aims not to fail domain mutation on audit write; notify/email independent.
- vNext now: src/modules/activity/service.ts:340-355 typed event writes can run inside calling DB transaction; notification split into inAppNotifications src/db/schema/activity.ts:126-169.
- Fix: Decide critical vs best-effort audit policy, ensure rollback safety and no lost sensitive audit on mutation failure.

## G2-18-024-023  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:153-171 — cross-org attempt denied with Superadmin is org-scoped and cannot access other organizations.
- vNext now: src/modules/activity/service.ts:363-499 — requirePermission/activity.read rejects out-of-scope.
- Fix: Preserve tenant-scope error semantics without leaking existence.
