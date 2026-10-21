# Work packet (wave 2): edit src/app/api/placements/recruiter/notifications/drawer/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:72-94 — Bell feed, unread-count and mark-all-read grouped routes.
- vNext now: src/app/api/placements/recruiter/bell/route.ts:7-20; src/app/api/placements/recruiter/notifications/drawer/route.ts:6-15 — Bell and drawer separate modern routes.
- Fix: Ensure bell links and events from all three operations align

## G2-10-025-044  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:73-77 — GET /api/v1/recruiter/notifications requires selected college, returns feed.
- vNext now: src/app/api/placements/recruiter/notifications/drawer/route.ts:6-15 — GET /api/placements/recruiter/notifications/drawer, optional collegeId.
- Fix: Use context-scoped college filter and same field meanings

## G2-10-025-093  [P2] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:72-94 — RecruiterNotificationService feeds/read writes.
- vNext now: src/app/api/placements/recruiter/bell/route.ts:5-20; src/app/api/placements/recruiter/notifications/drawer/route.ts:3-15 — HR notifications and bell services decoupled.
- Fix: Map receipt read state and event types
