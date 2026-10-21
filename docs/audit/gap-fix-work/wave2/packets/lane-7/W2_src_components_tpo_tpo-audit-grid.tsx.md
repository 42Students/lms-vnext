# Work packet (wave 2): edit src/components/tpo/tpo-audit-grid.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-010  [P2] GAP  facet F03  effort M
- Legacy: Event cell contains action, detail line, contextual open link/entity tag or General. `docs/legacy-source/frontend/src/pages/tpo/audit.js:138`
- vNext now: Splits action/about/detail into separate grid columns with action cell. `src/components/tpo/tpo-audit-grid.tsx:46`
- Fix: Compose original Event stacked cell including link/tag.

## G2-11-006-015  [P2] GAP  facet F04  effort M
- Legacy: When displays `D MMM YYYY` and `h:mm A` in separate rows. `docs/legacy-source/frontend/src/pages/tpo/audit.js:162`
- vNext now: Single en-IN medium date + short time and `IST`. `src/components/tpo/tpo-audit-grid.tsx:20`
- Fix: Match two-line legacy date/time format and IST.

## G2-11-006-018  [P2] GAP  facet F05  effort S
- Legacy: Event, Actor, When columns; About/Detail hidden by default and present in export. `docs/legacy-source/frontend/src/pages/tpo/audit.js:132`
- vNext now: When, Event, About, Detail, Who; About/Detail shown by default. `src/components/tpo/tpo-audit-grid.tsx:45`
- Fix: Restore order, `Actor` heading, defaultHidden exportAlways behavior.

## G2-11-006-020  [P2] GAP  facet F05  effort M
- Legacy: Table search debounced 200ms, URL q, searches action/detail/entity/actor. `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:75`
- vNext now: Top search applies only on submit; extra local What/Who filter stays in memory. `src/components/tpo/tpo-audit-grid.tsx:56`
- Fix: Consolidate to debounced URL search matching legacy fields.

## G2-11-006-023  [P2] GAP  facet F05  effort L
- Legacy: Integrated GridWorkspace toolbar includes filters, copy, columns, CSV/XLSX and row selection. `docs/legacy-source/frontend/src/components/tpo/TpoDataTable.js:115`
- vNext now: Page Disclosure for CSV, local checkboxes/copy and limited About/Detail toggles. `src/components/tpo/tpo-audit-grid.tsx:66`
- Fix: Use consistent grid toolbar, export, selection, column chooser.

## G2-11-006-024  [P2] GAP  facet F05  effort S
- Legacy: First Event column is pinned left. `docs/legacy-source/frontend/src/components/tpo/TpoDataTable.js:94`
- vNext now: First column becomes When. `src/components/tpo/tpo-audit-grid.tsx:45`
- Fix: Pin Event first and preserve widths.

## G2-11-006-037  [P2] GAP  facet F09  effort M
- Legacy: Column chooser, export menu, selection bulk controls are shared GridWorkspace overlays. `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:37`
- vNext now: VNext only checkboxes to toggle About/Detail and standalone Export Disclosure. `src/components/tpo/tpo-audit-grid.tsx:68`
- Fix: Add original Columns and Export menus with keyboard behavior.

## G2-11-006-059  [P2] GAP  facet F16  effort M
- Legacy: <=767px range header stacks and Event cell keeps detail; Actor responsive hidden below sm. `docs/legacy-source/frontend/src/styles/components/_tpo-audit.scss:164`
- vNext now: Grid mobile primary keys are Event/When/About; detail becomes separate column. `src/components/tpo/tpo-audit-grid.tsx:78`
- Fix: Keep stacked Event/detail and match hide/show columns at 375/768.

## G2-11-006-060  [P2] GAP  facet F16  effort M
- Legacy: Legacy Event mobile width min145 max210; padding 13px 12px 16px. `docs/legacy-source/frontend/src/styles/components/_tpo-audit.scss:188`
- vNext now: vNext Quartz grid and filter strips use different responsive widths/padding. `src/components/tpo/tpo-audit-grid.tsx:56`
- Fix: Measure responsive 375/768/1280 and port numeric values.

## G2-11-006-069  [P2] GAP  facet F19  effort S
- Legacy: Grid dynamic import loading uses TableSkeleton eight rows, 30-row auto-height threshold. `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:18`
- vNext now: Quartz uses plain paragraph `Loading audit sheet…`. `src/components/tpo/tpo-audit-grid.tsx:17`
- Fix: Port table skeleton and row auto-height.
