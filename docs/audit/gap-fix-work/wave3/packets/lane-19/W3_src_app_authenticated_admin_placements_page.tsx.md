# Work packet (wave 3): edit src/app/(authenticated)/admin/placements/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md

## G2-17-030-084  [P1] MISSING  facet F23  effort L
- Legacy: Legacy read-only retention housekeeping and inline student lookup are absent from vNext landing. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:599`
- vNext now: vNext related link and operations summary replace both. `src/app/(authenticated)/admin/placements/page.tsx:72`
- Fix: Restore retention and inline lookup to finish legacy page parity.
