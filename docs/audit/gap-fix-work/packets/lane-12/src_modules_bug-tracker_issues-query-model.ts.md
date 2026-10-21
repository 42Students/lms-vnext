# Work packet: edit src/modules/bug-tracker/issues-query-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-16-004-019  [P1] GAP  facet F05  effort M
- Legacy: `issues/index.js:99-122`: GET filters status/environment/reporter/search/sort, default 20 per page.
- vNext now: `tracker/issues/page.tsx:67-80`; `issues-query-model.ts:5-15`: query uses status/severity/environment/q/reporter/sort, always limit 50.
- Fix: Restore legacy visible 20/page and equivalent query/filter contract, retain new severity filter as optional enhancement.
