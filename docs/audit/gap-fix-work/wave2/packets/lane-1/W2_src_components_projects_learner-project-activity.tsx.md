# Work packet (wave 2): edit src/components/projects/learner-project-activity.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u018-project-activity-event.md

## G2-5-018-023  [P2] GAP  facet F09  effort M
- Legacy: Legacy activity feed filters text/source and dates via caller UI `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectActivityEventRepository.java:22-53`
- vNext now: New learner view category select and cursor with client-side search `src/components/projects/learner-project-activity.tsx:1-85`
- Fix: Reconcile filter popover, calendar picker and search behavior.
