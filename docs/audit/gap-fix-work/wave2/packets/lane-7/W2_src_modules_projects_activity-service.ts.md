# Work packet (wave 2): edit src/modules/projects/activity-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u018-project-activity-event.md

## G2-5-018-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy feed has title/summary/source tab/type and actor fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:22-47`
- vNext now: New project activity query projects importance/subject and summary `src/modules/projects/activity-service.ts:26-52`
- Fix: Expose legacy-safe activity fields in staff/mentor display.

## G2-5-018-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy activity DTO includes projectSlug, title, sourceTab, actor name `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectActivityDTO.java:7-26`
- vNext now: New query uses subjectLabel and actorDisplayName, no projectSlug/sourceTab/title `src/modules/projects/activity-service.ts:27-53`
- Fix: Map old title/source tab/project slug into safe display fields.

## G2-5-018-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy paged search eventType/sourceTab case-insensitive contains `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectActivityEventRepository.java:22-53`
- vNext now: New learner category filter checks eventType prefix, no sourceTab text filter `src/modules/projects/activity-service.ts:66-77`
- Fix: Add staff legacy event label/source-tab substring filters if needed.

## G2-5-018-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy paged query uses Page count and pageable offset `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectActivityEventRepository.java:22-58`
- vNext now: New learner service uses microsecond timestamp + UUID cursor rather than offset `src/modules/projects/activity-service.ts:54-109`
- Fix: Provide deep-link pagination adapter and document cursor reset on filter change.

## G2-5-018-026  [P2] GAP  facet F10  effort M
- Legacy: Legacy historical actorName frozen at event time `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:39-46`
- vNext now: New user join resolves current displayName at read time `src/modules/projects/activity-service.ts:45-57`
- Fix: Save immutable actor label in activity metadata/subject snapshot.
