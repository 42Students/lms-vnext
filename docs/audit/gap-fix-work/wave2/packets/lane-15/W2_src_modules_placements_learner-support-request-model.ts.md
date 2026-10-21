# Work packet (wave 2): edit src/modules/placements/learner-support-request-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:52-55 — return raw StudentRequest[] under mine.
- vNext now: src/modules/placements/learner-support-request-model.ts:7-25 — filtered/paged list result items, count, page.
- Fix: Preserve array contract for migrated callers.

## G2-14-023-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:82-84 — mine descending createdAt no page limit.
- vNext now: src/modules/placements/learner-support-request-model.ts:13-25 — history 20-page with filters and clamp.
- Fix: Make order and all-record access discoverable with pagination.

## G2-14-023-010  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:82-84 — all learner requests in createdAt descending.
- vNext now: src/modules/placements/learner-support-request-model.ts:15-24 — filters status/type then slice 20, caller order dependent.
- Fix: Enforce descending requestedAt across both new stores.

## G2-14-023-039  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:14,29-30 — withdrawal, offer extension, absence dispute, correction, external offer, PAP names.
- vNext now: src/modules/placements/learner-support-request-model.ts:37-44 and src/modules/placements/tpo-general-request-model.ts:17-30 — Application withdrawal, Interview or round reschedule, OFF_CAMPUS_OFFER etc.
- Fix: Provide source label map and explicit PAP route.
