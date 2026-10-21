# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-031-023 [P1] GAP facet F07
- Files: src/components/hr/recruiter-profile-details-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:106-108: INVALID_MOBILE maps directly to contactMobile field and 'Check the mobile number.'
- Expected fix: Bind Zod/server field errors to matching control.

## G2-1-035-063 [P1] GAP facet F17
- Files: src/components/hr/recruiter-profile-details-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:158-175: AntD Form validation moves focus to invalid field.
- Expected fix: Set firstName required, native constraints and aria-invalid field feedback.

## G2-13-026-013 [P1] GAP facet F06
- Files: src/app/api/academics/semesters/[semesterId]/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:124-130 — updateStatus query programId/id/statusType, no request body.
- Expected fix: Implement explicit activate status operation/translation.

## G2-10-017-033 [P1] MISSING facet F07
- Files: src/app/(authenticated)/admin/placements/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:674-698 — Extend deadline prohibits past date, picker YYYY-MM-DD HH:mm, defaults +7d end of day.
- Expected fix: Restore datepicker and validation.

## G2-11-002-063 [P1] GAP facet F12
- Files: src/components/hr/recruiter-round-inline-editor.tsx
- Legacy: Edit only own unused round and unfinished drive `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:463`
- Expected fix: Align inUse/backend policy

## G2-12-007-043 [P1] GAP facet F12
- Files: src/app/(authenticated)/learn/allAssignments/page.tsx
- Legacy: Submission can contain several assets of different kinds `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:66-76,392-471`
- Expected fix: Ensure combined submission asset history not lost

## G2-18-020-013 [P1] GAP facet F05
- Files: src/modules/academics/learner-schedule-service.ts, src/modules/courses/faculty-schedule-service.ts
- Legacy: ClassScheduleRepository.java:45-65 lists own faculty/class/multi-class between start/end
- Expected fix: Verify multiple elective sections included, no leakage of shared events, and start/end inclusive date semantics

## G2-18-020-033 [P1] GAP facet F12
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleRepository.java:67-71 elective future-clash half-open overlap test
- Expected fix: Provide future-overlap warning across learner elective sections using starts<otherEnds and otherStarts<ends

## G2-13-001-023 [P1] GAP facet F05
- Files: src/components/hr/hr-company-reports-grid.tsx
- Legacy: Table clickable anywhere in row; Drive name is separate keyboard link (`docs/legacy-source/frontend/src/pages/recruiter/company.js:122-126`)
- Expected fix: Preserve row-click affordance and accessible Drive title link without losing explicit action.

## G2-17-002-033 [P1] GAP facet F07
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:201-208 maps semester_id, course_ids, program_id server validation to Form controls and addError banner.
- Expected fix: Restore per-field API validation and operation-specific add error banner.

## G2-19-005-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/my-placements/calendar/page.tsx
- Legacy: Moved address retained for old notices/emails/bookmarks rather than 404 `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:5-8`
- Expected fix: Maintain destination semantics for copied deep links, not just route existence.

## G2-2-023-003 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/announcements/page.tsx
- Legacy: AdminRecycleBinController.java:173-197 GET list by entityType/collegeId
- Expected fix: Add common deleted-list endpoint for every registered type.

## G2-20-006-023 [P1] MISSING facet F06
- Files: src/app/page.tsx
- Legacy: DGIPUC Student/Teacher toggle clears number/OTP/form on change; `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:75-91`
- Expected fix: Restore Student/Teacher reset semantics if that institution remains supported.

## G2-20-029-073 [P1] GAP facet F22
- Files: src/modules/academics/college-program-mutation-service.ts
- Legacy: Legacy delete removes row physically if dependency checks clear (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-179`)
- Expected fix: Record archive instead of deletion and handle duplicate-name reuse intentionally

## G2-4-005-013 [P1] GAP facet F05
- Files: src/modules/academics/college-mapping-model.ts
- Legacy: Default lists inactive/active together. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:135-158;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:369`)
- Expected fix: Default ALL or explicitly disclose hidden records.

## G2-4-024-013 [P1] GAP facet F04
- Files: src/modules/electives/service.ts, src/db/schema/electives.ts
- Legacy: Legacy offering capacity nullable means unlimited (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveRequests.java:25-30`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:306-317`)
- Expected fix: Allow null unlimited capacity in form/service without arbitrary upper bound.

## G2-4-024-043 [P1] GAP facet F10
- Files: src/modules/electives/service.ts
- Legacy: Legacy POST offering builds group, GROUP_BACKED class, auto course association (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:305-353`)
- Expected fix: Ensure new offering automatically provisions valid class/delivery or provide guided selection; don't strand setup.

## G2-4-024-053 [P1] GAP facet F12
- Files: src/modules/electives/college-slot-mutation-service.ts
- Legacy: Legacy forbids academic identity changes if any historical membership including removed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:177-212`)
- Expected fix: Check historical group member events before changing picks/credits; not only currently active records.

## G2-5-003-033 [P1] GAP facet F07 Validation/errors
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: Option failures, row delete error and stale-fetch error have distinct retry banners. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-433; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:477-484)
- Expected fix: Add distinct Retry options/list/delete error states with old data retained.

## G2-5-008-033 [P1] GAP facet F07 Validation/errors
- Files: src/modules/academics/college-section-mutation-model.ts
- Legacy: Max whole number 1–200 and max >= min (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:93-100)
- Expected fix: Use exact cross-field messages and both create/edit max200.

## G2-5-010-053 [P1] GAP facet F12 Business rules
- Files: src/components/academics/college-recurring-preview.tsx
- Legacy: No selected weekdays means daily recurrence (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:562-569)
- Expected fix: Restore daily-unchecked semantics.

## G2-5-025-043 [P1] GAP facet F12
- Files: src/modules/academics/college-term-mapping-model.ts, src/db/schema/academic-terms.ts
- Legacy: Legacy 0 credits permitted, course order >=1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-44`
- Expected fix: Align UI/service constraint to data contract or migrate invalid existing rows.

## G2-5-030-013 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx
- Legacy: Legacy Sign-in editor tracks dirty and busy and stores loginMethods. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-88,109-148`
- Expected fix: Persist effective method and cross-tab dirty reporting.

## G2-15-025-053 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/controller/RecruiterCollegeController.java:129-159 own requests are Job entities with JSON roleOptions and eligibility.
- Expected fix: Migrate old requests to typed request rows with lifecycle and legacy Job ID mapping.

## G2-7-015-083 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:66-85 status options include READY/BLOCKED/IN_PROGRESS
- Expected fix: Document intentional lifecycle rename? None evidenced; require owner decision before dropping states
