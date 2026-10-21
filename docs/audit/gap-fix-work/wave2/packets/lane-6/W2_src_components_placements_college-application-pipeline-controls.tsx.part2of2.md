# Work packet (wave 2): edit src/components/placements/college-application-pipeline-controls.tsx (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md

## G2-10-015-018  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1257-1317 — Missing data shown '-' and College #ID, source colorized.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:86-95 — 'Unnamed learner', em dash, 'Not recorded' inconsistent.
- Fix: Match placeholders when mapping DTO.
