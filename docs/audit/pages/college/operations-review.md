# Round R review: College Admin / operations (attendance, course-tabs, placements, projects, verification-misc)

Reviewer: Round R agent, 2026-10-16. Legacy read at lms-dev-2026 (frontend `lms2-fe` @ 63fea105 via `git archive`, backend `42LMS-BACKEND/lms` @ 9993beec). vNext read at origin/main 2ee9f569f (includes chat-9 college work up to that commit). My own audit was written from the legacy and vNext code before the five Round A files were opened.

## 1. Summary

| Slug | Round A gaps | CONFIRMED | WRONG | SEVERITY-CHANGE | MISSED (new) |
|---|---|---|---|---|---|
| attendance | 17 | 16 | 1 | 0 | 3 |
| course-tabs | 27 | 26 | 1 | 0 | 1 |
| placements | 26 | 26 | 0 | 0 | 2 |
| projects | 23 | 22 | 0 | 1 | 2 |
| verification-misc | 20 | 19 | 0 | 1 | 0 |
| **Total** | **113** | **109** | **2** | **2** | **8** |

Discrepancy rate = (MISSED 8 + WRONG 2 + SEVERITY-CHANGE 2) / (113 + 8) = 12 / 121 = **9.9%**.

Overall: Round A is accurate and unusually complete. Its two main attendance findings (window bypass, missing audit event) match my independent audit exactly. The misses are in places auditors skip: side effects that fire when an admin acts (parent SMS, notifications to teams and mentors), a data-integrity consequence of the vNext correction code, and Super Admin scope consistency. Two further rows keep their gap but carry a text correction (attendance-01, course-tabs-04/05).

Independence note: of the 113 rows, I re-derived from code about 45 (all attendance, the progress/lessons/companies/analytics/calendar/applications/drives/projects reassign/summary/deleted/verification-queue/activity/profile claims, plus every severity-1 claim). The remaining rows are copy, responsive, a11y, and fine-grained field-list claims that I accepted after checking them against the cited file; they are marked "accepted" in the note column.

## 2. Round A gap verdicts

### attendance

| Round A gap ID | Verdict | Note |
|---|---|---|
| COL-attendance-01 | CONFIRMED (text correction) | Legacy admin path calls `learnerService.attend(body, true)` which skips only the post-class window (`LearnerServiceImpl.java:555`); legacy still refuses a session that has not started (`:535`, "Cannot mark attendance for a class that has not started yet"). vNext matches that part (`admin-service.ts:518-524` NOT_STARTED). So the parenthetical "(and before a session starts)" is not a gap; the gap is only the expired window. S1 stands: `admin-service.ts:512-524` rejects after the window and `admin-attendance-workspace.tsx:649-654` disables every button. |
| COL-attendance-02 | CONFIRMED | `admin-service.ts` has no `recordActivityEventInTransaction`; faculty path does (`faculty-service.ts`). Legacy audits `ADMIN_ATTENDANCE_MARK_ABSENT/_PRESENT` (`AdminAttendanceController.java:306-310,339-342`). |
| COL-attendance-03 | CONFIRMED | Re-derived: `admin-attendance-workspace.tsx:498-510` only lists days with sessions. |
| COL-attendance-04 | CONFIRMED | `:461-489` shows only "marked of held". |
| COL-attendance-05 | CONFIRMED | `:281-282` closes drawer, no toast. |
| COL-attendance-06 | CONFIRMED | `window.confirm` at `:243-246`; record read from page payload. |
| COL-attendance-07 | CONFIRMED | vNext `admin-grid-model.ts:90-96`: only PRESENT counts present, so E/M/L reduce the percent. Legacy treats any absence row as absent too, so no behavioural divergence found; remains a confirm-with-product item. |
| COL-attendance-08 | CONFIRMED | Header is bare `%` (`:511-513`). |
| COL-attendance-09 | CONFIRMED | accepted; `page.tsx:51-56` picks the first matching delivery. |
| COL-attendance-10 | CONFIRMED | accepted. |
| COL-attendance-11 | CONFIRMED | `page.tsx:33-35` throws a plain Error for no college. |
| COL-attendance-12 | CONFIRMED | accepted. |
| COL-attendance-13 | WRONG (mostly) | The vNext toolbar has a native `type="month"` input that displays "October 2026" between Previous/Next (`:424-428`), and the month lives in the URL, so no state is lost. The only true residue is that each navigation is a full `router.push`. Drop to no gap or S4 note. |
| COL-attendance-14 | CONFIRMED | departments view prints the threshold (`college-department-insights.tsx:50`) but never applies it. |
| COL-attendance-15 | CONFIRMED | accepted. |
| COL-attendance-16 | CONFIRMED | Legacy admin policy is read-only (`PolicySettingField.js:42-44,87`); vNext editable (`policy-validation.ts` bounds 1-100 and 1-168 match legacy). No activity event on save (`policy-service.ts:80-110`). |
| COL-attendance-17 | CONFIRMED | No table caption in `admin-attendance-workspace.tsx:492`. |

### course-tabs

| Round A gap ID | Verdict | Note |
|---|---|---|
| COL-course-tabs-01 | CONFIRMED | Re-derived (`LessonContent.js` Upload / YouTube / Import-from-link, `message.*` list at 435-669). vNext video upload exists only in faculty manager (`faculty-lesson-video-manager.tsx`). |
| COL-course-tabs-02 | CONFIRMED | accepted; `college-live-classes-directory.tsx` is read-only. |
| COL-course-tabs-03 | CONFIRMED | accepted. |
| COL-course-tabs-04 | CONFIRMED (UNCONFIRMED item resolved) | `assignment-service.ts:85-90` authorises mutation of a lesson-level (non-delivery) assignment with `courses.manage` and returns `"ADMIN"`, which College Admin holds (same permission as `createCourseLesson`). So the API likely accepts a College Admin for shared content; only the UI is missing. Section/delivery-scoped content goes through `requireDeliveryContentMutation` and would reject an admin who is not on the delivery. |
| COL-course-tabs-05 | CONFIRMED (UNCONFIRMED item narrowed) | `assignment-submission-service.ts:659` has `if (can(context, "courses.manage", ...)) return;` in an authorisation helper, so grading/publish is likely open to admin. Needs a live call to be sure (see section 5). |
| COL-course-tabs-06 | CONFIRMED | accepted. |
| COL-course-tabs-07 | CONFIRMED | `admin-learning-structure-actions.tsx` results control only enabled when CLOSED. |
| COL-course-tabs-08 | CONFIRMED | Re-derived: `CourseProgress.js:166-205` per-student table; vNext `college-learning-directory-service.ts:421-436` aggregates per offering only. |
| COL-course-tabs-09 | CONFIRMED | accepted. |
| COL-course-tabs-10 | CONFIRMED | `CourseProgress.js:207-225` vs `college-progress-export-model.ts:42-48`. |
| COL-course-tabs-11 | CONFIRMED | accepted. |
| COL-course-tabs-12 | CONFIRMED | Lesson create exists on the offering page (`admin-learning-structure-actions.tsx:404`) behind a learning path; none on `/college/lessons`. |
| COL-course-tabs-13 | CONFIRMED | accepted. |
| COL-course-tabs-14 | CONFIRMED | `college-lesson-reorder-actions.tsx` up/down only. |
| COL-course-tabs-15 | CONFIRMED | accepted. |
| COL-course-tabs-16 | CONFIRMED | accepted (`LessonContent.js:950-962` per-class order). |
| COL-course-tabs-17 | CONFIRMED | accepted. |
| COL-course-tabs-18 | CONFIRMED | accepted. |
| COL-course-tabs-19 | WRONG (partly) | Video, Resources and Live Classes each have a CSV link today (`videos/page.tsx:31-33` "Export filtered video metadata CSV", `resources/page.tsx:31-33`, `live-classes/page.tsx` live-class schedule CSV) backed by `src/app/api/academics/college-content-export/*`. Only Assignments and Quizzes (and per-learner progress) lack an export; Lessons and Progress already have one. Re-scope to those two pages; S3 stands. |
| COL-course-tabs-20 | CONFIRMED | Video page error title is "Video" (`videos/page.tsx:23`), so the legacy tab name is partly matched already; remaining copy diffs stand. |
| COL-course-tabs-21 | CONFIRMED | accepted. |
| COL-course-tabs-22 | CONFIRMED | accepted. |
| COL-course-tabs-23 | CONFIRMED | accepted. |
| COL-course-tabs-24 | CONFIRMED | accepted. |
| COL-course-tabs-25 | CONFIRMED | accepted. |
| COL-course-tabs-26 | CONFIRMED | `college-content-visibility` route exists for videos and resources only. |
| COL-course-tabs-27 | CONFIRMED | accepted. |

### placements

| Round A gap ID | Verdict | Note |
|---|---|---|
| COL-placements-01 | CONFIRMED | Re-derived: `JobApplications.js` bulk transitions (`bulkUpdateAdminApplicationStatus`, reject reason modal, partial-failure modal, 3000 cap) vs read-only `applications/page.tsx`. Severity depends on whether a TPO always exists (UNCONFIRMED, section 5). |
| COL-placements-02 | CONFIRMED | accepted. |
| COL-placements-03 | CONFIRMED | accepted. |
| COL-placements-04 | CONFIRMED | `interviews/page.tsx` read-only. Same TPO caveat as -01. |
| COL-placements-05 | CONFIRMED | `applications/page.tsx:25-45` has only q/status/screening. |
| COL-placements-06 | CONFIRMED | accepted. |
| COL-placements-07 | CONFIRMED | accepted. |
| COL-placements-08 | CONFIRMED | `drives/page.tsx:34-55` table has 5 columns. |
| COL-placements-09 | CONFIRMED | accepted. |
| COL-placements-10 | CONFIRMED | accepted. |
| COL-placements-11 | CONFIRMED | accepted. |
| COL-placements-12 | CONFIRMED | accepted. |
| COL-placements-13 | CONFIRMED | accepted. |
| COL-placements-14 | CONFIRMED | Re-derived: `placement-employer-relationships.tsx` PATCHes only trust and owner, DELETE archives. |
| COL-placements-15 | CONFIRMED | Legacy delete guard is tooltip "Can't delete — this company has drives linked to it" (`Companies.js:318`). |
| COL-placements-16 | CONFIRMED | accepted. |
| COL-placements-17 | CONFIRMED | Re-derived: `hiring-dashboard/page.tsx:32-45` renders filters, four metrics and a note. |
| COL-placements-18 | CONFIRMED | accepted. |
| COL-placements-19 | CONFIRMED | Re-derived: no `.ics`, conflict or mode/status/department filters in `placement-calendar-workspace.tsx`. |
| COL-placements-20 | CONFIRMED | accepted. |
| COL-placements-21 | CONFIRMED | accepted. |
| COL-placements-22 | CONFIRMED | accepted. |
| COL-placements-23 | CONFIRMED | accepted. |
| COL-placements-24 | CONFIRMED | accepted. |
| COL-placements-25 | CONFIRMED | accepted. |
| COL-placements-26 | CONFIRMED | accepted. |

### projects

| Round A gap ID | Verdict | Note |
|---|---|---|
| COL-projects-01 | CONFIRMED | accepted (`submissions/index.js` review modal). |
| COL-projects-02 | SEVERITY-CHANGE S1 to S2 | Reason: the real workflow impact is limited. Title, summary and template are set at creation, status has lifecycle controls (archive/complete/restore), and mentors edit sprints/tasks. What is lost is correcting a title, phase, dates or sprint settings after the fact. Also: vNext has no `PATCH /api/projects/[projectId]` at all (`route.ts` exports only GET), so the fix needs a new route and service, not only UI. |
| COL-projects-03 | CONFIRMED | accepted. |
| COL-projects-04 | CONFIRMED | accepted. |
| COL-projects-05 | CONFIRMED | `project-archive-control.tsx` restores archived; no delete and no deleted list. |
| COL-projects-06 | CONFIRMED | accepted. |
| COL-projects-07 | CONFIRMED | accepted. |
| COL-projects-08 | CONFIRMED | No CSV anywhere in `project-admin-*.tsx` (grep verified). |
| COL-projects-09 | CONFIRMED | accepted. |
| COL-projects-10 | CONFIRMED | `project-admin-at-risk-page.tsx` shows no bucket cards or CSV. |
| COL-projects-11 | CONFIRMED | The page itself admits blocker risk is not persisted (`:70-80`). |
| COL-projects-12 | CONFIRMED | accepted. |
| COL-projects-13 | CONFIRMED | accepted. |
| COL-projects-14 | CONFIRMED | accepted. |
| COL-projects-15 | CONFIRMED | accepted. |
| COL-projects-16 | CONFIRMED | accepted. |
| COL-projects-17 | CONFIRMED | accepted. |
| COL-projects-18 | CONFIRMED | accepted. |
| COL-projects-19 | CONFIRMED | Legacy H1 is "Project workspaces" with the subtitle; vNext H1 is "Workspaces" with none (`projects/page.tsx`). |
| COL-projects-20 | CONFIRMED | accepted. |
| COL-projects-21 | CONFIRMED | accepted. |
| COL-projects-22 | CONFIRMED | accepted. |
| COL-projects-23 | CONFIRMED | accepted. |

### verification-misc

| Round A gap ID | Verdict | Note |
|---|---|---|
| COL-verification-misc-01 | SEVERITY-CHANGE S1 to S2 | Reason: it removes self-service editing of the admin's own personal details; no college workflow is blocked (college contact profile is editable at `/college/college-profile`, password/devices at `/account/security`). S1 means "blocks a real workflow". Legacy does let the admin edit sections (`ProfileSectionsPanel.js:243-293,353-461`), so the gap itself is real. |
| COL-verification-misc-02 | CONFIRMED | accepted. |
| COL-verification-misc-03 | CONFIRMED | Re-derived: legacy `reviewList` auto-advance (`VerificationWorkspace.jsx:153,212-217`). |
| COL-verification-misc-04 | CONFIRMED | `CollegeVerificationPanel.tsx:45` caps selection at 20; legacy acts on up to 1,000 rows and has the acknowledgement (`:312-316`). |
| COL-verification-misc-05 | CONFIRMED | accepted (`VerificationReviewDrawer.tsx:102-104` shows last decision only). |
| COL-verification-misc-06 | CONFIRMED | Legacy reasons at `VerificationWorkspace.jsx:28-31`. |
| COL-verification-misc-07 | CONFIRMED | accepted; student notification on decision is documented as authored in the parity note (UNCONFIRMED live). |
| COL-verification-misc-08 | CONFIRMED | accepted. |
| COL-verification-misc-09 | CONFIRMED | accepted. |
| COL-verification-misc-10 | CONFIRMED | `college/verification/page.tsx:37` and the 5001 limit in `staff-queue-service.ts:64`. |
| COL-verification-misc-11 | CONFIRMED | Re-derived (`ActivityCenter.jsx:22-36` categories and ranges). |
| COL-verification-misc-12 | CONFIRMED | Legacy default is Important plus 30 days (`ActivityCenter.jsx:60-61`). |
| COL-verification-misc-13 | CONFIRMED | accepted. |
| COL-verification-misc-14 | CONFIRMED | accepted. |
| COL-verification-misc-15 | CONFIRMED | accepted. |
| COL-verification-misc-16 | CONFIRMED | decision item, accepted. |
| COL-verification-misc-17 | CONFIRMED | decision item, accepted. |
| COL-verification-misc-18 | CONFIRMED | decision item, accepted. |
| COL-verification-misc-19 | CONFIRMED | decision item, accepted. |
| COL-verification-misc-20 | CONFIRMED | accepted. |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| COL-attendance-R01 | An admin correction on a session nobody has marked yet silently marks the whole session as marked, so every other learner in the class changes from "Not marked" to implicit Present. In vNext a MARKED session defaults all learners to PRESENT; the admin service upserts `attendance_sessions.status = MARKED` for any correction, including the first one. The grid then counts those learners as present in the percent. Legacy never sets `attendanceMarkedAt` on the admin path: it only writes or soft-deletes the single absence row, and only the faculty "mark attendance complete" flow sets `attendanceMarkedAt`. | VALIDATION | S2 | `AdminAttendanceController.java:300-311,338` (row-level only); `ClassScheduleServiceImpl.java:539` (only place that sets `attendanceMarkedAt`); `Attendance.js:255-258` (admin sees "Not marked yet") | `admin-service.ts:609-651` (insert or update MARKED regardless of prior state); `admin-grid-model.ts:60-70` ("A session marked by faculty defaults every learner to PRESENT") |
| COL-attendance-R02 | No parent SMS when an admin marks a student absent, and no correction SMS when the admin marks them present. Legacy sends "Dear Parent, Your ward is absent for today's {course} class at {start}-{end}." (template editable under Notification Templates) on absent, and a correction SMS on present. vNext admin correction sends nothing. A vNext SMS module exists (`exotel-sms.ts`) but is not called from attendance (the faculty path also has no SMS call, so this may be a product-wide gap rather than an admin-only one). | SIDE-EFFECT | S3 | `LearnerServiceImpl.java:600-625` (absence SMS), `:640-690` (`sendAbsenceCorrectionSms`) | `admin-service.ts` (no notification or SMS call); `faculty-service.ts` (none either) |
| COL-attendance-R03 | Scope inconsistency for a Super Admin acting inside a college. `/college/attendance` resolves the college from `adminScope` (`page.tsx:34-37`), but its three sibling pages read only `context.membership`: Policy (`settings/page.tsx:12-19`), Departments (`departments/page.tsx:18`) and Corrections (`corrections/page.tsx` via `getCollegeCorrectionRead`, which throws "Active college membership required"). The header links on the attendance page therefore send a scoped Super Admin to /dashboard or an error. | PERMISSION | S3 | `AdminAttendanceController.java:75-92` (legacy allows a scoped super admin for every admin attendance call) | `settings/page.tsx:12-19`, `departments/page.tsx:18`, `college-correction-read-service.ts:11-13` |
| COL-course-tabs-R01 | The progress measure itself differs and is not stated. Legacy measures videos watched to the end, assignments submitted and quizzes attempted, explicitly excludes resources ("marked done by the student's own click") and counts only the current attempt for a retaker. vNext counts any `learner_content_progress` row of any content type (including resources) and has no assignment or quiz component, with no explanation of what is counted. Even after COL-course-tabs-08 is closed, copying the table without the definition would show different numbers. | MISSING-FIELD | S3 | `CourseProgress.js:240-246` (alert "Measured work only"), `:370-375` (retake note), `:167-190` | `college-learning-directory-service.ts:421-436` (`completedRows`, `learnerCount` over all content rows) |
| COL-placements-R01 | Companies and Interviews lack the list tooling an admin uses daily: Companies has sortable Company/Drives/Last active columns (default Last active descending), search by name or industry, a `Show deleted` toggle, 10-per-page with a page-size selector, the count line `Showing N of M companies (including deleted) , searching name & industry only` and `Export CSV` (`companies.csv`: id, name, industry, website, contact person/email/phone, drive count, deleted). Interviews has `Export CSV` (`interviews.csv`: id, job, candidate, type, status, scheduled date, interviewer, location, mode), sort by field and a `Sort by` control. vNext Companies has a name-only search, no export and no sort; the vNext calendar has neither export nor sort. | MISSING-EXPORT | S3 | `Companies.js:89-93,373-417,428-433`; `InterviewCalendarContent.js:863-896` | `companies/page.tsx:36-60`; `placement-calendar-workspace.tsx` (no CSV or sort) |
| COL-placements-R02 | Company identity cues missing: legacy shows a `Verified by 42` tag, the company's domains under its name, the `Deleted` tag, and the Add form states the dedupe rule ("A company is kept once across colleges by its website or company email domain: add at least one of them"). vNext shows only `Trusted / Unverified` (a college-private flag) and the primary domain, so an admin cannot tell a platform-verified employer from a college-trusted one. | MISSING-FIELD | S4 | `Companies.js:250-257,487-490` | `placement-employer-relationships.tsx:225-245` |
| COL-projects-R01 | No notifications when an admin acts on a workspace. Legacy sends "Project created" to the class, "New project assigned" to each student and "You were assigned as mentor" to the mentor on create, a notification on update, and a consolidated class notice for bulk creation. vNext creation, member change, mentor reassignment and restore services (`instance-service.ts`, `member-service.ts`, `class-team-workspace-service.ts`, `instance-restore-service.ts`, `lifecycle-service.ts`) contain no notification insert (only mentor closeout does). A reassigned or newly assigned mentor and a student added to a team get no in-app notice. | SIDE-EFFECT | S2 | `ProjectWorkspaceServiceImpl.java:4235-4263` (`notifyProjectCreated`), `:1318,1531-1536,1667` | `src/modules/projects/` (grep for notification in the listed services returns nothing) |
| COL-projects-R02 | The bulk mentor reassignment page lacks the workload tooling that makes the decision: legacy shows a `Mentor workload` card (flag when a mentor's active workspaces are 50% or more above the college average), a `Filter by current mentor` search, a table of workspaces with `Current mentor`/`Status`, a confirm that says "Reassign N of M selected workspace(s) to X?" excluding already-assigned ones, and a result alert listing each failure by workspace name; mentors are searched by name on the server. vNext lists the first 25-row page of non-archived workspaces and a fixed list of 100 mentors with no search (`listProjectMentorCandidates({ q: "", limit: 100 })`), so a college with more than 100 faculty cannot reach every mentor. | MISSING-FIELD | S3 | `reassign-mentor.js:166-210,378-470,482-510` | `project-admin-reassign-mentor-page.tsx:48-60` (limit 100, `q: ""`), `project-mentor-reassignment.tsx` |

## 4. WRONG and SEVERITY-CHANGE details

| ID | Verdict | Detail |
|---|---|---|
| COL-attendance-13 | WRONG (mostly) | The toolbar renders `<Input type="month" aria-label="Attendance month">` between Previous and Next (`admin-attendance-workspace.tsx:424-428`), which displays the month label natively, and the month is part of the URL, so back/forward and reloads keep it. The "no label" and "loses choice state" claims do not hold. Remaining nit: each step is a full navigation. Recommend dropping the row. |
| COL-projects-02 | SEVERITY-CHANGE S1 to S2 | See section 2. Additional build note: no `PATCH /api/projects/[projectId]` exists (`src/app/api/projects/[projectId]/route.ts` exports only GET), so the real work is a new mutation with row-version, activity event and the "Active requires a mentor" rule that legacy states at `summary.js:617`. |
| COL-verification-misc-01 | SEVERITY-CHANGE S1 to S2 | See section 2. Self-profile edit does not block a college workflow. |
| COL-attendance-01 (text only) | CONFIRMED with correction | Remove "(and before a session starts)": legacy refuses unstarted sessions too (`LearnerServiceImpl.java:535`). Keep S1. |
| COL-course-tabs-19 | WRONG (partly) | See section 2 row: three of the five claimed missing exports exist. |

## 5. UNCONFIRMED items and how to confirm (batch for the live check on the deployed dev site)

| # | Item | How to confirm |
|---|---|---|
| 1 | COL-attendance-R01 behaviour on real data | As College Admin, open an unmarked past session inside the window, correct one learner to Absent, reload the grid: check whether the other learners flip from "—" to "P" and whether `attendance_sessions` gained a MARKED row. Compare with legacy admin correction on lms-dev (other learners stay "N"). |
| 2 | COL-attendance-R03 scoped Super Admin | Sign in as Super Admin, scope to one college, open `/college/attendance`, then Policy, Departments and Correction windows links. |
| 3 | COL-course-tabs-04/05 API authorisation | As College Admin of college A: `POST /api/courses/assignments` for a lesson-level (no delivery) and for a delivery-scoped lesson; `POST /api/courses/assignment-submissions/{id}/grade` and `/publish` for a submission in college A and in college B. Expect lesson-level allowed, delivery-scoped denied, cross-college denied. |
| 4 | COL-placements-01/04 severity | Ask the owner: does every college always have a TPO user? If yes, move pipeline and interview scheduling for College Admin to S2 or a documented intentional difference (TPO owns pipeline); if the College Admin is sometimes the placement cell, keep S1. |
| 5 | COL-attendance-R02 and COL-projects-R01 | Create a workspace and reassign a mentor as College Admin, then read the student's and mentor's notifications; correct one absence as admin and check for an SMS or notification record. Decide whether parent SMS is in scope for vNext at all. |
| 6 | COL-verification-misc-07 student notification | Verify and send back one request; read the learner's notifications. |
| 7 | COL-course-tabs-19 export columns | Download the Video, Resources and Live Classes CSVs and compare columns with legacy `lesson-content.csv`; confirm Assignments and Quizzes have none. |
| 8 | Rows accepted without independent re-read | COL-attendance-09, -10, -12, -15; COL-course-tabs-02, -03, -06, -09, -11, -13, -15 to -18, -21 to -27; COL-placements-02, -03, -06, -07, -09 to -13, -16, -18, -20 to -26; COL-projects-01, -03, -04, -06, -07, -09, -12 to -18, -20 to -23; COL-verification-misc-02, -05, -07 to -09, -13 to -20. These match their cited files on a read of the citation only. A browser pass should walk each tab at 1280px and 375px against the legacy dev site. |

Tests and builds were not run; no databases were touched. Legacy sources read from a throwaway `git archive` extraction outside the repository.
