# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-20/project-meeting.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md

## G2-20-017-011  [P1] MISSING  facet F04  effort L
- Legacy: attendees and actionItems stored JSON; retroActions serialized text `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:78-92`
- vNext now: No attendees array; actionItems are one facilitation string; no separate retroActions [N:1155-1158,M:4-13]
- Fix: Provide structured attendees/action-items and promotion keys rather than silently flattening into text
