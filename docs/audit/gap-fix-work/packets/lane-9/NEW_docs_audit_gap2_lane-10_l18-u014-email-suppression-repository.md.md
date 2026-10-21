# Work packet: NEW / MISSING items from docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md

## G2-18-014-033  [P1] GAP  facet F19  effort L
- Legacy: src/modules/operations/outbound-delivery-queue.ts:22-24 — gated insertion, draft outbox; legacy direct repository writes active.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java:8 — plain JpaRepository; no disabled-by-default behavior.
- Fix: Complete runtime activation and pending sender verification.
