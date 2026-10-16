# Round R review: Super Admin / academics-people (Academic Setup, Courses & Content, People + Recruiters)

Reviewer: Claude Sonnet 5.5, 2026-10-16, read-only (code only). Reviewed audit files: `academics-people-1-academic-setup.md` (SA-academics-people-01 to -47), `academics-people-2-courses-content.md` (-48 to -77), `academics-people-3-people-recruiters.md` (-78 to -116).

Legacy source: `C:\Users\LENOVO\Desktop\42LMS\_hr-tpo-fe` (lms-dev-2026 @ 63fea105, `src/pages/superadmin/sections/*`, `src/components/admin/*`) and backend `C:\Users\LENOVO\Desktop\42LMS\42LMS-BACKEND\lms` (lms-dev-2026 @ 9993beec). vNext: `src/app/(authenticated)/admin/*`, `src/components/{admin,academics,courses,attendance}/*`, `src/modules/*`.

Method: I audited the legacy pages and the vNext routes first (29 own gaps drafted before opening Round A), then diffed. Four of my own draft items were FALSE gaps that the diff exposed (I had assumed the Courses and Lessons tabs had no authoring; it exists in `/admin/courses` and the offering workspace, `admin-course-create-panel.tsx`, `admin-learning-structure-actions.tsx`). One further draft item (college offering actions mounted on `/admin/courses`) was a false gap too: `allowOfferingLifecycle` defaults to false and the Super Admin page does not pass it (`admin-course-overview.tsx:51,233-244`). None of those are counted below.

## 1. Summary

- Round A gaps reviewed: 116. CONFIRMED 114 (two with a correction note, see section 4), WRONG 0, SEVERITY-CHANGE 2 (SA-84, SA-86), MISSED 5 (SA-academics-people-R01 to R05).
- Discrepancy rate = (MISSED 5 + WRONG 0 + SEVERITY-CHANGE 2) / (116 + 5) = 7 / 121 = 5.8%.
- Round A is accurate and deep. Its main weakness is one wrong generalisation in SA-05 (which hides a second S1 gap, R01) and an overstatement in SA-22. Its single best finding (SA-47: Super Admin tabs are read-only mirrors because the mutation services are bound to a College Admin membership) holds up in every place I checked.
- Five UNCONFIRMED Round A items were resolved by code reading (section 5).

## 2. Round A gap verdicts

Unless stated, verdict is CONFIRMED against the legacy and vNext code at the cited lines (I re-read both sides). Group notes follow the table.

| Round A gap ID | Verdict | Note |
| --- | --- | --- |
| SA-academics-people-01 | CONFIRMED | `SuperAdminLegacyGroupTabs` is a strip only. |
| -02 | CONFIRMED | |
| -03 | CONFIRMED | |
| -04 | CONFIRMED | |
| -05 | CONFIRMED (upgraded from "very likely") | Static proof: `college-department-mutation-service.ts:28-39` requires `context.membership` + COLLEGE_ADMIN; `context-service.ts:217-226` sets `membership: null` for the Super Admin branch. The sentence "Programs, periods, cohorts, sections and halls use scope-based checks" is wrong for programs and for period close/reopen, see section 4 and R01/R02. |
| -06, -07, -08, -09 | CONFIRMED | -07: create form prints `payload?.error` raw (`department-create-form.tsx:30`); rename/archive toasts are generic. |
| -10 | CONFIRMED | |
| -11, -12, -13 | CONFIRMED | |
| -14 | CONFIRMED | `semester-mutation-service.ts:33-45` is membership-bound; `/admin/semesters` is `AdminScopedReadPage`. |
| -15 | CONFIRMED | |
| -16 | CONFIRMED | Note: course-offering create (`/api/courses/offerings`, `offering-service.ts:227`, scope-based) is a partial vNext add-path for what legacy calls mapping; edit of credits/order/type is not reachable (the college metadata action is not mounted for Super Admin). Worth adding to the fix note. |
| -17, -18, -19, -20, -21 | CONFIRMED | |
| -22 | CONFIRMED (correction) | The sub-claim "recurring preview/execute in the section workspace" is wrong: `section-operations.tsx` has no recurring UI; recurring preview/execute are only in `college-recurring-preview.tsx` on `/college/classes/recurring-preview`, and both services (`college-recurring-preview-service.ts:20,104`, `college-recurring-execute-service.ts:19`) are membership-bound. So a Super Admin has no recurring-session path at all. The gap itself is therefore larger than stated; severity S2 stands. |
| -23, -24, -25 | CONFIRMED | |
| -26 | CONFIRMED | `app/(authenticated)/college/layout.tsx` redirects anyone without a COLLEGE_ADMIN membership role to `/dashboard`; link at `lecture-hall-manager.tsx:215`. |
| -27, -28, -29, -30 | CONFIRMED | |
| -31 | CONFIRMED | UNCONFIRMED part resolved: `app/api/attendance/admin/policy/route.ts` and `requireAttendanceCollege` (`admin-service.ts:60-85`) accept a Super Admin acting in the selected college, so only the UI is missing. |
| -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42 | CONFIRMED | -33 duplicates -14 (the Active/Inactive switch is part of the same missing edit). |
| -43, -44, -45 | CONFIRMED | |
| -46 | CONFIRMED (UNCONFIRMED part resolved) | `super-admin-scoped-csv-model.ts:23` header is `Record ID, Name, Context, Status, Additional persisted fields` for every scoped directory, so none of the legacy column sets (e.g. semesters: id, name, semesterNumber, programId, totalCredits, isActive) is reproduced. |
| -47 | CONFIRMED | Fix list omits `college-program-mutation-service.ts:49-61` (programs), `college-period-lifecycle-service.ts:31-37` (period close/reopen), `college-recurring-*-service.ts`, `college-student-section-move-service.ts:30`, `college-hall-booking-service.ts:20`. See R01/R02. |
| -48 | CONFIRMED | |
| -49 | CONFIRMED | `platform-settings/service.ts:225-243` states the watched threshold is a fixed constant and other legacy thresholds "are not represented as configurable platform values". `rg minInProgressPercent` finds nothing in `src`. |
| -50, -51, -52, -53, -54, -55 | CONFIRMED | |
| -56, -57, -58 | CONFIRMED | |
| -59 | CONFIRMED | `lesson-video-service.ts:151-162` `requireUploader` demands an ACTIVE membership in the same college. |
| -60, -61, -62, -63 | CONFIRMED | |
| -64, -65, -66, -67, -68, -69 | CONFIRMED | |
| -70, -71, -72, -73, -74, -75, -76, -77 | CONFIRMED | -73: the dirty-close confirm in the course edit dialog is still UNCONFIRMED (not read). |
| -78, -79, -80, -81, -82, -83 | CONFIRMED | |
| -84 | SEVERITY-CHANGE S3 -> S4 | OD-23 (owner-decisions.md) recommends recording "no hard delete" as intentional; vNext offers terminal End membership plus archive. Keep as an intentional difference; promote only if the owner rejects OD-23. |
| -85 | CONFIRMED | |
| -86 | SEVERITY-CHANGE S3 -> S4 | vNext OTP throttling is per challenge: 5-minute attempt lifetime and a 10-minute send window (`modules/auth/login-service.ts:32,39`), so a throttled user recovers on their own; legacy needed a manual clear because its rate limiter had no short window. Still absent, but not a support blocker. |
| -87 | CONFIRMED | Pending OD-23 (audited design needed first). |
| -88, -89, -90, -91, -92, -93, -94, -95, -96, -97, -98, -99, -100 | CONFIRMED | |
| -101, -102, -103, -104, -105 | CONFIRMED | |
| -106 | CONFIRMED | Matches OD-23 ("platform block"). |
| -107 | CONFIRMED | UNCONFIRMED part resolved: scoped CSV header is generic (see -46), not the legacy students roster columns (name, roll, mobile, email, class, status). |
| -108, -109, -110 | CONFIRMED | -110: `rg "valid.?until\|expires" components/admin/super-admin-hr-*.tsx` finds nothing. |
| -111 | CONFIRMED (still UNCONFIRMED) | I could not find duplicate-mobile handling in `super-admin-hr-accounts.tsx`/`super-admin-hr-service.ts`; confirm live. |
| -112, -113, -114, -115, -116 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
| --- | --- | --- | --- | --- | --- |
| SA-academics-people-R01 | Program create, edit, archive and restore fail for a Super Admin. `/admin/programs` (`AdminProgramDirectory`, `ProgramActions`) and the "New program" form on `/admin/academics` post to `/api/academics/programs[...]`, which call `createCollegeProgram`/`updateCollegeProgram`/`archiveCollegeProgram`/`restoreCollegeProgram`; every one starts with `ownCollege()` that requires the caller's own active COLLEGE_ADMIN membership. A Super Admin session has `membership: null`, so each action returns an authorization error. Round A SA-05 says programs are unaffected; they are not. Fix with the same change as SA-47 (accept `adminScope`). | PERMISSION | S1 | `S/Programs.js:112,141,175` (`handleSubmit`/`handleEditSubmit`/`handleDelete` call create/update/deleteProgram for the selected college with no membership precondition) | `src/modules/academics/college-program-mutation-service.ts:49-61` (`ownCollege`, used at :160,:184,:230,:271,:314); `src/app/api/academics/programs/route.ts:33-35`; `src/app/api/academics/programs/[programId]/route.ts:30-34,45-47`; `src/components/admin/admin-program-directory.tsx:84-99`; `src/components/academics/academics-actions.tsx:176,263`; `src/components/academics/academics-create-panel.tsx:154`; `src/modules/identity/context-service.ts:217-226` |
| SA-academics-people-R02 | Academic period Close and Reopen fail for a Super Admin although Create, Edit and Activate work. `transitionAcademicPeriod` delegates `CLOSE`/`REOPEN` to `changeCollegePeriodLifecycle`, which needs a COLLEGE_ADMIN membership. The `/admin/academics` period row shows both buttons. (Round A SA-05 groups periods with the working scope-based services.) | PERMISSION | S2 | `S/SemesterManagement.js:223,603-612` (Active/Inactive status edit by Super Admin; term open/close is the closest legacy analogue to period close/reopen) | `src/modules/academics/period-service.ts:222-228`; `src/modules/academics/college-period-lifecycle-service.ts:24-37`; `src/components/academics/academics-actions.tsx:326,488`; `src/app/api/academics/periods/[periodId]/route.ts:30-47` |
| SA-academics-people-R03 | Legacy `/superadmin/*` URLs (bookmarks, emailed links, in-product links from old docs) mostly 404: only `/superadmin/departments` and `/superadmin/programs` redirect. `/superadmin/students`, `/teachers`, `/semesters`, `/batches`, `/classes`, `/lecture-hall`, `/lesson-content?type=...`, `/course-progress`, `/recruiters` etc. have no route or redirect (no `redirects()` in `next.config.ts`, no `proxy`/`middleware` mapping). | STATE | S3 | `src/common/superAdminNavGroups.js`, `common/navGroupDefinitions.js` (paths `teachers`, `lesson-content`, `people`, ...) | `src/app/(authenticated)/superadmin/` contains only `departments/page.tsx` and `programs/page.tsx`; `src/modules/admin-ui/legacy-department-links.ts:9-38`; `next.config.ts` (no redirects) |
| SA-academics-people-R04 | Activity-log (audit) parity for Super Admin-reachable academic mutations is missing or unverified. The services Super Admin actually uses for period, cohort and section create/update (`period-service.ts`, `cohort-service.ts`, `section-service.ts`), the attendance policy update and people onboarding/role/lifecycle (`people/service.ts`, `runtime.ts`) call no `recordActivityEvent*`, while the legacy controllers audit department, hall, batch, class, faculty and learner changes (and the college-only mutation services here do record events). UNCONFIRMED at runtime; confirm by performing one change per area and checking `/admin/audit`. | SIDE-EFFECT | S3 | `BE DepartmentController.java:44-56,81,167,209` (`DEPARTMENT_CREATE/UPDATE/DELETE`); `AdminUserLifecycleController` (`LEARNER_SUSPEND`, `FACULTY_REACTIVATE`...); `SuperAdminUserAdminController.java:260,299,347` (`FACULTY_ADMIN_STATUS`, `USER_SESSIONS_REVOKE_ALL`, `IMPERSONATION_START`) | `rg recordActivityEvent` returns 0 hits in `period-service.ts`, `cohort-service.ts`, `section-service.ts`, `attendance/policy-service.ts`, `people/service.ts`; hits exist only in `college-*-mutation-service.ts`, `offering-service.ts`, `lesson-service.ts`, `lecture-hall-service.ts` |
| SA-academics-people-R05 | Attendance correction asks for confirmation with the browser-native `window.confirm` (not the app dialog), with English status text built by string concatenation ("Mark X present for <session>? This change is recorded."). Native dialogs are suppressed in some embedded or automated contexts, break the visual language, and cannot be styled for keyboard/screen-reader use like the other dialogs. Legacy corrects through an in-modal button with no second prompt. | A11Y | S4 | `S/Attendance.js:78,89-94` | `src/components/attendance/admin-attendance-workspace.tsx:231-247` |

## 4. WRONG / SEVERITY-CHANGE / correction details

1. SA-05 (CONFIRMED, wrong sub-claim). "Programs, periods, cohorts, sections and halls use scope-based checks." True for cohorts (`cohort-service.ts`, used by `/api/academics/cohorts`), sections (`section-service.ts`), halls (`lecture-hall-service.ts:131`) and period create/update/activate (`period-service.ts:105-260`). False for programs (R01) and for period close/reopen (R02). SA-47's file list has the same omission.
2. SA-22 (CONFIRMED, wrong sub-claim). Recurring preview/execute is not in the section workspace; it is a College Admin page only (see verdict row). Consequence: the recurring series feature is wholly unreachable by Super Admin, not merely not linked from the tab.
3. SA-84 S3 -> S4: owner decision OD-23 recommends keeping soft-only as intentional. Reverse if the owner chooses otherwise.
4. SA-86 S3 -> S4: vNext lockouts are short per-challenge windows (`login-service.ts:32,39`), not an account-level rate limit that needs an admin reset.

False-gap checks I ran (nothing wrong found): lecture-hall CRUD works for Super Admin (`lecture-hall-service.ts:131` explicit scope check, `/api/lecture-halls`); attendance correction and grid work for Super Admin (`admin-service.ts:66-71`); people onboarding, roles and membership lifecycle use `people.manage` with scope (`people/service.ts:122,168,188`), so the People tab actions are not blocked by the membership problem; Courses, offerings, deliveries, teaching assignments and lessons use scope-based `requirePermission("courses.manage")` services. The Round A "intentional differences" list (archive instead of delete, program code, periods) is fair.

## 5. UNCONFIRMED items and how to confirm (batch for the live check on dev)

Statically resolved during this review (no live check needed unless the owner wants evidence): SA-05 (membership null), SA-31 (policy API accepts Super Admin scope), SA-46 and SA-107 (scoped CSV header is generic), SA-26 (college layout redirect).

Still to confirm on the deployed dev site, signed in as the seeded Super Admin with a college selected and no membership cookie:

1. Create, rename and archive a department; create, edit and archive a program; create and close/reopen an academic period (R01, R02, SA-05). Record the exact error toast shown to the user.
2. Create a cohort, a section and a period through `/admin/academics` and open `/admin/audit` to see whether events appear (R04).
3. Lecture halls: add, edit, archive, restore, then click "Availability" and note where the redirect lands (SA-26).
4. `/admin/courses`: confirm that create course, create offering, assign course faculty and archive offering succeed for Super Admin, and whether the course display editor is enabled (env `DB05_COURSE_DISPLAY_READY=DB05_VERIFIED` on dev; `course-display-readiness.ts:1-3`). If not enabled, SA-50 widens (description, takeaways cannot be edited at all).
5. Recruiter create twice with the same phone, and edit a phone number then check that sessions end (SA-111).
6. Course edit dialog dirty-close confirm (SA-73) and 375 px layout of `/admin/academics`, `/admin/courses` (SA-39, SA-75).
7. Legacy side of the comparison (read-only, old LMS dev, OD-39): confirm the Batches "Manage students" move, Batch Promotion graduation, and the Students "Import History" modal exist exactly as read in code, and note the success/failure toast wording seen live.
8. Open each legacy URL in R03 on the vNext dev host to record which ones 404.

Files: `C:\Users\LENOVO\Desktop\lms-vnext\docs\audit\pages\superadmin\academics-people-review.md`.
