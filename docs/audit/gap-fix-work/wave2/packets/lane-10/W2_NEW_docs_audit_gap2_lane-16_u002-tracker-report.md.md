# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-16/u002-tracker-report.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-055  [P2] GAP  facet F12  effort M
- Legacy: `BugTrackerService.java:71-74`: issued public ID sequential from DB row; duplicates distinguished by DB identity.
- vNext now: `report-service.ts:21-23`: cryptographic random ID per attempt, no explicit idempotency key.
- Fix: Document ID format migration and add retry-safe request idempotency if public endpoint restored.
