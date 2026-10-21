# Work packet (wave 2): edit src/components/ui/pagination.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md

## G2-10-031-018  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-43,94-95 — curation is remote page0 size50, chooser off.
- vNext now: src/components/ui/pagination.tsx:5-14,44-85 — generic 1-based numbered pages, no page-size control.
- Fix: Preserve per-resource 50 fixed size and zero-to-one based translation.

## G2-10-031-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:52-53,100-103,837-845 — 10/20/50/100, default20 table pagination.
- vNext now: src/components/ui/pagination.tsx:5-15,44-85 — pager does not offer page-size chooser.
- Fix: Expose legacy page-size options where source uses chooser.

## G2-10-031-020  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:428-433 — Ant table current/pageSize with page-size selector.
- vNext now: src/components/ui/pagination.tsx:56-85 — standalone nav page numbers, Previous/Next only.
- Fix: Restore embedded size changer if same list.
