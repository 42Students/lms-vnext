# Work packet (wave 2): edit src/app/api/placements/recruiter/bell/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:31-39 — Authenticated recruiter self API rooted /api/v1/recruiter; college-selected session.
- vNext now: src/app/api/placements/recruiter/profile/route.ts:8-17; src/app/api/placements/recruiter/profile/details/route.ts:8-18; src/app/api/placements/recruiter/bell/route.ts:7-20 — Functions split /api/placements/recruiter/* routes.
- Fix: Preserve matching public API contracts or add documented adapter

## G2-10-025-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:72-94 — Bell feed, unread-count and mark-all-read grouped routes.
- vNext now: src/app/api/placements/recruiter/bell/route.ts:7-20; src/app/api/placements/recruiter/notifications/drawer/route.ts:6-15 — Bell and drawer separate modern routes.
- Fix: Ensure bell links and events from all three operations align

## G2-10-025-045  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:81-85 — GET /api/v1/recruiter/notifications/unread-count.
- vNext now: src/app/api/placements/recruiter/bell/route.ts:7-12 — GET /api/placements/recruiter/bell, aggregated payload.
- Fix: Map unread number and 30s poll

## G2-10-025-046  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:88-94 — PUT /api/v1/recruiter/notifications/mark-all-read.
- vNext now: src/app/api/placements/recruiter/bell/route.ts:13-19 — POST /api/placements/recruiter/bell.
- Fix: Preserve mark-all semantics and scoped college

## G2-10-025-093  [P2] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:72-94 — RecruiterNotificationService feeds/read writes.
- vNext now: src/app/api/placements/recruiter/bell/route.ts:5-20; src/app/api/placements/recruiter/notifications/drawer/route.ts:3-15 — HR notifications and bell services decoupled.
- Fix: Map receipt read state and event types
