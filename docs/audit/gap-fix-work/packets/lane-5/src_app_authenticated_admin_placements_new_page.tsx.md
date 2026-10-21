# Work packet: edit src/app/(authenticated)/admin/placements/new/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-17-030-022  [P1] GAP  facet F06  effort L
- Legacy: New drive opens Modal width800 with JobForm; Duplicate same dialog prefilled duplicateFrom; DrivesLanding.js:656-672
- vNext now: New separate route `/admin/placements/new`, no landing dialog; admin/placements/new/page.tsx:9-38; admin/placements/page.tsx:68-74
- Fix: Restore width800 Create Drive dialog and duplicate-prefill, while preserving newer form validations.
