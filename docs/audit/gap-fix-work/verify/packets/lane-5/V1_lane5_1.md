# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-024-003 [P1] GAP facet F01
- Files: src/components/admin/college-feature-rule-editor.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:231-253,261-269 — GET placements-impact and mentor-count per college
- Expected fix: Verify same four placements and active mentor counters exposed, not only student population.

## G2-10-008-113 [P1] GAP facet F20
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:237-238` extracts rollups from paginated rows, pins totals
- Expected fix: Warn against treating truncated totals as authoritative; offer full filtered server summaries

## G2-10-021-053 [P1] GAP facet F10
- Files: src/components/admin/super-admin-hr-accounts.tsx, src/modules/placements/super-admin-hr-validation.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:196-226; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:84-102 — POST/PUT create/update recruiter with split name and companyName.
- Expected fix: Document field migration, existing identity reuse and contact updates.

## G2-11-009-093 [P1] MISSING facet F23
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Legacy error/loading/retry/stale/calendar fallbacks exist. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:47`
- Expected fix: Reimplement UI lifecycle states.

## G2-17-029-033 [P1] GAP facet F09
- Files: src/components/admin/tenant-settings-editor.tsx
- Legacy: legacy TenantSettings.js:804-847 asks before discard on scope switch or Add modal close
- Expected fix: Warn before discarding edited settings or unfinished add; maintain scope-change invariant

## G2-17-029-043 [P1] GAP facet F12
- Files: src/components/admin/tenant-settings-editor.tsx
- Legacy: legacy TenantSettings.js:128-145 OTP throttling settings are active runtime parameters per help
- Expected fix: Verify live runtime activation, label persisted-but-inactive controls and deployment cutover owner

## G2-17-001-013 [P1] GAP facet F06
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx, src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10-14 preserves original query string without parsing (including cls/ref/filter); docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:63-85 consumes cls.
- Expected fix: Plumb incoming searchParams through default page and preserve safely when building /home URL; decide which parameters are intentionally retired.

## G2-19-001-023 [P1] GAP facet F05
- Files: src/components/admin/admin-scoped-read-page.tsx, src/components/admin/admin-scoped-live-search.tsx
- Legacy: Legacy search autocomplete Recent/Popular/Search Results grouped suggestions, 200ms debounce, limit 15 `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:179-285`
- Expected fix: Restore selected-college Recent/Popular suggestion groups and selection behavior.

## G2-2-014-043 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: LC:108-137 independent updates, bounded100
- Expected fix: Do not apply 500-lesson content cap to course-status operation.

## G2-4-027-073 [P1] GAP facet F23
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: Hard-delete legacy and exact message + scheduled classes guard (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:175-206`)
- Expected fix: Document owner decision for irreversible action removed; adapt user journey.

## G2-4-008-023 [P1] MISSING facet F06
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Create Program/Batches/Classes/Semester separately with required labels and cascading choices. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-440`)
- Expected fix: Restore separate required Program, Batch, Class/Section and Semester controls.

## G2-17-029-063 [P1] GAP facet F23
- Files: src/components/admin/tenant-settings-editor.tsx, src/modules/platform-settings/service.ts
- Legacy: Legacy values actually applied by exact scope read; no inheritance. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:50-68`
- Expected fix: Display inactive/requires-deploy flag per key.

## G2-5-006-023 [P1] GAP facet F06 Forms
- Files: (none, new feature)
- Legacy: Separate numeric input min/max, Reset to default on custom (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:173-197)
- Expected fix: Support independent change/reset and original spinner inputs.

## G2-6-001-023 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old register optional Gender, DOB, Address, Bio fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1081-1101`
- Expected fix: Expose optional fields in create flow and persist via profile write

## G2-6-002-033 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old initial faculty type has choices PROFESSOR/ASSOCIATE/ASSISTANT/LECTURER/HEAD/COORDINATOR/MENTOR/PERMANENT/VISITING/GUEST/CONTRACT/ADJUNCT; ADMIN superadmin-only `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1057-1079`
- Expected fix: Provide all allowed enum choices and explicit separate membership permission mapping

## G2-6-030-033 [P1] GAP facet F07
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: Legacy delete when ANY class schedule exists 409 Cannot delete lecture hall: it has scheduled classes. Remove or reassign those schedules first. (LectureHallServiceImpl.java:143-152).
- Expected fix: Decide hard delete vs archive and historic-use semantics; expose exact reason and required reassignment.

## G2-6-003-023 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/faculty/page.tsx, src/components/admin/person-onboard-dialog.tsx
- Legacy: Old route is a wrapper and has no mutation itself; nested Faculty POST `/api/v1/faculty/register` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:23-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:106-170`
- Expected fix: Ensure delegated create persists dept/type/profile metadata and admin audit row

## G2-14-030-033 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:192-205 updateInterview(interview.id,payload,organizationId).
- Expected fix: Implement equivalent super-admin selected-college update, maintaining full payload fields.

## G2-7-013-023 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144-168: Title required; URL optional and type may be file/PDF/video without URL
- Expected fix: Verify legacy empty URL+description resource can be saved; align or document restriction

## G2-8-001-023 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/contacts/page.tsx
- Legacy: `controller/UserController.java:441-447`: learner/recruiter forbidden with text `The contacts directory is for staff only`
- Expected fix: Confirm intended faculty/TPO staff eligibility; return role-appropriate denial instead of always redirecting permitted staff

## G2-9-007-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/electives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/electives.js:20-31` — Missing college warning Admin not assigned to a college and contact administrator text
- Expected fix: Show equivalent explicit unassigned-college diagnostic

## G2-9-017-033 [P1] GAP facet F06
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:351-365` — Room Type required, initial no choice; Select type placeholder.
- Expected fix: Default empty type and require explicit selection.

## G2-9-017-063 [P1] GAP facet F12
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:176-188` — Unsaved edit draft cannot close without confirmation.
- Expected fix: Add dirty confirmation before dismiss.

## G2-9-018-003 [P1] GAP facet F01
- Files: src/components/admin/admin-program-directory.tsx
- Legacy: Shared `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:23-25` determines college-admin versus superadmin links
- Expected fix: Resolve target from current college URL; college route must link to permitted department page.

## G2-9-018-033 [P1] GAP facet F07
- Files: src/components/admin/admin-program-directory.tsx
- Legacy: Server errors map snake_case dept_id/duration_years onto fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:127-134,156-164`
- Expected fix: Map backend validation errors to Department/Duration and show closeable alert.
