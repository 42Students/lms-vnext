# Work packet: edit src/app/(authenticated)/admin/placements/applications/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md, docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md

## G2-11-030-009  [P1] GAP  facet F04  effort L
- Legacy: 2040-2255 detail includes contact email/phone, resume, application status/notes
- vNext now: src/app/(authenticated)/admin/placements/applications/page.tsx:13-16 summary explicitly excludes private contact and notes; N uses pipeline controls
- Fix: Restore authorized superadmin detail without exposing private data to insufficient permission.

## G2-12-014-023  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:73-77`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:11-15`
- Fix: Legacy 403 error Organization context required for job application search. when no org; vNext selected college denied/empty gate with different UI guidance.
