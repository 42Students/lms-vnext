# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/new/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-17-030-031  [P2] GAP  facet F09  effort M
- Legacy: Create/duplicate shared 800px Modal, `Create Drive` or `Duplicate <title>`, destroyOnClose; DrivesLanding.js:656-672
- vNext now: vNext new route instead of modal; admin/placements/new/page.tsx:9-38
- Fix: Match modal titles/geometry/close and post-success list refresh.
