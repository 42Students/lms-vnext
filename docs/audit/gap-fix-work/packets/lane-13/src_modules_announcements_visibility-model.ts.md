# Work packet: edit src/modules/announcements/visibility-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-notification-delivery-controller.md

## G2-2-019-070  [P1] MISSING  facet F23  effort M
- Legacy: AdminNotificationDeliveryController.java:135-139 uses CANCELLED status plus future timestamp to suppress recipient visibility
- vNext now: src/modules/announcements/visibility-model.ts:1-8 only derives LIVE/SCHEDULED/EXPIRED/DELETED, no CANCELLED
- Fix: Add explicit cancelled state in notification lifecycle.
