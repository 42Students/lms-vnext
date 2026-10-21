# Work packet: edit src/app/(authenticated)/college/activity/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-audit.md

## G2-9-001-007  [P1] GAP  facet F02  effort M
- Legacy: Day-grouped chronological activity sections (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:232-259`)
- vNext now: Four-column DataTable and separate details link (`src/app/(authenticated)/college/activity/page.tsx:172-191`)
- Fix: Rebuild day-grouped narrative feed as primary display.

## G2-9-001-033  [P1] MISSING  facet F09  effort M
- Legacy: Inline disclosure per event, details payload/IP/When (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:243-257`)
- vNext now: Only separate View event route (`src/app/(authenticated)/college/activity/page.tsx:182-190`)
- Fix: Implement inline expand/collapse.

## G2-9-001-074  [P1] MISSING  facet F23  effort M
- Legacy: Day grouping, bulk badges, inline details, append count (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:232-259`)
- vNext now: Those legacy feed behaviors are absent (`src/app/(authenticated)/college/activity/page.tsx:172-197`)
- Fix: Restore day-grouped feed and inline details/count before signoff.

## G2-9-001-027  [P2] GAP  facet F07  effort M
- Legacy: On fetch failure error alert Couldn't load activity + API message + Retry (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:126-150`)
- vNext now: Generic route error or invalid filters screen (`src/app/(authenticated)/college/activity/page.tsx:25-39`)
- Fix: Recreate inline Retry preserving current filters.

## G2-9-001-029  [P2] GAP  facet F07  effort M
- Legacy: Refetch failure preserves matching previous rows and shows alert (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:137-154`)
- vNext now: Server rendered query error cannot retain stale rows (`src/app/(authenticated)/college/activity/page.tsx:39-45`)
- Fix: Make same-query refresh non-destructive or add explicit retry.

## G2-9-001-031  [P2] GAP  facet F08  effort M
- Legacy: Refreshing activity… status visible during same-query reload (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:216-235`)
- vNext now: Refresh is navigation link with no local status (`src/app/(authenticated)/college/activity/page.tsx:77-79`)
- Fix: Show busy status and disabled Refresh while pending.
