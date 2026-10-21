# Work packet (wave 2): edit src/app/(authenticated)/tpo/settings/public-page/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoPlacementsPageController.java:16-20 — Controller GET/PUT /api/v1/tpo/placements-page under TPO settings.
- vNext now: src/app/(authenticated)/tpo/settings/public-page/page.tsx:21-35 — vNext /tpo/settings/public-page; publication and content split.
- Fix: Preserve legacy settings navigation redirect and route adapter.

## G2-17-022-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:42-68 — Cards in order: toggle, About your placements, Numbers to show/preview.
- vNext now: src/app/(authenticated)/tpo/settings/public-page/page.tsx:35-64 — Header, disclosure preview, public link; content editor separately mounted.
- Fix: Compare card/section order, move toggle/about/numbers to same hierarchy.

## G2-17-022-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:59-68 — Statistics inline in Numbers to show card.
- vNext now: src/app/(authenticated)/tpo/settings/public-page/page.tsx:51-63 — Preview inside disclosure section.
- Fix: Restore inline preview placement if clone requires it.

## G2-17-022-032  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:35-36 — Fatal load error alert with Retry or Card loading.
- vNext now: src/app/(authenticated)/tpo/settings/public-page/page.tsx:21-35 — Server page may redirect/on-error; optional preview unavailable warning.
- Fix: Preserve skeleton loading and retry for settings.

## G2-17-022-039  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:45-62 — Titles `About your placements`, `Numbers to show`, `Placements page is on/off`.
- vNext now: src/app/(authenticated)/tpo/settings/public-page/page.tsx:35-55 — PageHeader `Public placements`; preview disclosure.
- Fix: Align title/card terminology.

## G2-17-022-036  [P3] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:42-68 — AntD card+Space and statistics adapt to width.
- vNext now: src/app/(authenticated)/tpo/settings/public-page/page.tsx:35-64 — Responsive disclosure, stat tiles, full-width link mobile.
- Fix: Side-by-side 375/768/1280px layout check.
