# Work packet (wave 2): edit src/app/(authenticated)/college/activity/[eventId]/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-audit.md

## G2-9-001-018  [P2] GAP  facet F04  effort M
- Legacy: Folded payload ignores null/empty string, max 14 fields and 160 characters (`docs/legacy-source/frontend/src/components/admin/activity/activityText.js:90-109`)
- vNext now: Shows full JSON metadata in separate details page (`src/app/(authenticated)/college/activity/[eventId]/page.tsx:30-40`)
- Fix: Add concise inline humanized key/value details; retain full sanitized detail.

## G2-9-001-067  [P2] GAP  facet F20  effort M
- Legacy: Nested metadata truncated for display (`docs/legacy-source/frontend/src/components/admin/activity/activityText.js:95-109`)
- vNext now: Full sanitized JSON display (`src/app/(authenticated)/college/activity/[eventId]/page.tsx:33-40`)
- Fix: Provide abbreviated inline details and full separate page.
