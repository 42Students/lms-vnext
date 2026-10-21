# Work packet: edit src/modules/projects/admin-submission-review-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-projects-submissions.md

## G2-4-006-037  [P1] GAP  facet F11  effort M
- Legacy: Legacy any admin can ACCEPT/REQUEST_CHANGES/LOCK subject review state. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:326-349`)
- vNext now: Lock additionally requires policy mayRecordCollegeAdminDeliveryLock; other actions require ACTIVE status. (`src/components/projects/project-admin-submissions-page.tsx:61-64;src/modules/projects/admin-submission-review-model.ts:2-7`)
- Fix: Verify allowed lock permissions and backward admin capability; document intentional restriction.
