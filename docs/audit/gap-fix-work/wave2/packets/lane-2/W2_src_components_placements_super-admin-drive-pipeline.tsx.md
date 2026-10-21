# Work packet (wave 2): edit src/components/placements/super-admin-drive-pipeline.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:225-259 — Pipeline title/card with single six-column Row of statistics.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:5-29 — Border-y grid with six cells, percent helper lines and bottom rejected/waitlisted summary.
- Fix: Match Pipeline card spacing, grid, statistic style and labels; keep data trustworthy.

## G2-10-012-013  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:225-255 — Six statistics Applied, Shortlisted, Assessment, Interview, Offered, Hired; Applied accent teal #0a7c88, Hired #3f8600.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:13-24 — Six cells using neutral heading colors; percentage text and border grid.
- Fix: Restore accent colors and simplified statistic values/captions.

## G2-10-012-019  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:241-255 — Pipeline snapshot stage order Applied, Shortlisted, Assessment, Interview, Offered, Hired.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:13-29; src/modules/placements/super-admin-drive-pipeline-model.ts:4-27 — Stage grid draws same six, plus rejected/waitlisted in footer.
- Fix: Keep same order and remove visual percent/extra status clutter for clone.

## G2-10-012-036  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:140-180 — Needs attention is an inline warning Alert with embedded links, not a modal.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:5-29 — No attention UI; pipeline content rendered inline.
- Fix: Use nonmodal warning banner and preserve link keyboard behavior.

## G2-10-012-062  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:225-255 — Six pipeline stats laid out xs=12 sm=8 md=4 on 24-column Ant grid.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:13-24 — Two columns base, three sm, six xl; six-column begins only at xl.
- Fix: Match breakpoint where stats switch to 6-up at md/Ant ~992px, not xl.

## G2-10-012-064  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:157-168 — Needs-attention links visible labeled by learner & detail with trailing right icon; link control text-specific.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:5-29 — No semantic attention item links.
- Fix: Build keyboard-focusable named links with distinct candidate/concern text.

## G2-10-012-069  [P2] MISSING  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:16-20,152-167 — Alert says 'Needs attention (N)', groups and labels with exact punctuation.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/components/placements/super-admin-drive-pipeline.tsx:5-29 — No same banner or strings.
- Fix: Copy all four categories and typography exactly.

## G2-10-012-070  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:225-255 — Pipeline labels six title-case single-stage words with no percentage subcopy.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:9-29 — Adds 'Current application stages...' and '% of previous stage'.
- Fix: Remove explanatory ratios and align exact section copy.
