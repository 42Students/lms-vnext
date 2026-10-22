# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-004-026 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/quizzes/page.tsx, src/modules/admin-ui/super-admin-learning-csv-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:265-285`
- Expected fix: Legacy export page has 5 columns, vNext up to 500 filtered rows/13 columns with truncation marker and different filename. Keep page-export option or clearly label expanded export.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-4-020-046 [P1] GAP facet F13
- Files: src/app/(authenticated)/teacher/profile/details/page.tsx
- Legacy: New editor unavailable on unregistered DB04 schema. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:150-198`)
- Expected fix: Promote verified migration and show successful editing rather than permanent warning.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-4-018-055 [P1] GAP facet F14
- Files: src/components/projects/project-delivery-evidence-download.tsx
- Legacy: Legacy storage keys can be bare tenant key or R2 URL. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:24-33`)
- Expected fix: Create safe migration from legacy key/URL to owned typed resource file.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-4-028-028 [P1] MISSING facet F09
- Files: src/app/(authenticated)/tpo/settings/team/page.tsx
- Legacy: Danger confirmation Remove X from placement team with consequences (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:83-86`)
- Expected fix: Implement exact confirmation modal.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-12-025-034 [P1] GAP facet F12
- Files: src/modules/placements/recruiter-drive-request-model.ts
- Legacy: Legacy group records one Job per college, lifecycle status from createRequest. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:50-85`
- Expected fix: Create status mapping and review autoapproval semantics.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-12-025-051 [P1] GAP facet F22
- Files: src/modules/placements/recruiter-drive-request-model.ts
- Legacy: Legacy DriveForm contains job, company, pay/eligibility/rounds and college/group ties. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:14-49`
- Expected fix: Field-by-field DriveForm to HrDriveDraft transform and validation.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-5-002-015 [P1] MISSING facet F04 Data formatting
- Files: src/app/(authenticated)/college/placements/interviews/page.tsx
- Legacy: Interviewer name and mode/location in table and mobile. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:564-605; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:705-719)
- Expected fix: Expose interviewer name/empty fallback in projection and UI.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-5-006-007 [P1] GAP facet F03 Visible elements
- Files: (none, new feature)
- Legacy: Two policy inline inputs each with reload/save/default reset (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:156-203)
- Expected fix: Restore independent per-field Save/Reload/Reset to default controls.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-5-008-004 [P1] GAP facet F01 Purpose/entry/navigation
- Files: (none, new feature)
- Legacy: Schedule action opens class recurring scheduler Modal (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-426)
- Expected fix: Provide legacy recurrence modal action or exact equivalent.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-5-009-074 [P1] GAP facet F22 Data/migrations
- Files: (none, new feature)
- Legacy: ClassSchedule contains faculty/course/session mark timestamp (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:15-35)
- Expected fix: Migrate old times/course relationships and attendanceMarkedAt.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-5-012-095 [P1] GAP facet F20
- Files: src/components/placements/tpo-calendar-followup-actions.tsx
- Legacy: Legacy move/done serialized through followUpBusyRef, rejecting overlapping writes (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:151-166`)
- Expected fix: Protect simultaneous move/done on same id with shared lock and server idempotency
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-5-030-009 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx
- Legacy: Legacy save-in-progress on any child closes disabled, emits `Wait for current college setup action...`. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:58-61`
- Expected fix: Implement cross-tab save busy state and block losing in-flight work.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-6-020-010 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: Legacy deptChairId optional Integer (Department.java:17-18; DepartmentDTO.java:14-16).
- Expected fix: Decide intentional removal vs retain optional leadership relation in normalized role-assignment table.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-6-027-020 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy duplicate apply returns 409 'You have already applied to this job' (JobController.java:453-457).
- Expected fix: Define desired idempotent UX, preserve duplicate feedback on repeat click without second submission.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-11-017-007 [P1] MISSING facet F03
- Files: (none, new feature)
- Legacy: Request and Message badges when >0, max 99+ (more.js:52-63,102).
- Expected fix: Render live two count badges with 99+ overflow.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-11-023-009 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: Correction without link warns No proof attached (RequestsPanel.js:46-55).
- Expected fix: Evaluate proof per request and show exact missing-proof warning.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-11-026-042 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Public list/report accessible without JWT, but manager update removed (PublicBugTrackerController.java:54-56).
- Expected fix: Preserve manager isolation while designing authorized reporter session/intake path.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-13-022-037 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy allows nullable job/application for PAP/registration (TpoRequestService.java:39-64; StudentRequest.java:43-47).
- Expected fix: Use college+learner request scope independent of nullable application.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-030-080 [P1] GAP facet F22
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: Legacy active/attention values come from job, application, interview, offer-letter backend read models. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19`
- Expected fix: Map statuses, count predicates and archived/cancelled semantics field-by-field; verify thresholds.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-6-025-026 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy resource grant binds tenant/course/class/uploader in generated key (ResourceUploadController.java:45-55,116-118).
- Expected fix: Store immutable Resource parent content/offering/delivery IDs and verify on upload completion.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-6-030-046 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy unique name case-insensitive across all rows in same college; no DB unique index (LectureHallServiceImpl.java:76-86).
- Expected fix: Confirm expected name reuse after archive and prevent duplicate active restore conflicts with clear error.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-6-023-004 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: Legacy overview includes unbatched students and state FINISHED, IN_PLACEMENTS, NOT_STARTED (PlacementEligibilityService.java:366-425).
- Expected fix: Build total/eligible/placed/unbatched journey strip and same section ordering.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-6-022-044 [P1] GAP facet F12
- Files: src/modules/placements/tpo-policy-validation.ts
- Legacy: Legacy countsAsPlacedAt accepted only released/accepted on write, model comment includes SELECTED (CollegePlacementRules.java:30-32; TpoSettingsService.java:33-35).
- Expected fix: Align effective source-of-truth enum and legacy accepted choices.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-12-027-057 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/FacultyTeachingAssignment.java:17-60: int faculty/course/class/batch/semester, academicYear, role, Boolean active, date-only start/end, BaseModel lifecycle.
- Expected fix: Provide column-by-column migration mapping with explicit year, role, archived/inactive, and date-only semantics.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-14-030-022 [P1] MISSING facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:421-423 notes optional max1000 showCount rows2.
- Expected fix: Restore optional Notes distinct from mandatory change reason.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.
