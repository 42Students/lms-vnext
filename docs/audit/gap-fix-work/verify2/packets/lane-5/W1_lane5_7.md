# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-6-001-045 [P1] GAP facet F11
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old `ADMIN` role option shown only to superadmin `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1057-1080`
- Expected fix: Map legacy faculty-type enum without permitting privilege escalation

## G2-6-020-040 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy deletion guarded by any linked program/faculty/course query (DepartmentServiceImpl.java:69-84).
- Expected fix: Compare linked but archived child semantics; block if referentially unsafe or orphaning historical associations.

## G2-6-019-012 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: Legacy examSlotPreference Morning/Afternoon/Evening (JobPreferences.java:34-36).
- Expected fix: Persist examSlotPreference and expose exact three options and empty/default.

## G2-11-020-010 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Recruiters with access shown if recruiter-access API succeeds, count ACTIVE&&!expired (index.js:237-239,522).
- Expected fix: Count only active nonexpired access grants from access service; match link /tpo/settings?tab=recruiters.

## G2-11-026-010 [P1] MISSING facet F06
- Files: (none, new feature)
- Legacy: Source URL validates http/https with hostname; optional sourcePath/browser/viewport length limits (BugTrackerService.java:61-65,186-204).
- Expected fix: Add safe http(s) URL validation and field limits for browser/source metadata.

## G2-12-011-009 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: Message thread body and subject shown as 'New message: <subject>' plus lastBody (RecruiterNotificationService.java:122-132).
- Expected fix: Include unread messages with subject and snippet, safely truncated.

## G2-15-024-012 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: SuperAdmin role required, no trust in route alone (SuperAdminE2eController.java:38-46).
- Expected fix: Never use identity override as seed authorization; explicit privileged server policy.

## G2-6-016-038 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Superadmin required for RTF load and cache eviction (SkillController.java:175-181,226-231).
- Expected fix: Admin-only import/refresh route must require same system role and CSRF protections.

## G2-6-002-029 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old register required First Name, Last Name, Mobile, Department, Faculty Type `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:982-1079`
- Expected fix: Require department and legacy type choice and persist both atomically

## G2-6-002-030 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old extra fields Gender, DOB, Address, Bio / Description `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1081-1101`
- Expected fix: Add optional profile fields to create modal and server payload

## G2-6-002-036 [P1] MISSING facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old department form fails closed on departments load error and disables select/submit `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:138-151` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1038-1055`
- Expected fix: Load selected-college departments and block submission on lookup failure

## G2-6-002-040 [P1] MISSING facet F07
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old department error `Choose a department` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1038-1049`
- Expected fix: Reintroduce department validation after chooser is added

## G2-6-002-051 [P1] GAP facet F10
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old creation POST `/api/v1/faculty/register` with dept/type/gender/dob/address `docs/legacy-source/frontend/src/api/Services/AdminService.js:213-215` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:386-407`
- Expected fix: Map all legacy create payload fields and reconcile canonical user+membership persistence

## G2-6-002-059 [P1] GAP facet F12
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old faculty type registration may be ADMIN only for superadmin, otherwise all listed roles `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1057-1080`
- Expected fix: Define mapping from old faculty_type to facultyProfiles.employmentType and membershipRoles

## G2-6-002-085 [P1] GAP facet F21
- Files: src/components/admin/person-onboard-dialog.tsx, src/app/(authenticated)/admin/faculty/page.tsx
- Legacy: Old AdminService sends direct API calls for register/bulk/edit/delete; sessions support impersonation tokens `docs/legacy-source/frontend/src/api/Services/AdminService.js:213-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:543-559`
- Expected fix: Inventory external session, notification and audit integrations before restoring support action

## G2-6-030-022 [P1] GAP facet F06
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: Legacy create includes optional College Select when unscoped (LectureHalls.js:312-326).
- Expected fix: Resolve Super Admin unscoped create parity with secure college picker.

## G2-6-003-015 [P1] GAP facet F06
- Files: src/app/(authenticated)/admin/faculty/page.tsx, src/components/admin/person-onboard-dialog.tsx
- Legacy: Old wrapper renders no direct form, but nested Faculty required Department and Type when registering `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:25-27` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1038-1079`
- Expected fix: Restore required department and type fields within scoped Super Admin Faculty create

## G2-6-003-018 [P1] GAP facet F07
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old Faculty register validates mobile regex, dept/type required `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1003-1079`
- Expected fix: Reproduce exact client error text and required-field enforcement

## G2-6-006-004 [P1] MISSING facet F02
- Files: src/app/(authenticated)/teacher/courses/page.tsx
- Legacy: Old request returns redirect before rendering JSX; component returns null `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-12`
- Expected fix: Restore redirect response so target renders without interim not-found screen

## G2-12-027-009 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LBE/dto/response/FacultyTeachingAssignmentResponseDTO.java:11-27: returns id, facultyId/name, courseId/slug/name/imageUrl, classId/name, batchId/name, semesterNumber, academicYear, role, isActive and incomplete flag.
- Expected fix: Build equivalent projection joining delivery/section/cohort/course/period and include missing fields or explicit absence mapping.

## G2-13-023-027 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:340-343 confirm updates round_assignment.student_confirmed_at by learner+round, returns false only on no booking.
- Expected fix: Document eligibility change: past bookings and unscheduled rounds no longer confirmable.

## G2-14-030-039 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/utils/interviewConflicts.js:12-20,90-96 buffer15; same learner across org and interviewer same company.
- Expected fix: Match buffer and org/company candidate collisions, keep hard server check for overlapping allocations.

## G2-17-031-012 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:34-45 tasks and sprint rows converted with alias keys and keyed materialization.
- Expected fix: Migrate task keys and order without detaching sprint/comment/submission associations.

## G2-19-027-074 [P1] GAP facet F15
- Files: (none, new feature)
- Legacy: LBE/controller/CourseController.java:380-448 audits COURSE_UPDATE/DELETE, :471-480 COURSE_RESTORE through AdminAuditLogService.
- Expected fix: Map audit event taxonomy and add restore audit with actor/time and change summary.

## G2-7-002-021 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:283-285,505-539: caps label `Actions today (first 200)` or `... (this page)` when truncation.
- Expected fix: Label count denominator and truncation when more cursor pages exist.
