# Work packet: edit src/app/api/projects/[projectId]/meetings/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md

## G2-20-017-021  [P3] GAP  facet F08  effort S
- Legacy: Legacy meeting update responses return 'Project updated' through controller `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:471-483`
- vNext now: New POST returns {meeting} status201 and no text message `src/app/api/projects/[projectId]/meetings/route.ts:47-61`
- Fix: Map success notice and confirmation to exact legacy wording when parity required
