# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-search-cache.md

## G2-13-014-007  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:59-61` query string param `query` with default empty
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:69-72` labeled 'Name, roll, branch, batch, email, phone or role' name `search`
- Fix: Offer legacy `query` alias on compatibility API; preserve new descriptive UI copy

## G2-13-014-044  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:75` exact 'Organization context required for job application search.'
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:27-44` 'Invalid applicant filters' messages, no org-context wording
- Fix: Ensure diagnostic error distinguishes permission from invalid filters, without tenant enumeration

## G2-13-014-045  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:27-29` getDisplayName learnerName + ' - ' + jobTitle (null learnerName→blank)
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:114` per-row action label (student??'Applicant')+' · '+role
- Fix: Specify fallback 'Applicant', separator dot vs hyphen and null-title behavior in compatibility suggestions

## G2-13-014-046  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:80` 'Applications retrieved', `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:103` 'Stats retrieved'
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:106-107` 'matching applications · Page...'
- Fix: Keep UI counts wording as new design; map old success message only for client contract
