# Work packet: edit src/modules/placements/tpo-drive-day-checkin-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-031  [P1] MISSING  facet F06  effort M
- Legacy: Optional free-text room input with literal placeholder. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:297`
- vNext now: TPO writes room:null and has no room field. `src/modules/placements/tpo-drive-day-checkin-service.ts:105`
- Fix: Add room input and persist with operator mark.

## G2-11-008-051  [P1] GAP  facet F10  effort S
- Legacy: Attendance upsert COALESCE retains previous room when caller omits it. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:395`
- vNext now: TPO check-in explicitly sets room:null. `src/modules/placements/tpo-drive-day-checkin-service.ts:105`
- Fix: Do not clear prior assigned room on check-in.

## G2-11-008-052  [P1] GAP  facet F10  effort M
- Legacy: First absent state enqueues MARKED_ABSENT and writes TPO audit. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:402`
- vNext now: New activity event writes; no notification outbox call in checkin service. `src/modules/placements/tpo-drive-day-checkin-service.ts:116`
- Fix: Enqueue deduplicated learner absence notification and dispute workflow.

## G2-11-008-068  [P1] GAP  facet F15  effort M
- Legacy: First absence enqueues one `MARKED_ABSENT` learner APP notification; repeat does not. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:399`
- vNext now: Writes activityEvents without outbox notification. `src/modules/placements/tpo-drive-day-checkin-service.ts:116`
- Fix: Add first-absence transactional notification with idempotency.

## G2-11-008-084  [P1] GAP  facet F21  effort M
- Legacy: Legacy uses outbox and audit service for absence workflow. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:24`
- vNext now: TPO uses activityEvents but no outbox producer. `src/modules/placements/tpo-drive-day-checkin-service.ts:116`
- Fix: Integrate learner notifications/dispute event producer.

## G2-11-008-089  [P1] GAP  facet F22  effort S
- Legacy: Legacy preserves room if missing from request. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:395`
- vNext now: TPO clears room on status change. `src/modules/placements/tpo-drive-day-checkin-service.ts:105`
- Fix: Retain room unless explicit clear requested.
