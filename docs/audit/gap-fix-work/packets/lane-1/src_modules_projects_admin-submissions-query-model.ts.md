# Work packet: edit src/modules/projects/admin-submissions-query-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-projects-submissions.md, docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-006-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy URL query `status`, `tab`, `q`, `projectId` restores focus/link then shallow-update on changes. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:124-162`)
- vNext now: New strict URL `view,q,status,submissionStatus,page,pageSize`; projectId unsupported. (`src/modules/projects/admin-submissions-query-model.ts:10-37`)
- Fix: Support focusedProjectId deep links or redirect preserving selected project; normalize old `tab` links.

## G2-4-006-058  [P1] GAP  facet F20  effort M
- Legacy: Legacy redirect/project deep-link uses `?projectId` and shows dismissible Showing workspace N tag. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:124-162;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:822-831`)
- vNext now: Strict parser rejects projectId as invalid, cannot deep-link targeted review. (`src/modules/projects/admin-submissions-query-model.ts:27-29`)
- Fix: Add projectId deep-link compatibility or redirect from old links.

## G2-4-009-022  [P1] GAP  facet F06  effort M
- Legacy: Status Select options Submitted, Under Review, Changes Requested, Draft(revising), Accepted, Locked; case-insensitive URL status normalization. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:39-46;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:108-121`)
- vNext now: New enum values DRAFT,SUBMITTED,CHANGES_REQUESTED,APPROVED,UNDER_REVIEW,LOCKED,DRAFT_REVISING, strict parser rejects old raw labels. (`src/modules/projects/admin-submissions-query-model.ts:14-17;src/modules/projects/admin-submissions-query-model.ts:27-37`)
- Fix: Support legacy bookmark status values and normalize to enum.

## G2-4-009-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy search and status are client-only, not sent to Java GET; `?tab`, `?status`, `?q` persisted shallow. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:108-152;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:233-253`)
- vNext now: New strict query `view,q,status,submissionStatus,page,pageSize`, old `tab` invalid. (`src/modules/projects/admin-submissions-query-model.ts:10-37`)
- Fix: Redirect old bookmark params including `tab=notSubmitted` and `status=Accepted`.
