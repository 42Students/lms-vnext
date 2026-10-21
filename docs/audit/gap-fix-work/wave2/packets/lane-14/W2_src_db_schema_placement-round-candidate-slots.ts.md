# Work packet (wave 2): edit src/db/schema/placement-round-candidate-slots.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u019-interview.md

## G2-14-019-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy user-visible round description mandatory on create `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:81-82` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:259-267`
- vNext now: New round name and whatToBring, slot panel and room `src/db/schema/placements.ts:1231-1245` `src/db/schema/placement-round-candidate-slots.ts:14-15`
- Fix: Map roundDescription to contextual round instructions shown to candidates

## G2-14-019-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy location holds meeting link or physical venue `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:69-74`
- vNext now: New round mode venue meetingUrl plus slot room/meetingLocation `src/db/schema/placements.ts:1234-1241` `src/db/schema/placement-round-candidate-slots.ts:14-15`
- Fix: Show room vs meeting URL by mode with original fallback

## G2-14-019-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy scheduledDate UTC LocalDateTime with serializer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:17-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:55-58`
- vNext now: New timestamptz startsAt and endsAt with explicit IST UI `src/db/schema/placement-round-candidate-slots.ts:12-13` `src/modules/placements/hr-interview-slot-model.ts:38-49`
- Fix: Normalize UTC storage and IST display with round-trip test

## G2-14-019-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy interviewerName up to255 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:160-167`
- vNext now: New slot panel text and HR panelLabel max160 `src/modules/placements/hr-interview-slot-model.ts:9-11` `src/db/schema/placement-round-candidate-slots.ts:15-15`
- Fix: Preserve long interviewer panel name or detect truncation

## G2-14-019-045  [P2] GAP  facet F12  effort M
- Legacy: Legacy previousScheduledDate/changedAt cleared on re-confirm `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:125-135`
- vNext now: New slots have confirmedAt and learnerConfirmedAt, no previous scheduled time field `src/db/schema/placement-round-candidate-slots.ts:18-24`
- Fix: Preserve changed-slot badge and previous instant history

## G2-14-019-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy isDeleted soft delete retains cancelled history `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:17-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:69-80`
- vNext now: New status CANCELLED row retained in DB but hidden by active list filter `src/db/schema/placement-round-candidate-slots.ts:16-20` `src/modules/placements/tpo-interview-slot-service.ts:48-51`
- Fix: Provide past-cancelled access in learner history

## G2-14-019-048  [P2] GAP  facet F13  effort S
- Legacy: Legacy null optional interview duration displays default60 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:78-82` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:275-284`
- vNext now: New slot always start/end timestamps, duration calculated `src/db/schema/placement-round-candidate-slots.ts:12-13`
- Fix: Display normalized 60-min fallback for imported null durations

## G2-14-019-056  [P2] GAP  facet F18  effort M
- Legacy: Legacy labels Scheduled Confirmed Reschedule requested Completed Cancelled No show `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:52-53`
- vNext now: New slot labels Available Booked Cancelled, round labels Pending Scheduled Completed Cancelled `src/db/schema/placement-round-candidate-slots.ts:29-35` `src/db/schema/placements.ts:1301-1304`
- Fix: Add mapping to original candidate-facing status wording

## G2-14-019-059  [P2] GAP  facet F19  effort M
- Legacy: Legacy SQL interview queries indexed by app/learner/org and pageable `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:29-94`
- vNext now: New slots indexed round/date and one-active booking, recruiter cap100 `src/db/schema/placement-round-candidate-slots.ts:25-29` `src/modules/placements/hr-interview-slot-service.ts:69-73`
- Fix: Index candidate upcoming by membership and paginate historic joins
