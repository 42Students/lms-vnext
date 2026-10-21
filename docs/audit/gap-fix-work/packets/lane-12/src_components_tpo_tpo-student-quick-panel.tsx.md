# Work packet: edit src/components/tpo/tpo-student-quick-panel.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md

## G2-14-001-031  [P2] GAP  facet F07  effort S
- Legacy: Legacy panel detail loading error We couldn't open this student; vNext Could not load student records — `docs/legacy-source/frontend/src/components/tpo/StudentPanel.js:103-132`
- vNext now: `src/components/tpo/tpo-student-quick-panel.tsx:36-56,171-173`
- Fix: Use original detail error title and retry CTA
