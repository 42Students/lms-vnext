# Work packet: edit src/modules/announcements/super-admin-college-broadcast-service.ts (part 2 of 2)

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-notification-delivery-controller.md, docs/audit/gap2/lane-2/announcement-controller.md

## G2-2-019-037  [P1] GAP  facet F11  effort M
- Legacy: AdminNotificationDeliveryController.java:69-70,119-120 `requirePerformAdminActionForCollege`
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:42-43 checks super admin and admin-scope
- Fix: Allow appropriately scoped college admin and super admin, not arbitrary senders.

## G2-2-019-038  [P1] GAP  facet F11  effort M
- Legacy: AdminNotificationDeliveryController.java:76-83,126-130 rechecks class then course audience
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:47-67 scope by college and TPO targets
- Fix: Revalidate audience under mutable class/course ownership before queue action.

## G2-2-019-039  [P1] MISSING  facet F11  effort M
- Legacy: NotificationWorkflowMySqlIT.java:227-242 rejects cross-college cancel despite own collegeId query
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:42-68 acts on selected college but no existing-notification foreign reference
- Fix: Add cross-tenant cancel/retry cases, preserve no-write invariant.

## G2-2-019-043  [P1] MISSING  facet F12  effort M
- Legacy: NotificationRepository.java:163-170 due query selects live scheduled rows only
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 no overdue scan
- Fix: Never fan out CANCELLED/DELETED/FAILED until explicit retry, and respect due boundary.

## G2-2-019-045  [P1] MISSING  facet F13  effort M
- Legacy: NotificationSchedulerService.java:142-150 if failure persistence fails, leaves SCHEDULED for next tick
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 no worker retry
- Fix: Persist failure with safe retry semantics and avoid lost notifications.

## G2-2-019-049  [P1] GAP  facet F15  effort M
- Legacy: NotificationSchedulerService.java:128-138 release SSE push best-effort after persisted SENT
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:105-110 immediate per-user in-app notification; scheduled no worker
- Fix: Scheduled worker must emit in-app and optional SSE after success, without duplicate delivery.

## G2-2-019-050  [P1] GAP  facet F15  effort M
- Legacy: AdminNotificationDeliveryController.java:51-56 resend reuses release job, never inline sends
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:92-112 immediate creator fan-out
- Fix: Keep resend as queued worker operation rather than invoke immediate fan-out on operator POST.

## G2-2-019-057  [P1] MISSING  facet F19  effort M
- Legacy: NotificationSchedulerService.java:102-111 every 60s job with single-batch due pagination
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 no scheduled worker
- Fix: Schedule worker at bounded interval with due index and max batch.

## G2-2-019-061  [P1] MISSING  facet F20  effort M
- Legacy: NotificationWorkflowMySqlIT.java:188-210 failed retry clears error and makes due<=now
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 only passive future schedule
- Fix: Test failed requeue clears only error, retains content and prevents duplicate receipts.

## G2-2-019-063  [P1] MISSING  facet F21  effort M
- Legacy: NotificationSchedulerService.java:102-150 scheduled fixed-delay job, distributed lease, SSE push
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 explicitly scheduled delivery worker not configured
- Fix: Implement claimed/fenced background worker, idempotent recipient fanout and event notification.

## G2-2-025-051  [P1] GAP  facet F15  effort M
- Legacy: Legacy superadmin/announcements.js:15-19 placement cells bell and unread count
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 immediate TPO bell, scheduled passive until worker configured
- Fix: Implement timed broadcast delivery worker and per-cell read receipt parity.

## G2-2-019-021  [P2] MISSING  facet F07  effort M
- Legacy: AdminNotificationDeliveryController.java:66-68 and 116-118 exact `collegeId must be a positive integer`
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:42-45 zod UUID target validation, no operator check
- Fix: Emit field-level college scope validation in delivery operator endpoint.
