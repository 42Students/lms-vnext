# Work packet (wave 2): edit src/modules/projects/meeting-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md, docs/audit/gap2/lane-8/l19-u028-superadmin-workspace-meetings.md

## G2-20-017-003  [P2] GAP  facet F02  effort S
- Legacy: Legacy frontend meeting card receives ordered full ProjectMeetingDTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingDTO.java:8-48`
- vNext now: vNext list returns rows then role-strips facilitation for learner, ordered timestamps `src/modules/projects/meeting-service.ts:149-180`
- Fix: Match visible card ordering and selected role-dependent sections

## G2-20-017-014  [P2] GAP  facet F05  effort S
- Legacy: Legacy repo can retrieve inactive soft-deleted meetings separately `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingRepository.java:47-48`
- vNext now: New list filters DRAFT/CANCELLED per role; no archived-key inactive listing `src/modules/projects/meeting-service.ts:161-173`
- Fix: Provide moderator-only inactive meeting audit/filter if old workspace exposed it

## G2-20-017-027  [P2] GAP  facet F11  effort S
- Legacy: Legacy ProjectWorkspaceController loads principal, workspace scoped by projectId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:56-70,471-483`
- vNext now: New requires projects entitlement and member permission, read access filters private draft `src/modules/projects/meeting-service.ts:149-173`
- Fix: Verify learner-request view and mentor/admin scope for draft/cancelled meetings

## G2-19-028-015  [P2] GAP  facet F15  effort M
- Legacy: WorkspaceMeetingsEditor.jsx:79 calendar/follow-up system managed
- vNext now: meeting-service.ts:365-426 notice on schedule
- Fix: Verify calendar/follow-up notices

## G2-19-028-019  [P2] GAP  facet F19  effort M
- Legacy: RepeatingItemEditor.jsx:49-51 client search all rows
- vNext now: meeting-service.ts:149-182 ordered full-project rows
- Fix: Add search and paging

## G2-19-028-020  [P2] GAP  facet F20  effort M
- Legacy: meetings.js:66-72 refresh siblings then section CAS
- vNext now: meeting-service.ts:289-331 project lock + time-overlap CAS
- Fix: Preserve safe version semantics

## G2-19-028-021  [P2] GAP  facet F21  effort M
- Legacy: meetings.js:35-44 sprint/task keys from workspace
- vNext now: meeting-service.ts:78-147 validates scoped UUID links
- Fix: Convert keys to IDs

## G2-19-028-025  [P2] GAP  facet F06  effort 
- Legacy: projectSectionFieldConfigs.js:210 optional meetingUrl
- vNext now: meeting-service.ts:314-316 URL required unless draft
- Fix: Show conditional required hint

## G2-20-017-013  [P3] GAP  facet F05  effort S
- Legacy: Active meetings sorted local meetingDate, startTime, sortOrder, id ASC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingRepository.java:16-22`
- vNext now: Default list sorted startsAt then createdAt ASC `src/modules/projects/meeting-service.ts:175-178`
- Fix: Reproduce sortOrder ordering and stable id tie-breaker or document intentionally chronological sort

## G2-20-017-032  [P3] GAP  facet F13  effort S
- Legacy: Legacy missing project meeting returns no active row `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingRepository.java:16-17`
- vNext now: New loadMeeting throws PROJECT_MEETING_NOT_FOUND `src/modules/projects/meeting-service.ts:52-75`
- Fix: Show inline not-found with link to project meetings tab
