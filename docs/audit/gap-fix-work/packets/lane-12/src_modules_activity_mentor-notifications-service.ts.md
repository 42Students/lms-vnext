# Work packet: edit src/modules/activity/mentor-notifications-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u026-mentor-notifications.md

## G2-7-026-086  [P1] GAP  facet F22  effort L
- Legacy: notifications.js:151-177 legacy notification records created_at/createdAt, type, title, message, receiverType
- vNext now: mentor-notifications-service.ts:45-64 joins in_app_notifications with activityEvents
- Fix: Map legacy records to stored event + recipient schema with readAt and audience
