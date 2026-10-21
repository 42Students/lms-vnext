# Work packet (wave 2): edit src/components/tpo/tpo-notice-delete-confirm.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md

## G2-11-005-016  [P2] GAP  facet F03  effort S
- Legacy: Delete danger small Button with Popconfirm `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:100`
- vNext now: vNext secondary delete Button opens alertdialog `src/components/tpo/tpo-notice-delete-confirm.tsx:19`
- Fix: Match danger initial style/confirm size
