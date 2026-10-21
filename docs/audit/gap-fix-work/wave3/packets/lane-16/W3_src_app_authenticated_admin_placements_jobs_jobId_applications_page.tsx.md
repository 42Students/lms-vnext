# Work packet (wave 3): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-10-015-086  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:37-47; docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-117 — Shortlisted is distinct subview default ASSESSMENT with 4 tabs.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-110 — No path and full pipeline defaults ALL.
- Fix: Implement proper route and preserve deep links.

## G2-11-030-019  [P1] MISSING  facet F07  effort L
- Legacy: 308-316 offer-letter unsaved confirmation
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-132 no offer-letter editor in this route
- Fix: Add authorized offer-letter edit and confirm-discard flow.

## G2-15-026-014  [P1] MISSING  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:450-465 status/score/date/source/program/class/department/batch/search/skills filters
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:51-104 status/screening/source/department/program/cohort, search; no minScore/maxScore, appliedAfter/Before, skills
- Fix: Restore all legacy applicant filtering controls and matching SQL constraints
