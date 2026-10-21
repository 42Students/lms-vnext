# Work packet: NEW / MISSING items from docs/audit/gap2/lane-19/project-meeting-history-entity.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md

## G2-19-017-044  [P1] GAP  facet F19  effort M
- Legacy: Legacy byProjectAndMeetingKey query unbounded `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:23-24`
- vNext now: vNext candidate project/time and meeting/time indexes `docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql:31-32`
- Fix: Index by (project_id,meeting_key,created_at DESC,id DESC) and enforce pagination.
