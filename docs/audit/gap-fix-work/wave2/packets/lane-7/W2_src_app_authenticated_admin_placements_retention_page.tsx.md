# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/retention/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-10-017-010  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:599-654 — Read-only retention report inline collapsed, then inline StudentPlacementLookup.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:14-42; src/app/(authenticated)/admin/placements/page.tsx:73-85 — Retention separate route/tab; student lookup link under Related directories.
- Fix: Restore collapsed report and lookup on landing.

## G2-10-017-022  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:605-645 — Retention report shows 180d stale rejected/withdrawn count and sample max200.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:19-40 — Dedicated retention page shows applicant rows, cutoff and warning; not same inline sample.
- Fix: Embed 180d quick summary with link to full report.

## G2-10-017-027  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:90-94,176-190 — Retention toggle loaded lazily on open, 180-day threshold and max200 sample.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:14-42 — Retention navigates separate Server Component, no lazy inline toggle.
- Fix: Restore lazily loaded inline report.

## G2-10-017-044  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:603-646 — Retention report is collapsible inline Card below drives.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:14-42 — Separate route/table under oversight tab.
- Fix: Embed collapsed summary and link to detail.

## G2-10-017-047  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:176-190 — GET retention report on expand, fixed 180d, sample up to200.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:14-42 — Dedicated route and new report service, also 180d.
- Fix: Align lazy fetch and sample truncation message.

## G2-10-017-059  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:603-646 — Retention loading ListSkeleton and errors/Retry inline.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:19-42 — Dedicated retention renders read-only page or route-level error.
- Fix: Render inline retry and load placeholders.

## G2-10-017-083  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:599-654 — Read-only retention sample and StudentPlacementLookup embedded under drives.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:14-42; src/app/(authenticated)/admin/placements/page.tsx:21-55 — Dedicated retention route and linked lookup.
- Fix: Restore inline composition or document navigation decision.

## G2-17-030-033  [P2] MISSING  facet F09  effort M
- Legacy: Retention disclosure is a button with Database icon / Down/Up icons; DrivesLanding.js:599-616
- vNext now: vNext report separate route; admin/placements/retention/page.tsx:9-42
- Fix: Restore collapsed by-default inline summary and lazy table preview, link to full report as extra.

## G2-17-030-055  [P2] GAP  facet F21  effort M
- Legacy: Retention lazy GET only on disclosure open, reset by college; DrivesLanding.js:166-195,599-646
- vNext now: vNext separate retention page queries upon navigation; admin/placements/retention/page.tsx:9-42
- Fix: Keep lazy inline preview with route link for expanded report, cache keyed college.
