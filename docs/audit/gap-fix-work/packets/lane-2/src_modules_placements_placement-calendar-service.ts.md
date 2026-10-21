# Work packet: edit src/modules/placements/placement-calendar-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md

## G2-5-002-036  [P1] GAP  facet F10 Actions/side effects  effort L
- Legacy: GET /api/v1/interviews lists appointment rows across a token-scoped college or org. (docs/legacy-source/frontend/src/api/Services/interviewService.js:25-40; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:333-385)
- vNext now: Calendar renders round/deadline/followup; directory renders only BOOKED slot rows. (src/modules/placements/placement-calendar-service.ts:221-241; src/modules/placements/placement-calendar-service.ts:507-601; src/modules/placements/college-interview-directory-service.ts:34-62)
- Fix: Build appointment-level source including historical states; reconcile data model.
