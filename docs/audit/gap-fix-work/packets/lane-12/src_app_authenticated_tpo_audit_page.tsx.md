# Work packet: edit src/app/(authenticated)/tpo/audit/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-021  [P1] GAP  facet F05  effort L
- Legacy: Filter side panel with checklist About, What happened, Who, When and dynamic option counts. `docs/legacy-source/frontend/src/pages/tpo/audit.js:23`
- vNext now: Single kind select, who substring, date filters, category tabs; no equivalent checklists. `src/app/(authenticated)/tpo/audit/page.tsx:229`
- Fix: Port all four checklist filters, counts, and chip semantics.
