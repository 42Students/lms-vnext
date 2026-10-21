# Work packet (wave 2): edit src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-9-014-065  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1992-2010` — TableSkeleton 10 rows 8 columns during first load.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/loading.tsx:3-6` — GracefulPageLoading shape directory.
- Fix: Match skeleton dimensions/density on route load.
