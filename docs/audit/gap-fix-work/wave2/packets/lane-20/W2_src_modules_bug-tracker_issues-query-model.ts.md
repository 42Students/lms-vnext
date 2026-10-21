# Work packet (wave 2): edit src/modules/bug-tracker/issues-query-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-16-004-029  [P2] GAP  facet F06  effort M
- Legacy: `issues/index.js:47-84`: URL hydrates filter then shallow replace on change, page parameter 1-based; shareable.
- vNext now: `issues-query-model.ts:2-17`: strict parsed server params, cursor rather than page offset; new keys q/severity.
- Fix: Preserve legacy `search` and `page` query params for links or redirect/translate old bookmarks.
