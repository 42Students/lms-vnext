# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-012-071 [P1] GAP facet F19
- Files: src/components/placements/placement-drive-workspace.tsx, src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:49-64 — Promise.allSettled of job and metrics; attention fetched separately; page resilience under partial failure.
- Expected fix: Split required identity and optional metrics/auxiliary reads; add per-panel recoveries.

## G2-10-012-075 [P1] GAP facet F20
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:42-68,96-99 — Two fetch callbacks depend on selected job+college; alerts independent, latest scope remounted.
- Expected fix: Ensure optional panels cannot replace/lose main header or violate scoped access.

## G2-10-012-084 [P1] GAP facet F23
- Files: src/components/placements/super-admin-drive-pipeline.tsx, src/modules/placements/super-admin-drive-pipeline-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:235-255 — Comment explicitly forbids treating snapshot stage counts as cumulative funnel.
- Expected fix: Remove or fix misleading percentage metrics before production.

## G2-10-014-008 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx, src/components/placements/placement-drive-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:137-143; docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:580-618 — Legacy full JobForm visible for edit, including draft state.
- Expected fix: Put complete editor in Settings for relevant lifecycle states.

## G2-10-014-020 [P1] MISSING facet F05
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-159 — Non-draft statuses have Close/Open reversible button.
- Expected fix: Support controlled reopen/close.

## G2-10-019-015 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/features/[collegeId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:550-576 — Effective status text on/off, explicit ON/OFF pill, lock icon, inherited-from suffix, crossed shadowed state.
- Expected fix: Render every status provenance cue in each tree cell.

## G2-10-028-020 [P1] GAP facet F05
- Files: src/components/projects/project-admin-collection-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:388-398 — status choices Active/In progress/Ready/Blocked/Archived.
- Expected fix: Provide exact legacy options.

## G2-10-023-051 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:57-77 — GET colleges and organizations separately, with distinct errors.
- Expected fix: Separate organization/college reads and errors

## G2-15-022-047 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy entity has recruiter/college/org IDs, status, grant/valid/revoke dates, reason, capability set, version; RecruiterCollegeAccess.java:24-77
- Expected fix: Create column parity crosswalk: legacy revokedByType/grantedByType/version versus vNext updatedAt CAS; note source/join provenance.

## G2-17-026-008 [P1] GAP facet F05
- Files: src/modules/activity/notification-service.ts
- Legacy: `fetchAll` pageNo=0/pageSize=50, DB-clamped size 1..200, descending ID; NotificationController.java:88-104; NotificationServiceImpl.java:177-194
- Expected fix: Implement super-admin scoped listing with original page bounds and count, or document replacement admin affordance.

## G2-17-026-011 [P1] GAP facet F06
- Files: src/modules/activity/notification-service.ts
- Legacy: Create DTO required htmlContent ≤50000/title ≤200; NotificationDTO.java:10-17
- Expected fix: Define separate staff composition validation keeping legacy 200/50000 bounds if editor parity required.

## G2-17-026-012 [P1] GAP facet F06
- Files: src/modules/activity/notification-service.ts
- Legacy: Create requires classId>0 or courseId>0 and server-computed creatorFacultyId; NotificationController.java:65-78
- Expected fix: Supply authorized class/course audience resolver and immutable acting-user ownership mapping in producer API.

## G2-17-026-017 [P1] GAP facet F07
- Files: src/modules/activity/notification-service.ts
- Legacy: Invalid assessment URL rejects with `Assessment URL must use http or https`; NotificationServiceImpl.java:71-79
- Expected fix: Handle external assessment URLs as an explicit trusted optional field; do not bypass internal-href restriction.

## G2-17-026-021 [P1] GAP facet F10
- Files: src/modules/activity/notification-service.ts
- Legacy: POST `/createNotification`, PUT `/update/{id}`, DELETE `/delete/{id}`, DELETE `/deleteNotification`; NotificationController.java:59,179,214,272
- Expected fix: Build staff author/edit/delete workflows only where legacy required, with service & API method/ownership parity.

## G2-17-026-022 [P1] GAP facet F10
- Files: src/modules/activity/notification-service.ts
- Legacy: GET `/fetch/{id}`, `/fetchAll`, `/getNotifications`, `/getNotificationsByClassId`, `/getNotificationsForRecipient`; NotificationController.java:88-175
- Expected fix: Document full route inventory and map admin/class-specific reads to new authorization model.

## G2-17-026-026 [P1] GAP facet F11
- Files: src/modules/activity/notification-service.ts
- Legacy: `fetchAll` superadmin-only and JWT org/college scope; NotificationController.java:92-104
- Expected fix: Add explicitly authorized admin scoped reader, never change personal reader to unrestricted.

## G2-17-026-044 [P1] GAP facet F21
- Files: src/modules/activity/notification-service.ts
- Legacy: Legacy scheduler drains due SCHEDULED rows (query) and releases, SSE registry emits; NotificationRepository.java:179-186; NotificationServiceImpl.java:151-165
- Expected fix: Implement scheduled outbox release worker if scheduling retained; specify retries, failures, idempotent delivery.

## G2-19-027-009 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Create request fields `course_name`, `short_title`, `dept_id`, `parent_course_id`, `active`, `enabled`, `allowed_for_display`, `meta_data`, optional created_by_org_id; CourseDTO.java:12-31
- Expected fix: Document per-field semantic/JSON-key mapping and decide legacy visibility/parent/metadata fields; reject spoofed creator organization.

## G2-11-003-028 [P1] GAP facet F05
- Files: src/modules/placements/recruiter-drive-search-service.ts
- Legacy: Primary sort sent-back first then descending numeric job ID `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:126`
- Expected fix: Sort openRequests first globally then legacy ID

## G2-11-003-030 [P1] GAP facet F05
- Files: src/modules/placements/recruiter-drive-search-service.ts
- Legacy: Legacy closed includes cancelled/rejected job lifecycle `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:124`
- Expected fix: Reconcile rejected/cancelled published history

## G2-11-002-070 [P1] GAP facet F13
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Not shared explanatory alert `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:299`
- Expected fix: Distinct not-shared state

## G2-11-004-039 [P1] GAP facet F06
- Files: src/modules/placements/hr-drive-draft-model.ts
- Legacy: CTC required unless pure Internship `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:374`
- Expected fix: Keep legacy CTC requirement for other job types

## G2-11-004-040 [P1] GAP facet F06
- Files: src/modules/placements/hr-drive-draft-model.ts
- Legacy: Stipend required for pure Internship only `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:384`
- Expected fix: Align stipend requirement for combined job type

## G2-11-004-041 [P1] GAP facet F06
- Files: src/modules/placements/hr-drive-draft-model.ts
- Legacy: Unnamed optional rounds filtered during payload serialization `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:398`
- Expected fix: Allow optional blank rows to be omitted; cap legacy 100

## G2-11-004-044 [P1] GAP facet F06
- Files: src/modules/placements/hr-drive-draft-model.ts
- Legacy: Passing years 2000–2100 list; multiple allowed `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:410`
- Expected fix: Support multiple passing years in schema/API
