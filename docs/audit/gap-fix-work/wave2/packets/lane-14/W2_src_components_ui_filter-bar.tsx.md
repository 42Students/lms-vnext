# Work packet (wave 2): edit src/components/ui/filter-bar.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md

## G2-10-031-045  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:680-705 — wrapping control row with 260px search.
- vNext now: src/components/ui/filter-bar.tsx:23-54 — reusable FilterBar collapses controls and optional toolbar.
- Fix: Match row spacing at 375px/768px and search width.
