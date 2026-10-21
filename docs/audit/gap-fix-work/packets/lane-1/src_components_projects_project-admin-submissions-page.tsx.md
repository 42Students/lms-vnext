# Work packet: edit src/components/projects/project-admin-submissions-page.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-projects-submissions.md, docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-006-005  [P1] GAP  facet F03  effort M
- Legacy: Three quick-filter cards Pending review, Needs student action, Reviewed act as toggles. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:72-78;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:684-697`)
- vNext now: New PageHeader needsDoing items Under Review/Locked/Draft(revising), plus linked summary tiles. (`src/components/projects/project-admin-submissions-page.tsx:120-129;src/components/projects/project-admin-submissions-page.tsx:170-184`)
- Fix: Rebuild three exact quick-filter buckets with server counts and toggle chips.

## G2-4-006-012  [P1] MISSING  facet F04  effort M
- Legacy: Submitted-by name + submitted timestamp displayed in same table cell. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:445-457`)
- vNext now: New displays version and submit date, no submittedBy name in article. (`src/components/projects/project-admin-submissions-page.tsx:230-235`)
- Fix: Add submittedBy learner name with privacy/tenant masking.

## G2-4-006-014  [P1] GAP  facet F04  effort M
- Legacy: Revision count source is `delivery.revisionCount`, zero distinct from null. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:459-468`)
- vNext now: New count is `Math.max(0, version-1)` instead of revisionCount. (`src/components/projects/project-admin-submissions-page.tsx:251-253`)
- Fix: Map explicit revisionCount, not assume version increments equal learner revisions.

## G2-4-006-017  [P1] MISSING  facet F05  effort M
- Legacy: Sortable Pending, Submitted default descending, Revisions. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:431-468`)
- vNext now: New article list no column sort controls; backend order not exposed in view. (`src/components/projects/project-admin-submissions-page.tsx:211-293`)
- Fix: Implement sorting Pending/Submitted/Revision and default newest-submitted.

## G2-4-006-033  [P1] GAP  facet F10  effort M
- Legacy: Search and counts call Java GET `/api/v1/admin/projects?...view&search&page&size`; selected project fetches by ID. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:164-197`)
- vNext now: VNext list service direct scoped DB read; projectId URL focus not mapped. (`src/components/projects/project-admin-submissions-page.tsx:77-96`)
- Fix: Retain focused workspace link and count/filter semantics.

## G2-4-006-035  [P1] GAP  facet F10  effort M
- Legacy: Legacy reviewed action is on workspace resolved delivery; full review summary opens independently. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:379-399`)
- vNext now: New item keyed by submissionId and projectId from final-delivery history. (`src/components/projects/project-admin-submissions-page.tsx:275-283`)
- Fix: Check which version is reviewed: current active delivery vs historical version; prohibit stale-version mutations.

## G2-4-006-037  [P1] GAP  facet F11  effort M
- Legacy: Legacy any admin can ACCEPT/REQUEST_CHANGES/LOCK subject review state. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:326-349`)
- vNext now: Lock additionally requires policy mayRecordCollegeAdminDeliveryLock; other actions require ACTIVE status. (`src/components/projects/project-admin-submissions-page.tsx:61-64;src/modules/projects/admin-submission-review-model.ts:2-7`)
- Fix: Verify allowed lock permissions and backward admin capability; document intentional restriction.

## G2-4-006-061  [P1] GAP  facet F21  effort M
- Legacy: Legacy review uses Admin API allowed bypass mentor membership with backend version and action enum. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:326-349`)
- vNext now: New direct POST review/lock endpoint, with allowLock scoped to admin policy. (`src/components/projects/project-admin-submission-review.tsx:24-36;src/components/projects/project-admin-submissions-page.tsx:61-64`)
- Fix: Inspect service audit, version CAS and mentor bypass authorization.

## G2-4-006-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy workspace delivery status/reviewStatus, submittedAt, revisionCount, reviewedByType, feedback, attachmentUrl are JSON-backed. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:33-70;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:403-610`)
- vNext now: VNext normalized submission rows/version/lockedAt/reopenedAt/attachments with item projects. (`src/components/projects/project-admin-submissions-page.tsx:191-205;src/components/projects/project-admin-submissions-page.tsx:211-275`)
- Fix: Write migration field-by-field mapping, especially revisionCount/status/reopened history.

## G2-4-009-007  [P1] GAP  facet F03  effort M
- Legacy: Quick filters Pending review, Needs student action, Reviewed, hoverable, keyboard-operable role=button aria-pressed; active teal border. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:648-676`)
- vNext now: New header shortcuts Under Review, Locked, Draft(revising) and linked counters, no three pressed-filter cards. (`src/components/projects/project-admin-submissions-page.tsx:120-129;src/components/projects/project-admin-submissions-page.tsx:170-184`)
- Fix: Recreate three quick-filter buttons with counters, aria-pressed and selected tag.

## G2-4-009-011  [P1] GAP  facet F03  effort M
- Legacy: `Export CSV` disabled if visible active tab filtered list has zero rows. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:705-760`)
- vNext now: New Export CSV only in ALL view and disabled if returned page empty. (`src/components/projects/project-admin-submissions-page.tsx:191-205;src/components/projects/project-submissions-page-export.tsx:18-34`)
- Fix: Enable CSV on Not submitted tab and exact disabled conditions.

## G2-4-009-013  [P1] GAP  facet F04  effort M
- Legacy: Submitted-by name + submitted timestamp displayed together; reviewedBy reviewer name/date/type ADMIN orange chip. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:415-465`)
- vNext now: New version/date header and `Reviewed by` text, no submittedBy or review timestamp/type tag. (`src/components/projects/project-admin-submissions-page.tsx:230-255`)
- Fix: Restore submitted-by, reviewedAt, reviewedByType in row and export.

## G2-4-009-014  [P1] GAP  facet F04  effort M
- Legacy: Revision count uses `delivery.revisionCount`, distinguishing zero vs null. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:432-442`)
- vNext now: New computes revision count by version minus one. (`src/components/projects/project-admin-submissions-page.tsx:251-253`)
- Fix: Use stored revisionCount not version number proxy.

## G2-4-009-017  [P1] GAP  facet F05  effort M
- Legacy: Full table columns Workspace, Submission type, Review status, Pending, Submitted, Revisions, Reviewed by, Files/Links, Status, Actions. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:379-574`)
- vNext now: Submitted list is article/card, not table, lacks sortable columns. (`src/components/projects/project-admin-submissions-page.tsx:211-290`)
- Fix: Restore table columns/order and fixed Actions column.

## G2-4-009-019  [P1] MISSING  facet F05  effort M
- Legacy: Pending sortable by pendingDays fallback -Infinity, Submitted default desc, Revisions sortable. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:407-440`)
- vNext now: New article list has no user sort affordance. (`src/components/projects/project-admin-submissions-page.tsx:211-290`)
- Fix: Expose server-safe `sort` options with default newest submitted.

## G2-4-009-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy Lock permission shown for every admin with submitted delivery, guards backend status. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:875-892`)
- vNext now: New lock shown only if mayRecordCollegeAdminDeliveryLock and allowed status. (`src/components/projects/project-admin-submissions-page.tsx:61-64;src/components/projects/project-admin-submission-review.tsx:69-79`)
- Fix: Decide SuperAdmin exemption if old allowed, preserve no privilege regression.

## G2-4-009-047  [P1] MISSING  facet F14  effort M
- Legacy: Not submitted export `project-not-submitted.csv`, Workspace,Mentor,Status,Progress,Inactive. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:710-738`)
- vNext now: No Export CSV in Not submitted section. (`src/components/projects/project-admin-submissions-page.tsx:141-169`)
- Fix: Add unsubmitted CSV control and matching columns/filename.

## G2-4-009-064  [P1] GAP  facet F22  effort M
- Legacy: Old project delivery JSON includes reviewStatus, submittedAt, revisionCount, feedback, reviewedByName/Type, attachmentUrl. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:31-75;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:379-518`)
- vNext now: New distinct final-delivery row has version, status, reopenedAt, lockedAt, evidence attachment array. (`src/components/projects/project-admin-submissions-page.tsx:191-205;src/components/projects/project-admin-submissions-page.tsx:211-280`)
- Fix: Map old revisions, status, reviewer type and URL fields explicitly through migration.

## G2-4-006-029  [P2] GAP  facet F08  effort M
- Legacy: Missing file error Could not resolve this submission's file. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:291-301`)
- vNext now: Unsafe/missing URL shown as text File · Evidence rather than error on click. (`src/components/projects/project-admin-submissions-page.tsx:263-273`)
- Fix: Give explicit unavailable-file explanation, never open unsafe schemes.

## G2-4-009-030  [P2] GAP  facet F08  effort M
- Legacy: Wrong file URL displays `Could not resolve this submission's file.` message. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:267-281`)
- vNext now: New suppresses link and displays `File · Evidence` instead of toast. (`src/components/projects/project-admin-submissions-page.tsx:263-273`)
- Fix: Provide download-unavailable user feedback without unsafe URL opening.
