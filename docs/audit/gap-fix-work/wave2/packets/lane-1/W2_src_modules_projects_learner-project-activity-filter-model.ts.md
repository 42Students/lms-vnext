# Work packet (wave 2): edit src/modules/projects/learner-project-activity-filter-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u018-project-activity-event.md

## G2-5-018-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy feed accepts page,size,eventType,sourceTab,fromDate,toDate `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:438-463`
- vNext now: New parse accepts category,from,to,beforeTime,beforeId `src/modules/projects/learner-project-activity-filter-model.ts:37-56`
- Fix: Translate legacy text filters/date params and cursor semantics.

## G2-5-018-039  [P2] GAP  facet F18  effort S
- Legacy: Legacy event filters substring eventType/sourceTab `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectActivityEventRepository.java:27-50`
- vNext now: New learner labels 'All activity', 'Sprint changes', 'Task changes' categories `src/modules/projects/learner-project-activity-filter-model.ts:6-16`
- Fix: Document intentional category vocabulary change and admin filter parity.
