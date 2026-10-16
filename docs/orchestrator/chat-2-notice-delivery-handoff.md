# Chat-2 TPO notice delivery handoff — source implemented, operations pending

Scope: TPO-inbox-team-43/45/46/47/48; notice recipients and read receipts.

- Route: POST /api/internal/placements/tpo/notices/deliver (no GET side effect).
- Required configuration: TPO_NOTICE_SCHEDULER_SECRET (>=32 characters). Supply it as
  the x-tpo-scheduler-key header from a trusted external scheduler.
- Suggested cadence when deploying: once per minute. Do not consider this
  a configured schedule merely because the code exists.
- A notice is eligible only after both its scheduled time (if any) and the
  30-second Undo hold. Deleted, expired and future notices are excluded.
- Delivery goes to active users with active college memberships, restricted to
  the frozen targeted recipient IDs when a targeted audience exists.
- The transactional notification writer performs another tenant scope check,
  and unique (user_id,event_id) makes repeated runs idempotent.
- TPO author sees actual in-app delivered/read counts; a learner can mark a
  delivered TPO notice read from their placements announcement list. A TPO
  author can remind unread users once/hour through a separate event.
- Storage prerequisites: registered announcements, placement_tpo_notice_audiences,
  placement_tpo_notice_recipients, activity events and in_app_notifications.
- Outstanding: registered scheduler secret/cadence, integration replay and
  permission/recipient verification, delivery caps >5000, reminder messages,
  read receipt for non-bell classroom/college notices, edit audience after
  scheduling, precise 30-second toast and undo UI.
- No tests, builds, provider email sends or live scheduler invocations were
  performed under FAST MODE. Do not claim production delivery is ready.
