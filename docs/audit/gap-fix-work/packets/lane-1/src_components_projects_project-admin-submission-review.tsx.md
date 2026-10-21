# Work packet: edit src/components/projects/project-admin-submission-review.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-projects-submissions.md, docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-006-025  [P1] GAP  facet F07  effort M
- Legacy: Invalid/reopened 409 or any 4xx refreshes modal targeted project and feedback. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:355-374`)
- vNext now: Review catch sets generic error but no rerender of current record until manual refresh. (`src/components/projects/project-admin-submission-review.tsx:24-44`)
- Fix: On 409/4xx refresh latest submission details, re-sync disabled actions and prevent stale decisions.

## G2-4-006-031  [P1] GAP  facet F09  effort M
- Legacy: Under Review, Draft, Changes Requested, Locked show informational `No review action is currently available` in modal. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:897-914`)
- vNext now: New Review control not rendered in those states, so no read-only modal feedback. (`src/components/projects/project-admin-submission-review.tsx:45-47`)
- Fix: Add read-only review status/feedback modal for nonactionable submitted states.

## G2-4-006-059  [P1] GAP  facet F20  effort M
- Legacy: Legacy closed review Modal on successful ACCEPT then reload, on 409 reload and update same target. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:337-375`)
- vNext now: New closes and refreshes success, but on error retains prior UI state. (`src/components/projects/project-admin-submission-review.tsx:24-44`)
- Fix: Implement 409 refresh and dirty feedback preservation.

## G2-4-006-061  [P1] GAP  facet F21  effort M
- Legacy: Legacy review uses Admin API allowed bypass mentor membership with backend version and action enum. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:326-349`)
- vNext now: New direct POST review/lock endpoint, with allowLock scoped to admin policy. (`src/components/projects/project-admin-submission-review.tsx:24-36;src/components/projects/project-admin-submissions-page.tsx:61-64`)
- Fix: Inspect service audit, version CAS and mentor bypass authorization.

## G2-4-009-009  [P1] GAP  facet F03  effort M
- Legacy: Legacy Review action is visible for any workspace with submittedAt regardless current status. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:355-373`)
- vNext now: New Review hidden when status not SUBMITTED/APPROVED, locked or project archived. (`src/components/projects/project-admin-submission-review.tsx:45-47`)
- Fix: Expose read-only review status/feedback modal for other submitted states.

## G2-4-009-026  [P1] GAP  facet F07  effort M
- Legacy: Legacy 409 reloads project and reopens updated status/reviewFeedback, otherwise closes if missing. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:334-349`)
- vNext now: New catch keeps feedback but displays generic failure and does not refetch row on 409. (`src/components/projects/project-admin-submission-review.tsx:37-44`)
- Fix: On 409 refresh target record/expected version, preserve dirty draft.

## G2-4-009-035  [P1] GAP  facet F10  effort M
- Legacy: Review POST adminReviewProjectDelivery with `{delivery:{feedback,version,submitAction}}`. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:307-328`)
- vNext now: New POST `/api/projects/[projectId]/submissions/[submissionId]/review` with decision and feedback; lock separate. (`src/components/projects/project-admin-submission-review.tsx:24-36`)
- Fix: Ensure version-based optimistic concurrency and only latest-submission write.

## G2-4-009-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy Lock permission shown for every admin with submitted delivery, guards backend status. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:875-892`)
- vNext now: New lock shown only if mayRecordCollegeAdminDeliveryLock and allowed status. (`src/components/projects/project-admin-submissions-page.tsx:61-64;src/components/projects/project-admin-submission-review.tsx:69-79`)
- Fix: Decide SuperAdmin exemption if old allowed, preserve no privilege regression.

## G2-4-009-060  [P1] GAP  facet F20  effort M
- Legacy: Review error 409 reloads same project, updates feedback/status version; otherwise closes if absent. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:334-349`)
- vNext now: New generic error retains stale review input, no record refresh. (`src/components/projects/project-admin-submission-review.tsx:37-43`)
- Fix: Implement 409 re-fetch/collision handling.

## G2-4-009-062  [P1] GAP  facet F21  effort M
- Legacy: Old Java API `adminReviewProjectDelivery` checks acting SA college, uses version in delivery JSON. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:302-328`)
- vNext now: New POST submissions/:id review/lock endpoints, acts on exact submissionId. (`src/components/projects/project-admin-submission-review.tsx:30-36`)
- Fix: Verify tenant/role/CAS and audit parity at new handlers.

## G2-4-006-026  [P2] GAP  facet F07  effort M
- Legacy: HTTP error toast uses server response message then Failed to update this submission. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:350-357`)
- vNext now: Error Could not review this submission. Your feedback has been kept. Try again. (`src/components/projects/project-admin-submission-review.tsx:37-43`)
- Fix: Expose safe field/state errors and maintain feedback.

## G2-4-009-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy error shows server message or `Failed to update this submission.`. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:334-350`)
- vNext now: New generic `Could not review this submission. Your feedback has been kept. Try again.` (`src/components/projects/project-admin-submission-review.tsx:37-44`)
- Fix: Propagate safe business-state error reason and re-sync controls.
