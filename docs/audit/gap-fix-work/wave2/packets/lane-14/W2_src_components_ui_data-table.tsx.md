# Work packet (wave 2): edit src/components/ui/data-table.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md, docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-10-031-022  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:421-428 — table rowKey id and horizontal scroll max-content.
- vNext now: src/components/ui/data-table.tsx:95-106 — table becomes stacked cards below md breakpoint.
- Fix: Match horizontal scrolling and columns on mobile.

## G2-10-031-044  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-380,421-425 — wrap controls, 260px search and horizontally scroll table.
- vNext now: src/components/ui/data-table.tsx:95-120 — stacked mobile rows and More details disclosure.
- Fix: Review mobile list against source horizontal scroll and row density.

## G2-10-016-062  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:614-668 — Legacy dedicated mobile job card with header/status, type tag, deadline/applicants, View/Edit/Open/Delete.
- vNext now: src/components/ui/data-table.tsx:40-146 — Responsive DataTable collapses fields, lacks action row.
- Fix: Recreate card markup and touch targets.

## G2-10-016-064  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:827-846 — Horizontal max-content table with Actions sticky right.
- vNext now: src/components/ui/data-table.tsx:96-140 — Generic DataTable responsive, actions not sticky.
- Fix: Fix first/last column anchoring and scroll cue.

## G2-10-011-024  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2036 — Table fixed left candidate and right actions; horizontal max-content scrolling.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:80-142; src/components/ui/data-table.tsx:96-140 — Generic responsive table with More details disclosures and no fixed first/last columns.
- Fix: Retain anchor columns and discoverable horizontal overflow at desktop/tablet.

## G2-10-011-068  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/styles/pages/_admin-jobs.scss:177-185; docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020 — Wide applications table scrolls horizontally on mobile; left candidate and right Actions fixed.
- vNext now: src/components/ui/data-table.tsx:96-140; src/components/placements/college-application-pipeline-controls.tsx:80-115 — Responsive DataTable uses scroll cue and collapsed secondary fields; no fixed candidate/actions parity.
- Fix: Match 44px touch controls and visible horizontal-scrolling affordance with anchored candidate.

## G2-10-013-060  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:651-734 — Legacy has distinct 768px desktop-table/mobile-card presentation with wrapped touch buttons.
- vNext now: src/components/ui/data-table.tsx:40-146; src/components/placements/college-interview-appointments.tsx:104-140 — Responsive DataTable with collapsed fields; lacks card badge/group hierarchy.
- Fix: Clone mobile card geometry/icons and 44px targets.

## G2-3-033-025  [P2] GAP  facet F05  effort M
- Legacy: `docs/design/old-lms-shell.css:38-40`
- vNext now: `src/components/ui/data-table.tsx:95-143`
- Fix: Legacy many grids retain columns and horizontal scroll on narrow widths; vNext generic DataTable converts each row to card below768, affecting column order/actions.

## G2-3-033-069  [P2] GAP  facet F19  effort M
- Legacy: `docs/design/old-lms-shell.css:67-85`
- vNext now: `src/components/ui/data-table.tsx:95-143`
- Fix: Converting every desktop table to cards on mobile can greatly increase row DOM; require pagination/virtualization for TPO data-rich views.
