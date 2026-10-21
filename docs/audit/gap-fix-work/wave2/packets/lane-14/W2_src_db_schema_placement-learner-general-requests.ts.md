# Work packet (wave 2): edit src/db/schema/placement-learner-general-requests.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-025  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:48-64 — one open request per learner/type/drive, row locked to dedupe.
- vNext now: src/db/schema/placement-learner-general-requests.ts:27-29 and src/modules/placements/tpo-general-request-service.ts:147-166 — partial unique and replay policy.
- Fix: Compare duplicate scope/null job handling and race semantics.

## G2-14-023-029  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:48-53 — one pending request kind per drive blocks repeats.
- vNext now: src/db/schema/placement-learner-general-requests.ts:27-28 — unique kind/target per membership; exact payload replay allowed.
- Fix: Define approved idempotency policy with UI copy.

## G2-14-023-045  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:63-74 — LocalDateTime decidedAt, createdAt, escalateAt.
- vNext now: src/db/schema/placement-learner-general-requests.ts:18-23 — timestamptz requestedAt,decidedAt,updatedAt UTC; no escalateAt.
- Fix: Define UTC/IST conversion and escalation time migration.

## G2-14-023-049  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:60-67 — decided_by/at/decision_reason.
- vNext now: src/db/schema/placement-learner-general-requests.ts:19-23,38-46 — decidedByUserId,decisionNote and separate event history.
- Fix: Map actor/decision note/history without loss.
