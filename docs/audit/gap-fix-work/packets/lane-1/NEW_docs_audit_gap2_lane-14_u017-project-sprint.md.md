# Work packet: NEW / MISSING items from docs/audit/gap2/lane-14/u017-project-sprint.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/u017-project-sprint.md

## G2-14-017-066  [P1] GAP  facet F23  effort M
- Legacy: New hard delete planned sprint with task unlink `src/modules/projects/mentor-sprint-delete-service.ts:42-58`
- vNext now: Legacy deletedByWorkspace flag supports suppressed template sprint `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:41-42`
- Fix: Preserve old intentional deletion semantics
