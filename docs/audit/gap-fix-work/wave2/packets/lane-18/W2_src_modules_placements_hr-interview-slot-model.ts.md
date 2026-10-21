# Work packet (wave 2): edit src/modules/placements/hr-interview-slot-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u019-interview.md

## G2-14-019-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy scheduledDate UTC LocalDateTime with serializer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:17-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:55-58`
- vNext now: New timestamptz startsAt and endsAt with explicit IST UI `src/db/schema/placement-round-candidate-slots.ts:12-13` `src/modules/placements/hr-interview-slot-model.ts:38-49`
- Fix: Normalize UTC storage and IST display with round-trip test

## G2-14-019-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy interviewerName up to255 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:160-167`
- vNext now: New slot panel text and HR panelLabel max160 `src/modules/placements/hr-interview-slot-model.ts:9-11` `src/db/schema/placement-round-candidate-slots.ts:15-15`
- Fix: Preserve long interviewer panel name or detect truncation

## G2-14-019-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy location max2048 sanitized `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:285-294`
- vNext now: New meetingLocation max500 in HR slot input `src/modules/placements/hr-interview-slot-model.ts:8-9`
- Fix: Preserve long legacy meeting links or show clear migration validation

## G2-14-019-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy roundDescription required and sanitized before notification `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:259-267`
- vNext now: New HR slot panelLabel optional `src/modules/placements/hr-interview-slot-model.ts:10-11`
- Fix: Require candidate context per round before delivering notice
