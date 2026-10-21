# Work packet: edit src/components/tpo/tpo-builtin-job-types-editor.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-023  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:168-171`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:32-39`, `87-88`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:27-31`
- Fix: Legacy save failure shows Job types were not saved dismissible Alert, server detail, Retry and toast; vNext inline notice without Retry. Restore alert/action and exact string.
