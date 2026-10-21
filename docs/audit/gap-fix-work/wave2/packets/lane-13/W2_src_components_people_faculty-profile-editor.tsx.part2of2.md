# Work packet (wave 2): edit src/components/people/faculty-profile-editor.tsx (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-083  [P3] GAP  facet F21  effort S
- Legacy: Legacy optional profileUpdated browser event updates sidebar completion (`docs/legacy-source/frontend/src/components/profile/about.js:267-271`)
- vNext now: New editor sets local success only (`src/components/people/faculty-profile-editor.tsx:60-67`)
- Fix: Notify shell completeness listener after confirmed save
