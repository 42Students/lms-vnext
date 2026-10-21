# Work packet (wave 2): edit src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md, docs/audit/gap2/lane-5/u018-project-activity-event.md

## G2-19-017-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy DTO includes actor, actionType, notes and createdAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingHistoryDTO.java:8-21`
- vNext now: vNext generic Activity page renders event label/type/time; raw summary/metadata/actor withheld `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:125-142`
- Fix: Create authorized detail view with actor and bounded before/after fields.

## G2-19-017-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy `findRecentByProjectId(projectId, Pageable)` sorts createdAt DESC,id DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:15-21`
- vNext now: vNext generic Activity history page pages event records and allows newest sort `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:50-70` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:137-139`
- Fix: Read typed history bounded by project and sort timestamp+UUID ID.

## G2-19-017-014  [P2] GAP  facet F05  effort M
- Legacy: Legacy byProject query may fetch all meetings' edits across project `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:20-21`
- vNext now: vNext activity page has MEETINGS filter in generic feed `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:65-70`
- Fix: Add view keyed by project and meetingId/meetingKey with proper scope.

## G2-19-017-024  [P2] GAP  facet F09  effort M
- Legacy: Legacy before/after JSON can support diff modal with actionType `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-48`
- vNext now: vNext Activity page withholds metadata/actor identities `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:140-142`
- Fix: Add privileged diff modal with redacted sensitive keys and link to meeting.

## G2-19-017-026  [P2] GAP  facet F10  effort L
- Legacy: Legacy repository scoped recent history read by project and meetingKey `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:20-24`
- vNext now: vNext generic activity service filters project events, not typed revision `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:36-41` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:140-142`
- Fix: Add endpoint projection for authorized meeting history.

## G2-19-017-049  [P2] GAP  facet F21  effort M
- Legacy: Legacy dedicated typed MeetingHistoryDTO in Java `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingHistoryDTO.java:8-21`
- vNext now: vNext only generalized Project Activity view for current browser `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:36-41` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:140-142`
- Fix: Design type-safe API for scoped before/after diff and notes.

## G2-5-018-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy project workspace Activity tab and standalone admin audit views `docs/legacy-source/frontend/src/pages/superadmin/projects/audit/index.js:1-90`
- vNext now: New learner project activity integrated with project page + mentor history route `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:1-70`
- Fix: Compare entry route and breadcrumb across roles, preserve discoverability.

## G2-19-017-041  [P3] GAP  facet F18  effort S
- Legacy: Legacy DTO uses `actionType`, `actorUserType`, `beforeJson`, `afterJson`, `changedFields` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingHistoryDTO.java:8-21`
- vNext now: vNext staged schema retains most keys but public Activity says Recorded project activity `src/db/schema/project-audit-staged.ts:23-31` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:39-41`
- Fix: Use Meeting change history label separate from generic activity.
