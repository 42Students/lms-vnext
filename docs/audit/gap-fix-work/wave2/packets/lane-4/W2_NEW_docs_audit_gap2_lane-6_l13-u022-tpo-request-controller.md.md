# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l13-u022-tpo-request-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l13-u022-tpo-request-controller.md

## G2-13-022-008  [P2] GAP  facet F06  effort M
- Legacy: Decide payload boolean approve, optional string reason (TpoRequestController.java:36-45).
- vNext now: Zod action APPROVE/REJECT, note, expectedUpdatedAt mandatory (tpo-request-decision-service.ts:22-37).
- Fix: Adapt boolean/reason to typed action/note and supply CAS token.
