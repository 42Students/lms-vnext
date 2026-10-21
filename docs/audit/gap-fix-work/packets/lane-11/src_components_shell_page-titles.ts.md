# Work packet: edit src/components/shell/page-titles.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l12-u031-global-shell.md

## G2-12-031-027  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/utils/pageTitle.js:4-12 titleize unknown route
- vNext now: src/components/shell/page-titles.ts:81-93 missing fallback for some portals
- Fix: Provide safe fallback without raw UUID exposure.
