# Work packet (wave 2): edit src/components/tpo/tpo-students-bulk-add.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md

## G2-14-001-038  [P2] GAP  facet F09  effort M
- Legacy: Legacy Add-to-drive modal with form/discard; vNext expanded section and confirm Dialog — `docs/legacy-source/frontend/src/components/tpo/AddToDriveModal.jsx:16-36,55-123`
- vNext now: `src/components/tpo/tpo-students-bulk-add.tsx:175-225,102-165`
- Fix: Move setup to modal launched by Act and add discard confirm
