# Work packet (wave 2): edit src/modules/projects/learner-attention-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md

## G2-15-004-040  [P2] GAP  facet F10  effort M
- Legacy: Backend-normalized DTO includes course/mentor/readiness and review status (projectService.js:578-627; ProjectsContent.jsx:316-394)
- vNext now: VNext projectInstances plus projectSubmissions/projectTasks projections (learn/projects/page.tsx:78-94; learner-attention-service.ts:53-114)
- Fix: Write explicit DTO crosswalk and parity fixtures for all state fields
