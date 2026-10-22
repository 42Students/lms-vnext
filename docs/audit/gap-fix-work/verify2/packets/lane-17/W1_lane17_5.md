# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-014-047 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LC:63-71 CourseDTO active,enabled,allowedForDisplay columns
- Expected fix: Persist actual course status and mapping, not merely lesson content flags.

## G2-2-023-008 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/departments/page.tsx, src/app/(authenticated)/admin/organizations/page.tsx
- Legacy: AdminRecycleBinController.java:115-156 types Department, Program, Class, Semester, Lecture Hall, Quiz, Notification, College, Organization
- Expected fix: Offer all nine restore type options with exact labels.

## G2-2-023-030 [P1] GAP facet F10
- Files: src/modules/colleges/service.ts
- Legacy: AdminRecycleBinController.java:259-278 restore changes only `BaseModel.isDeleted=false`
- Expected fix: Define per-entity restore transition; never assume a uniform boolean across schema.

## G2-2-023-035 [P1] GAP facet F11
- Files: src/modules/colleges/service.ts
- Legacy: AdminRecycleBinController.java:267-276 verifies record-college match and admin grant
- Expected fix: Verify row tenant inside mutation transaction for each entity type.

## G2-2-031-006 [P1] GAP facet F01
- Files: src/components/academics/college-section-lifecycle-action.tsx
- Legacy: ClassController.java:224-259 DELETE /delete/{id} permanently removes section.
- Expected fix: Document intentional archive vs delete semantics, data retention and permission scope.

## G2-2-031-046 [P1] GAP facet F10
- Files: src/components/academics/college-section-lifecycle-action.tsx
- Legacy: ClassController.java:224-259 DELETE hard deletes if no students/schedules.
- Expected fix: Document archive-vs-delete and reactivation availability in activity/history.

## G2-2-034-030 [P1] GAP facet F11
- Files: src/app/api/client-errors/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:27-30 auth for all roles, anon 401
- Expected fix: Confirm intended anonymous root error telemetry versus authenticated-only anti-abuse policy.

## G2-2-034-064 [P1] GAP facet F23
- Files: src/app/api/client-errors/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:27-29 required authentication
- Expected fix: Decide deliberate observability extension vs old abuse/auth invariant.

## G2-13-028-061 [P1] GAP facet F20
- Files: src/components/projects/mentor-product-backlog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:58-63 tasksToken original snapshot CAS
- Expected fix: Implement section-level CAS for bulk edits and conflict user messaging.

## G2-2-001-015 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LS:65-68 severity priority critical,high,medium,low, then found_at DESC,id
- Expected fix: Restore severity-first server sort and deterministic reported-date tie-break.

## G2-2-003-005 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LC:34,57 resolves environment key zepto.template.<event.templateKey> via LR:181-184
- Expected fix: Port event-specific property keys into typed provider configuration; protect OTP templates separately.

## G2-20-031-082 [P1] GAP facet F18
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: Legacy Recruiter accept Pending heading 'One more step' (`docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:146-153`)
- Expected fix: Add pending-result title and correct role-specific sign-in instructions

## G2-20-030-019 [P1] GAP facet F02
- Files: src/app/(authenticated)/teacher/profile/contacts/page.tsx
- Legacy: Legacy Contacts card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1362-1386`)
- Expected fix: Restore Contacts section position and legacy card presentation

## G2-3-028-025 [P1] GAP facet F05
- Files: src/modules/colleges/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:83-135`
- Expected fix: The global all=true switcher override is missing from listColleges when a selected college scope is set.

## G2-3-028-045 [P1] GAP facet F10
- Files: src/modules/colleges/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:147-190`
- Expected fix: Legacy edit allows changing uniqueId and org, updating related denormalized placements; vNext immutable parent and code. Decide parity.

## G2-3-028-050 [P1] GAP facet F11
- Files: src/modules/colleges/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:93-119`
- Expected fix: Superadmin selecting one college must retain ability to switch to all others; verify dedicated global switcher endpoint.

## G2-3-028-081 [P1] GAP facet F22
- Files: src/modules/colleges/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:192-235`
- Expected fix: Soft-delete boolean vs ACTIVE/ARCHIVED restorable status lifecycle; map deleted record visibility.

## G2-3-015-008 [P1] GAP facet F04
- Files: src/modules/placements/company-drive-facts-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:173-179`
- Expected fix: Legacy historic company drive match uses companyId OR same companyName when companyId null; vNext normalized relationship requires ID. Provide tenant-safe historic fallback for unlinked old drives.

## G2-3-015-028 [P1] GAP facet F11
- Files: src/modules/placements/company-drive-facts-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:190-214`
- Expected fix: Legacy unscoped aggregate exists for global/no college and college-specific variant excludes other-college rows; vNext company facts is college scoped relationship. Preserve org/global views only with explicit super-admin access.

## G2-3-011-018 [P1] MISSING facet F06
- Files: src/components/tpo/tpo-job-types-editor.tsx, src/modules/placements/tpo-job-type-write-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:138-142`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:154-159`
- Expected fix: Legacy permits deletion of unused custom labels, disables action for in-use type with Used by drives: switch it off instead tooltip. vNext has no removal API/button. Add safe deletion.

## G2-3-011-048 [P1] MISSING facet F21
- Files: src/components/tpo/tpo-job-types-editor.tsx, src/components/tpo/tpo-draft-drive-step-one-form.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ChoicesController.java:32-45`, `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:130-137`
- Expected fix: Legacy /api/v1/choices powers drive forms, filters and reports; vNext explicitly says custom job types not integrated, draft selector has fixed three choices. Integrate authoritative type source at each consumer.

## G2-15-031-010 [P1] GAP facet F04
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-120`
- Expected fix: Legacy Redux selectedCourseId/classId/slug vs new courseSectionDeliveryId.

## G2-3-026-005 [P1] MISSING facet F01
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:146-153`
- Expected fix: Expose an existing-recruiter pending consent page and sign-in navigation rather than representing every acceptance as completed join.

## G2-3-026-020 [P1] MISSING facet F06
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:188-192`
- Expected fix: Re-enable work email required/type validation and editable typed email when no address was captured by TPO, if that legacy workflow is retained.

## G2-3-026-045 [P1] GAP facet F11
- Files: src/modules/placements/recruiter-invite-otp-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:172-176`
- Expected fix: Legacy permits a missing stored email once typed and company-domain checked; vNext lead without email and company relationship is structurally rejected.
