# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-006-012 [P1] MISSING facet F04
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Submitted-by name + submitted timestamp displayed in same table cell. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:445-457`)
- Expected fix: Add submittedBy learner name with privacy/tenant masking.

## G2-4-006-014 [P1] GAP facet F04
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Revision count source is `delivery.revisionCount`, zero distinct from null. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:459-468`)
- Expected fix: Map explicit revisionCount, not assume version increments equal learner revisions.

## G2-4-006-017 [P1] MISSING facet F05
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Sortable Pending, Submitted default descending, Revisions. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:431-468`)
- Expected fix: Implement sorting Pending/Submitted/Revision and default newest-submitted.

## G2-4-006-025 [P1] GAP facet F07
- Files: src/components/projects/project-admin-submission-review.tsx
- Legacy: Invalid/reopened 409 or any 4xx refreshes modal targeted project and feedback. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:355-374`)
- Expected fix: On 409/4xx refresh latest submission details, re-sync disabled actions and prevent stale decisions.

## G2-4-006-031 [P1] GAP facet F09
- Files: src/components/projects/project-admin-submission-review.tsx
- Legacy: Under Review, Draft, Changes Requested, Locked show informational `No review action is currently available` in modal. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:897-914`)
- Expected fix: Add read-only review status/feedback modal for nonactionable submitted states.

## G2-4-006-035 [P1] GAP facet F10
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Legacy reviewed action is on workspace resolved delivery; full review summary opens independently. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:379-399`)
- Expected fix: Check which version is reviewed: current active delivery vs historical version; prohibit stale-version mutations.

## G2-4-006-037 [P1] GAP facet F11
- Files: src/components/projects/project-admin-submissions-page.tsx, src/modules/projects/admin-submission-review-model.ts
- Legacy: Legacy any admin can ACCEPT/REQUEST_CHANGES/LOCK subject review state. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:326-349`)
- Expected fix: Verify allowed lock permissions and backward admin capability; document intentional restriction.

## G2-4-006-059 [P1] GAP facet F20
- Files: src/components/projects/project-admin-submission-review.tsx
- Legacy: Legacy closed review Modal on successful ACCEPT then reload, on 409 reload and update same target. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:337-375`)
- Expected fix: Implement 409 refresh and dirty feedback preservation.

## G2-4-006-061 [P1] GAP facet F21
- Files: src/components/projects/project-admin-submission-review.tsx, src/components/projects/project-admin-submissions-page.tsx
- Legacy: Legacy review uses Admin API allowed bypass mentor membership with backend version and action enum. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:326-349`)
- Expected fix: Inspect service audit, version CAS and mentor bypass authorization.

## G2-4-018-001 [P1] GAP facet F01
- Files: src/modules/projects/submission-service.ts
- Legacy: Legacy project delivery accessible through /api/v1/projects/id/delivery and /submission endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-394`)
- Expected fix: Map old delivery/submission routes and identifiers to new versioned submission endpoints.

## G2-4-018-024 [P1] GAP facet F06
- Files: src/modules/projects/submission-service.ts
- Legacy: Legacy PUT delivery updates snapshot, notes, attachments and feedback via workspace controller. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-376`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:9-26`)
- Expected fix: Provide field-level form migration for old snapshot/primary attachment inputs.

## G2-4-018-025 [P1] GAP facet F06
- Files: src/modules/projects/submission-service.ts
- Legacy: Legacy attachment list additive rather than overwrite primary attachment. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- Expected fix: Ensure concurrent add/remove preserves unrelated entries with optimistic CAS.

## G2-4-018-026 [P1] GAP facet F06
- Files: src/modules/projects/submission-service.ts
- Legacy: Legacy submittedByType supports different submitter roles as string. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:83-85`)
- Expected fix: Document policy for prior mentor/admin submissions and creator names.

## G2-4-018-028 [P1] GAP facet F07
- Files: src/modules/projects/submission-service.ts, src/db/schema/projects.ts
- Legacy: Legacy entity has JPA @Version on Long for optimistic mutation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`)
- Expected fix: Ensure draft token uses ms precision and rejects stale writes without overwriting.

## G2-4-018-068 [P1] GAP facet F20
- Files: src/modules/projects/submission-service.ts
- Legacy: Legacy JSON attachment list added additively to avoid overwriting primary fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- Expected fix: Test concurrent add and remove, ensure no silent lost attachment.

## G2-4-017-026 [P1] GAP facet F06
- Files: src/components/projects/college-project-summary-editor-full.tsx, src/db/schema/projects.ts
- Legacy: Legacy classId integer optional editable in update DTO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:73-74`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:44-48`)
- Expected fix: Map classId to Section and account for multiple Sections per legacy Class.

## G2-4-017-041 [P1] GAP facet F10
- Files: src/modules/projects/instance-service.ts
- Legacy: Legacy workspace create can create manual or bulk one-per-learner projects. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:96-101`)
- Expected fix: Map class bulk creation and uniqueness with template-version materialization.

## G2-4-029-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/projects/[projectId]/page.tsx
- Legacy: Dedicated `/superadmin/projects/workspaces/[workspaceId]/audit` route with full audit link (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:68-85`)
- Expected fix: Add legacy workspace-audit URL adapter to canonical project audit tab.

## G2-4-009-007 [P1] GAP facet F03
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Quick filters Pending review, Needs student action, Reviewed, hoverable, keyboard-operable role=button aria-pressed; active teal border. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:648-676`)
- Expected fix: Recreate three quick-filter buttons with counters, aria-pressed and selected tag.

## G2-4-009-009 [P1] GAP facet F03
- Files: src/components/projects/project-admin-submission-review.tsx
- Legacy: Legacy Review action is visible for any workspace with submittedAt regardless current status. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:355-373`)
- Expected fix: Expose read-only review status/feedback modal for other submitted states.

## G2-4-009-011 [P1] GAP facet F03
- Files: src/components/projects/project-admin-submissions-page.tsx, src/components/projects/project-submissions-page-export.tsx
- Legacy: `Export CSV` disabled if visible active tab filtered list has zero rows. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:705-760`)
- Expected fix: Enable CSV on Not submitted tab and exact disabled conditions.

## G2-4-009-014 [P1] GAP facet F04
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Revision count uses `delivery.revisionCount`, distinguishing zero vs null. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:432-442`)
- Expected fix: Use stored revisionCount not version number proxy.

## G2-4-009-017 [P1] GAP facet F05
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Full table columns Workspace, Submission type, Review status, Pending, Submitted, Revisions, Reviewed by, Files/Links, Status, Actions. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:379-574`)
- Expected fix: Restore table columns/order and fixed Actions column.

## G2-4-009-019 [P1] MISSING facet F05
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Pending sortable by pendingDays fallback -Infinity, Submitted default desc, Revisions sortable. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:407-440`)
- Expected fix: Expose server-safe `sort` options with default newest submitted.

## G2-4-009-026 [P1] GAP facet F07
- Files: src/components/projects/project-admin-submission-review.tsx
- Legacy: Legacy 409 reloads project and reopens updated status/reviewFeedback, otherwise closes if missing. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:334-349`)
- Expected fix: On 409 refresh target record/expected version, preserve dirty draft.
