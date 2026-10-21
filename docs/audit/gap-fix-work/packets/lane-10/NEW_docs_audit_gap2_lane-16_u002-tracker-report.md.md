# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u002-tracker-report.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-015  [P1] GAP  facet F04  effort M
- Legacy: `BugTrackerService.java:71-75`: ID `LMS-%04d` derived from DB-generated sequential ID.
- vNext now: `report-service.ts:21`: `LMS-` plus random 64-bit decimal padded min four digits.
- Fix: Decide backwards-compatible display/lookup ID contract; if exact parity essential, restore sequential public reference without exposing DB keys.

## G2-16-002-035  [P1] GAP  facet F07  effort M
- Legacy: `BugTrackerService.java:43-49`: reporter must exist as active access row; otherwise `Select a valid reporter`.
- vNext now: `report-service.ts:18-29`: creates fresh inactive reporter access for every allowed reporter name.
- Fix: Ensure reporter identity allowlist maps to valid approved access, or document deliberate authenticated provenance change.
