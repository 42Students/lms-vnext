# Work packet (wave 2): edit src/components/projects/mentor-meeting-history.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md

## G2-19-017-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy history has before/after JSON and changedFields for detailed diff `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-48`
- vNext now: vNext current Past meetings component renders only meeting title/time/status `src/components/projects/mentor-meeting-history.tsx:5-26`
- Fix: Keep edit diff separate from 'Past meetings' scheduling list.

## G2-19-017-006  [P2] GAP  facet F03  effort S
- Legacy: Legacy meeting history is an edit-event row, not historical meetings themselves `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:17-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:20-24`
- vNext now: vNext component says Past meetings / Meeting history and lists meeting records `src/components/projects/mentor-meeting-history.tsx:15-26`
- Fix: Rename or add separate revision history to avoid semantic confusion.

## G2-19-017-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy meetingKey query is unbounded by Pageable `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:23-24`
- vNext now: vNext Past meetings client previews six and expand, but no typed revision DB query `src/components/projects/mentor-meeting-history.tsx:8-18`
- Fix: Add per-meeting bounded pagination to avoid multi-MB payloads.

## G2-19-017-033  [P2] MISSING  facet F13  effort M
- Legacy: Legacy unbounded meeting key query can return many rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:23-24`
- vNext now: vNext dedicated typed history read not registered; Past meetings list has no revision rows `src/components/projects/mentor-meeting-history.tsx:15-26` `docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql:1-5`
- Fix: Provide loading/empty/error states for scoped meeting revision list.

## G2-19-017-034  [P2] GAP  facet F13  effort M
- Legacy: Legacy repo comment explicitly warns huge QA edit histories `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:15-19`
- vNext now: vNext Past meetings preview6 with expand, unrelated to edit revisions `src/components/projects/mentor-meeting-history.tsx:8-18`
- Fix: Don't claim six-row meeting list is an edit-history performance fix.

## G2-19-017-042  [P2] GAP  facet F18  effort M
- Legacy: Legacy projectMeetingId may be null but stable meetingKey always present `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:20-24`
- vNext now: vNext mentor Past meetings keys list by meeting UUID/title/date/status `src/components/projects/mentor-meeting-history.tsx:5-7` `src/components/projects/mentor-meeting-history.tsx:23-26`
- Fix: Show historical meetingKey link or 'Deleted meeting' without leaking other project.
