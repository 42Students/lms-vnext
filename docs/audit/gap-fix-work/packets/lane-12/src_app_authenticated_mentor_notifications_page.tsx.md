# Work packet: edit src/app/(authenticated)/mentor/notifications/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u026-mentor-notifications.md

## G2-7-026-022  [P1] GAP  facet F04  effort M
- Legacy: notifications.js:341-345 sortKey priority and timestamp order
- vNext now: mentor-attention.ts:80 sorts by occurredAt desc independent of kind; mentor/notifications/page.tsx:129-185 separate sections
- Fix: Preserve legacy announcement-review-request-stalled-upcoming priority ordering

## G2-7-026-023  [P1] GAP  facet F05  effort L
- Legacy: notifications.js:341-345 unified list sorted announcement first, then review/requested, stalled, upcoming
- vNext now: mentor/notifications/page.tsx:104-193 renders personal, attention, announcements separately
- Fix: Implement equivalent combined ordered feed or explicitly retire priority contract

## G2-7-026-031  [P2] GAP  facet F07  effort S
- Legacy: notifications.js:272 fallback We couldn't load your notifications.
- vNext now: mentor/notifications/page.tsx:55-78 failed sources collected with warning, not top-level error
- Fix: Keep fatal failure fallback when all relevant sources fail

## G2-7-026-032  [P2] GAP  facet F07  effort M
- Legacy: notifications.js:364-370 error Alert and Retry
- vNext now: mentor/notifications/page.tsx:96-103 partial failure warning and retry
- Fix: Separate full failure from partial source warning

## G2-7-026-036  [P2] GAP  facet F08  effort M
- Legacy: notifications.js:357-362 three NotificationRowSkeleton while loading
- vNext now: mentor/notifications/page.tsx:53-93 server fetch, no per-row skeleton in page
- Fix: Restore three-shape loading skeleton

## G2-7-026-037  [P2] GAP  facet F08  effort S
- Legacy: notifications.js:383-389 Nothing needs your attention right now when empty
- vNext now: mentor/notifications/page.tsx:167-170 same for project-only empty, personal/announcement have own texts
- Fix: Use single all-sources empty copy when unified feed has zero
