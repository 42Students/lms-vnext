# Work packet (wave 2): edit src/components/tpo/tpo-notice-composer-dialog.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md

## G2-11-005-010  [P2] GAP  facet F03  effort S
- Legacy: New announcement CTA primary with plus icon `docs/legacy-source/frontend/src/pages/tpo/announcements.js:93`
- vNext now: vNext New announcement Button without plus icon `src/components/tpo/tpo-notice-composer-dialog.tsx:11`
- Fix: Add Plus icon

## G2-11-005-113  [P2] GAP  facet F18  effort S
- Legacy: CTA New announcement with PlusOutlined `docs/legacy-source/frontend/src/pages/tpo/announcements.js:93`
- vNext now: Exact New announcement title, no icon `src/components/tpo/tpo-notice-composer-dialog.tsx:9`
- Fix: Add icon
