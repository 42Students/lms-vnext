# Work packet: edit src/app/api/colleges/[collegeId]/branding/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-15-020-025  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:64-65 fallback 'Couldn't load branding for this college.'
- vNext now: src/app/api/colleges/[collegeId]/branding/route.ts:20-34 404/standard error envelope
- Fix: Show legacy error in Retry panel.
