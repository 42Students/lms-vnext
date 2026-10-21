# Work packet (wave 2): edit src/components/tpo/tpo-custom-job-type-rename.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-014  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:117-129`, `133-141`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:77-85`, `src/components/tpo/tpo-custom-job-type-rename.tsx:29-35`, `src/components/tpo/tpo-custom-job-type-placed.tsx:26-35`
- Fix: Legacy edits name and Yes/No directly in each custom row plus the switch, vNext hides name and count inside Edit job type disclosure. Put controls inline.
