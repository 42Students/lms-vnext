# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/[collegeId]/branding/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-15-020-047  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:145-153 load error keeps Retry
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/branding/error.tsx:1-40 route error screen
- Fix: Restore Retry inside card and keep tabs.
