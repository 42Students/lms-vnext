# Work packet (wave 3): edit src/app/(authenticated)/admin/placements/drives/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md

## G2-10-016-012  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:565-611 — Visible View Applications, Edit, Close/Open, Delete action buttons; red destructive icon.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:80-85 — Single Open drive → link; rest elsewhere.
- Fix: Make all legacy row actions visible and accessible.

## G2-10-016-026  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:572-604 — Per row direct View Applications, Edit, Open/Close, Delete actions.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:80-85 — Only Open drive link.
- Fix: Restore row CTA destinations and confirm states.

## G2-10-016-085  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:565-611,614-668 — Per-job immediate View/Edit/Close/Delete on desktop and mobile.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:65-85 — Open drive link only; actions redistributed.
- Fix: Restore affordances/authorization and confirm flow.
