# Work packet: edit src/components/people/faculty-profile-repeatable.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md

## G2-1-003-040  [P2] GAP  facet F08  effort S
- Legacy: `ProfileSectionsPanel.js:445` delete confirmation 'Remove this entry?'.
- vNext now: `faculty-profile-repeatable.tsx:129-131` confirmation `Remove record N from Section? It remains saved until you submit the section.`
- Fix: Keep concise legacy title and put delayed-save explanation into dialog description.
