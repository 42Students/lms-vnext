# Work packet: edit src/modules/placements/college-interview-action-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/interview-controller.md

## G2-8-027-053  [P1] GAP  facet F22  effort M
- Legacy: Legacy interview table single integer key, FK job/application/learner, type/status/date/mode/notes/feedback/version (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-173).
- vNext now: New candidate slot UUID+round/application, startsAt/endsAt/room/panel/status/version; college appointment and exceptions separate (src/db/schema/placement-round-candidate-slots.ts:7-26; src/modules/placements/college-interview-action-service.ts:54-188).
- Fix: Create explicit legacy interview and dependent notification/link migration to multiple tables.
