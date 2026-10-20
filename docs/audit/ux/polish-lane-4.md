# Lane 4 — UI/UX polish pass

## `src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx`

**Problems found (9):** Presentation and saved views above page title; standalone back link; export lacking coherent hover/focus; Apply filters left alone on tablet row; unaligned fields/mobile widths; seven nested metric cards; dense boxed lifecycle methodology between totals and data; eight competing table-toolbar controls; filtered-empty table without an obvious recovery action.

**Changed:** Moved back navigation and primary export into header actions, with export above back on mobile. Aligned the two filters and submit at 768px+; stacked full-width controls at 375px. Moved presentation and saved views under collapsed Report options. Replaced individual StatTile cards with the legacy SummaryStrip without changing labels, values or aria-label. Prioritized the table, moved the exact explanatory and CSV caveat wording into collapsed Reporting methodology below it. Added optional `compactControls` for this surface only to show Search table immediately while housing existing Rows shown/Column filters/Columns/Copy/CSV/Reset controls in Table tools; preserved all behavior and added a visible Reset view action when filtered rows are empty.

**Files changed:** `src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx`, `src/components/placements/placement-report-ui.tsx`, `src/components/placements/report-interactive-table.tsx`, `docs/orchestrator/queues/clone/lane-4-polish.md`, `docs/audit/ux/polish-lane-4.md`.

**Kept:** routes, form names, permissions, report calculations, existing text, data-testid, accessible labels, saved-view behavior, CSV endpoints, and design tokens; no new dependencies. Inspected source states/mobile 375/tablet 768/desktop 1280; no CI, screenshot comparison or runtime render.

## `src/app/(authenticated)/tpo/reports/unplaced/page.tsx`
Problems found (8): saved filters/presentation before report content; 15 report-nav links before filters; unequal batch/branch fields and submit row on 375/768; duplicate Students action; dense narrative notices before summary; overlapping filter clusters; busy wide report toolbar; raw error page without shared error state.
Fixes: made batch/branch grid align at 768 and stack on 375, moved primary totals and student action before report table, kept season/drive/saved views and methodology behind Report filters and information disclosure, moved Other reports links into optional compactNavigation disclosure, removed duplicate Students shortcut, used compactControls in report table, and standardized Retry error boundary using shared ErrorState. Examined loading/error/page, report navigation, filters, table, empty and interaction states. Source check only (no screenshots/CI). Files: `src/app/(authenticated)/tpo/reports/unplaced/page.tsx`, `src/app/(authenticated)/tpo/reports/unplaced/error.tsx`, `src/components/placements/placement-report-ui.tsx`, queue, audit.
