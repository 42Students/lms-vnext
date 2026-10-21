# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/project-meeting.md

7 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md

## G2-20-017-002  [P2] GAP  facet F01  effort S
- Legacy: Meeting identified by projectId+meetingKey varchar120 [L:16-26,Q:24-31]
- vNext now: Meeting route and service identify UUID meetingId and UUID project [N:1104-1112,S:52-65]
- Fix: Translate legacy stable meeting key/anchors into UUID meeting IDs on old deep links

## G2-20-017-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy meeting has separate agenda, notes, outcome, retro and follow-up panels `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:29-56,93-132`
- vNext now: New agenda/outcome top-level and facilitation JSON payload replacing note/retro/followup fields [N:1121-1158,M:4-13]
- Fix: Recreate section grouping for notes, retro prompts, actions and follow-up in user-visible meeting detail

## G2-20-017-012  [P2] GAP  facet F04  effort S
- Legacy: ReminderAt/reminderChannel/followUpAt/status/notes persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:110-126`
- vNext now: facilitation only includes followUpAt/status/notes; no reminder columns [M:10-12,N:1155-1158]
- Fix: Implement reminder only if still supported; preserve follow-up dates and statuses

## G2-20-017-016  [P2] GAP  facet F06  effort S
- Legacy: Legacy meeting type GENERAL default; status SCHEDULED default; meeting title max200 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:32-53`
- vNext now: New type GENERAL default; status REQUESTED default; schedule input defaults and required link [N:1113-1122,V:847-865]
- Fix: Use distinct defaults for learner request vs mentor scheduling; label both clearly

## G2-20-017-017  [P2] GAP  facet F06  effort S
- Legacy: Legacy calendar event ID, meetLink max500 and provider text `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:128-145`
- vNext now: New meetingUrl required for SCHEDULED and URL accepts http/https [N:1132,1204-1207,V:822-839]
- Fix: Provide single meeting link input and approved validator, migrate existing calendar IDs

## G2-20-017-038  [P2] GAP  facet F18  effort S
- Legacy: Legacy fields include 'meetingStatus', 'retroDidntGoWell', 'linkedSprintLabel' `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingDTO.java:18-35`
- vNext now: New status/facilitation 'improve'/linkedSprintId [N:1113-1157,M:4-12]
- Fix: Match legacy labels with copy catalogue, preserve user-facing retro wording

## G2-20-017-042  [P2] GAP  facet F21  effort S
- Legacy: Legacy calendarProvider/calendarSync metadata present but auto-sync explicitly removed `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:128-157`
- vNext now: New no calendar webhook or provider fields, only member notification [N:1132-1158,A:75-97]
- Fix: Record intentionally retired auto-sync, avoid implying integration still works
