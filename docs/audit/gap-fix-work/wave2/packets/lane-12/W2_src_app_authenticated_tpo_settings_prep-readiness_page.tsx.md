# Work packet (wave 2): edit src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-016  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:437-445 prep courses multiselect and threshold 0-100
- vNext now: src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx standalone and old nav-hidden
- Fix: Preserve hidden panel values while matching section visibility.
