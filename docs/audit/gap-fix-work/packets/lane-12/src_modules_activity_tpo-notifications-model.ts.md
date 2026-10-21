# Work packet: edit src/modules/activity/tpo-notifications-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u018-tpo-notifications.md

## G2-11-018-010  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:43 serverUnread from getCounts bell covers older-than-window; :87-93 displays max(server, shown).
- vNext now: src/modules/activity/tpo-notifications-service.ts:85-109 server unread count filtered to createdAt >=30-day cutoff; src/modules/activity/tpo-notifications-model.ts:55-64 treats older unread as read.
- Fix: Retain true unread count across all history or mark older as read server-side with clear policy; don't silently suppress older unread.

## G2-11-018-028  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:17-18 max200 feed; unread count includes old.
- vNext now: src/modules/activity/tpo-notifications-model.ts:55-64 virtual read after 30 days and src/modules/activity/tpo-notifications-service.ts:85-109 30-day unread count; cursor may expose old notifications as read.
- Fix: Owner decision: either historical unread remains actionable or mark as archived/read explicitly on expiry with notification policy.
