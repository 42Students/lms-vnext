# Work packet (wave 2): edit src/app/(authenticated)/admin/announcements/page.tsx (part 2 of 2)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/announcement-controller.md

## G2-2-025-057  [P2] GAP  facet F18  effort M
- Legacy: Legacy superadmin/announcements.js:68 New announcement, 78 Edit/New announcement to placement cells
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:128-130 heading Announcements
- Fix: Preserve placement-specific copy and action titles.

## G2-2-025-068  [P3] GAP  facet F22  effort S
- Legacy: AnnouncementResponseDTO.java:40-47 created_at [year,monthMinus1,day]
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:108 ISO timestamp
- Fix: Adapt old client date tuple only where compatibility needed.
