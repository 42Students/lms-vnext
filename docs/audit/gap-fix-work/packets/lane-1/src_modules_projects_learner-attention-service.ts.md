# Work packet: edit src/modules/projects/learner-attention-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md

## G2-15-004-065  [P1] GAP  facet F22  effort L
- Legacy: Legacy progress/delivery model via ProjectWorkspaceDTO (ProjectsContent.jsx:205-214,316-394)
- vNext now: VNext projectInstances/projectMembers/projectSubmissions/projectTasks with UUID and status fields (projects.ts:189-260,638-685; learner-attention-service.ts:53-114)
- Fix: Map all old progress/mentor/review dates to new relational projections with fixtures
