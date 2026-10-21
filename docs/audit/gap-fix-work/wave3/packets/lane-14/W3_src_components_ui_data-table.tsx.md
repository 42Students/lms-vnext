# Work packet (wave 3): edit src/components/ui/data-table.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md

## G2-10-031-059  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:827-845 — built-in Ant row selection, size changer and inline paging.
- vNext now: src/components/ui/data-table.tsx:25-35 and src/components/ui/pagination.tsx:44-85 — generic data table lacks selection/sort/size, pager detached.
- Fix: Restore configurable selection, sort and size capabilities in shared list primitives.
