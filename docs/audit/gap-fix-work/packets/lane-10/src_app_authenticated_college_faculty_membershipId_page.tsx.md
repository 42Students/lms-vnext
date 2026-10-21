# Work packet: edit src/app/(authenticated)/college/faculty/[membershipId]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/faculty-model.md

## G2-4-020-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy facultyId integer lookups target profile owner in GET. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:56-74`)
- vNext now: New self profile derives principal identity, college faculty detail uses membershipId UUID. (`src/app/(authenticated)/teacher/profile/page.tsx:8-17`; `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx:15-24`)
- Fix: Map legacy faculty numeric IDs to per-college membership and self-only read.
