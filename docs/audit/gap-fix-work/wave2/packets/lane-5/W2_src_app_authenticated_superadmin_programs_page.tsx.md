# Work packet (wave 2): edit src/app/(authenticated)/superadmin/programs/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/superadmin-sections-programs.md

## G2-20-029-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin /superadmin/programs wraps shared Programs inside academic group shell; selected college required (`docs/legacy-source/frontend/src/pages/superadmin/programs.js:6-30`)
- vNext now: Legacy bookmark redirects to canonical /admin/programs; canonical adds PageBackLink and setup steps (`src/app/(authenticated)/superadmin/programs/page.tsx:5-8`, `src/app/(authenticated)/admin/programs/page.tsx:65-75`)
- Fix: Preserve legacy grouped shell and navigation hierarchy in canonical destination
