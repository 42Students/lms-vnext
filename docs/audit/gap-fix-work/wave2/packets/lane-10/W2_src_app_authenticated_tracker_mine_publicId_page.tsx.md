# Work packet (wave 2): edit src/app/(authenticated)/tracker/mine/[publicId]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-083  [P2] GAP  facet F20  effort M
- Legacy: `BugTrackerService.java:114-120`: issue lookup case-insensitive on publicId.
- vNext now: `src/app/(authenticated)/tracker/mine/[publicId]/page.tsx:15-29`: validates new public ID shape; reporter-scoped read.
- Fix: Ensure older sequential IDs and case folding resolve during transition; don't weaken ownership checks.
