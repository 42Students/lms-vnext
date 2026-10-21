# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/project-meeting.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md

## G2-20-017-023  [P1] GAP  facet F10  effort L
- Legacy: Legacy workspace PUT syncs full meeting array by key including revival after deletion `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingRepository.java:24-31`
- vNext now: New POST creates individual meeting and separate transition API, UUID lookup [API:36-61,S:52-75]
- Fix: Support idempotent replacement/upsert and revival semantics for legacy migrated meeting keys

## G2-20-017-044  [P1] GAP  facet F22  effort L
- Legacy: Legacy retro/attendee/action/reminder/calendar fields persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:53-157`
- vNext now: New facilitation JSON (strings) and links, no attendees/reminder/calendar fields [N:1147-1158,M:4-13]
- Fix: Record intentional removals and map retained fields to explicit normalized representation
