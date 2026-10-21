# Work packet (wave 2): edit src/components/projects/project-admin-submission-review.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-projects-submissions.md, docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-006-008  [P2] GAP  facet F03  effort M
- Legacy: Review action label `View review status` when under review, otherwise `Review`. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:389-392`)
- vNext now: Review button only rendered for submitted/approved and unlocked; no Under Review status view. (`src/components/projects/project-admin-submission-review.tsx:45-50`)
- Fix: Provide read-only View review status for UNDER_REVIEW state.

## G2-4-006-022  [P2] GAP  facet F06  effort M
- Legacy: Review feedback textarea rows4 placeholder Optional — shown to learner alongside decision. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:915-923`)
- vNext now: Textarea rows4 maxLength6000, placeholder Optional for Accept/Lock — required for Request changes. (`src/components/projects/project-admin-submission-review.tsx:63-68`)
- Fix: Align help text/validation while keeping explicit required-change feedback.

## G2-4-006-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy review can send REQUEST_CHANGES with empty trimmed feedback. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:337-349`)
- vNext now: New rejects request changes unless feedback.trim nonempty. (`src/components/projects/project-admin-submission-review.tsx:24-28`)
- Fix: Document intentional stricter rule or permit empty legacy request when approved.

## G2-4-006-030  [P2] GAP  facet F09  effort M
- Legacy: Review modal title Review — WORKSPACE, current-status tag, optional textarea, Cancel/Request changes/Accept/Lock. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:885-965`)
- vNext now: Dialog title Review — WORKSPACE, feedback, Request changes/Accept, Lock hidden in details with second ConfirmDialog. (`src/components/projects/project-admin-submission-review.tsx:47-79`)
- Fix: Restore visible Lock action prominence, preserve confirmation and risk warning.

## G2-4-006-034  [P2] GAP  facet F10  effort M
- Legacy: Decision API adminReviewProjectDelivery sends {delivery:{feedback,version,submitAction}}. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:337-349`)
- vNext now: POST `/api/projects/{projectId}/submissions/{submissionId}/review` with decision/feedback, lock separate. (`src/components/projects/project-admin-submission-review.tsx:30-36`)
- Fix: Ensure optimistic delivery version verification and identical allowed transitions.

## G2-4-006-045  [P2] GAP  facet F13  effort M
- Legacy: Review pending action disabled only other action in flight; error refresh on client 409. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:926-959;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:355-374`)
- vNext now: New uses one pending boolean with save/error banners, but stale refresh missing. (`src/components/projects/project-admin-submission-review.tsx:24-44`)
- Fix: Prevent double clicks, show per-action busy and recover stale version.

## G2-4-009-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy `Review — workspace` Modal with current status Tag, action footer Cancel/Request changes/Accept/Lock. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:835-896`)
- vNext now: New Dialog has feedback/Request/Accept and Lock nested in expandable details + ConfirmDialog. (`src/components/projects/project-admin-submission-review.tsx:47-79`)
- Fix: Match modal action placement while keeping secondary Lock confirmation.

## G2-4-009-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy Review modal always allows Accept button (even if state unsuitable), submit backend rejects invalid state. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:859-874`)
- vNext now: New canAdminSettleDelivery hides all invalid-state actions and sometimes whole Review button. (`src/modules/projects/admin-submission-review-model.ts:2-7;src/components/projects/project-admin-submission-review.tsx:45-61`)
- Fix: Show modal read-only current status with disabled actions for invalid states, no misleading state.
