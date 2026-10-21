# Work packet (wave 2): edit src/modules/projects/mentor-project-work-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-7-028-022  [P2] GAP  facet F04  effort M
- Legacy: ProjectsContent.jsx:384-390 task completed/total number and fallback Manual estimate
- vNext now: mentor-project-work-model.ts:17-24 derives percent from tasks and says recorded tasks; project-list.tsx:130-153
- Fix: Match x/y tasks and manual progress fallback if no task data
