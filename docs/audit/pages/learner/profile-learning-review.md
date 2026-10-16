# Round R review: learner / profile-misc and learning-misc

Reviewer: Round R agent (Sonnet 5.5), 2026-10-16. Reviewed against current `origin/main` (includes the learner wording commits up to 87f93b8a9). Legacy read from branch `lms-dev-2026` via `git show` (the `lms-dev-2026-frontend` and `-backend` worktree checkouts are detached at older commits and lack `ProfileVerificationCard.jsx`, so I used the branch ref).

## 1. Summary

- Round A gaps reviewed: 67 (profile-misc 26, learning-misc 41).
- CONFIRMED 65, WRONG 1, SEVERITY-CHANGE 1, MISSED 6.
- Discrepancy rate = (6 + 1 + 1) / (67 + 6) = 8 / 73 = 11.0%.
- Both Round A files are accurate and unusually deep. The misses are concentrated in what they skipped: the header notifications bell, the Job Preferences card, field-level validations on Contacts and Education, and learner-facing notifications for grade publication and due reminders.
- Independence note: while looking up the section list I displayed lines 1 to 25 of `profile-misc.md` (title, sources, the first bullets of Profile section 1) before finishing my own Notifications, Assignments, Quizzes, Calendar and Attendance work. My profile verification, bell, job-preference, education and contact findings were already derived from legacy code; I read the rest of both Round A files only after my own gap list was fixed.

## 2. Round A gap verdicts

| Round A gap ID | Verdict | Note |
|---|---|---|
| profile-misc-01 | CONFIRMED | `learner-profile-workspace.tsx:432-435` still says resume is blocked. Evidence module `evidence.ts:108` demands a CLEAN RESUME receipt, so verification of Education cannot pass without it. |
| profile-misc-02 | CONFIRMED | Initials avatar only, upload blocked (`:430`). |
| profile-misc-03 | CONFIRMED | Aadhaar/PAN/marksheet upload controls absent; `evidence.ts:96-107` needs them. |
| profile-misc-04 | CONFIRMED | No video intro anywhere in `src`. Only `db04-learner-profile-extras.staged.ts` (not exported). |
| profile-misc-05 | CONFIRMED | |
| profile-misc-06 | CONFIRMED | Was UNCONFIRMED. Resolved: education `educationType`, `program`, `specialization`, `institution` are plain text inputs (`learner-profile-workspace.tsx:65-75`), no `/education/config` catalogue and no exam-config fields. See also R03. |
| profile-misc-07 | CONFIRMED | |
| profile-misc-08 | CONFIRMED | |
| profile-misc-09 | CONFIRMED | See R05 for the weighting detail. |
| profile-misc-10 | CONFIRMED | Delete confirm exists (`learner-profile-delete-confirm-model.ts`, `window.confirm` at `:382`); edit-dialog discard remains UNCONFIRMED. |
| profile-misc-11 | WRONG | vNext does refresh on tab return: `visibilitychange` listener at `learner-profile-workspace.tsx:222-223`, throttled to 45 s and skipped while editing or saving (`learner-profile-refresh-model.ts:4-6`), plus a manual "Refresh saved profile" button (`:408`). Only the exact legacy behaviour (unthrottled silent reload) differs. Not a gap. |
| profile-misc-12 | CONFIRMED | Intentional difference. |
| profile-misc-13 | CONFIRMED | Was UNCONFIRMED. Resolved: the profile workspace does not import the skills catalogue; skills are a name text field plus a proficiency select (`:78-80`). |
| profile-misc-14 | CONFIRMED | |
| profile-misc-15 | CONFIRMED | Was UNCONFIRMED. Resolved: `evaluateVerificationEvidence` already returns `missing: string[]` (`profile-verification/evidence.ts:96-110`, texts such as "Upload a resume", "Provide marks for ...") but `learn/profile/verification/page.tsx` never renders it and the status model carries no `missing`. The data exists; surfacing it is cheap. Legacy server also blocks a send with "Before sending: ..." (`ProfileVerificationService.java:294-295`). |
| profile-misc-16 | CONFIRMED | |
| profile-misc-17 | CONFIRMED | |
| profile-misc-18 | CONFIRMED | Not independently verified (backend file not opened); keep S4. |
| profile-misc-19 | CONFIRMED | |
| profile-misc-20 | CONFIRMED | |
| profile-misc-21 | CONFIRMED | Context line per row absent (rows show module/importance only). |
| profile-misc-22 | CONFIRMED | UNCONFIRMED part stays for live check (U2). |
| profile-misc-23 | CONFIRMED | |
| profile-misc-24 | CONFIRMED | |
| profile-misc-25 | CONFIRMED | |
| profile-misc-26 | CONFIRMED | |
| learning-misc-01 | SEVERITY-CHANGE | S1 to S2 pending live check. The file path is implemented (`assignment-file-service.ts`, `submit-files` route, up to 10 files) and is gated only by `assignmentFilesRuntimeEnabled()`. It is a deployment flag, not a code gap. Re-raise to S1 only if the flag is off on the deployed dev site (U1). |
| learning-misc-02 | CONFIRMED | No attachment/resource columns for assignments found. |
| learning-misc-03 | CONFIRMED | |
| learning-misc-04 | CONFIRMED | `assignment-submission-control.tsx:30,191` offers one of TEXT, LINK, FILE. |
| learning-misc-05 | CONFIRMED | Stronger than stated: prod-2026 also rejects after the deadline ("Submission deadline has passed", `AssignmentServiceImpl.java` prod L487-488) and "Already submitted" is enforced in both. vNext comment `assignment-submission-service.ts:209-211` ("legacy parity") is false for both branches. |
| learning-misc-06 | CONFIRMED | |
| learning-misc-07 | CONFIRMED | |
| learning-misc-08 | CONFIRMED | Activity event only. The notification half is widened by LEARNER-learning-misc-R01 below. |
| learning-misc-09 | CONFIRMED | |
| learning-misc-10 | CONFIRMED | |
| learning-misc-11 | CONFIRMED | |
| learning-misc-12 | CONFIRMED | |
| learning-misc-13 | CONFIRMED | |
| learning-misc-14 | CONFIRMED | |
| learning-misc-15 | CONFIRMED | `learner-assessment-overview.tsx:113` PAGE_SIZE 20 is client side over the full overview. |
| learning-misc-16 | CONFIRMED | |
| learning-misc-17 | CONFIRMED | |
| learning-misc-18 | CONFIRMED | |
| learning-misc-19 | CONFIRMED | |
| learning-misc-20 | CONFIRMED | |
| learning-misc-21 | CONFIRMED | |
| learning-misc-22 | CONFIRMED | |
| learning-misc-23 | CONFIRMED | Both layers: attempt gate `quiz-attempt-service.ts:338` is `dueAt &&`, and faculty `PUBLISH` (`faculty-quiz-authoring-service.ts:126-128`) does not require a due date, whereas legacy publish rejects with "Due date is required before publishing" (`QuizServiceImpl.java:225`). |
| learning-misc-24 | CONFIRMED | `mayRevealLearnerResults` (`quiz-attempt-service.ts:442-451`) needs `attemptsUsed > 0`, so a non-attempter never sees the key; history page shows only "Not attempted". |
| learning-misc-25 | CONFIRMED | |
| learning-misc-26 | CONFIRMED | Verified: `shuffleQuestions`/`shuffleOptions` appear only in `db/schema/quizzes.ts:58-61`; neither the faculty builder nor the learner attempt uses them. Legacy shuffles per learner with a stable seed and exempts faculty (`QuizServiceImpl.java:915-945`). |
| learning-misc-27 | CONFIRMED | |
| learning-misc-28 to -41 | CONFIRMED | Copy, responsive, performance and column items. Spot-checked -36, -37 (vNext adds Excused/Medical/Late statuses legacy lacks; improvement), -34. |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-profile-misc-R01 | The Notifications bell/alerts drawer is not audited and not reproduced. Legacy bell opens a drawer "Notifications" with the 8 latest items (title, 80-char preview, type tag), states "Couldn't load notifications", "Refreshing notifications...", "Notifications may be out of date", empty "No notifications yet", footer link "View all notifications", and a detail modal with type-specific actions (Take Assessment, View Interview, View in My Applications). vNext bell is a plain link with an emoji; its count comes from `/api/notifications?unreadOnly=true&limit=20`, so it can never exceed 20, is fetched once on mount (never refreshed after mark-read or new arrivals), and a failed fetch silently shows nothing. | MISSING-MODAL / STATE | S3 | `src/components/Dropdowns/Notification/NotifivationDropdown.js` (title L47, drawer states L52-113, "View all notifications" L122-124, badge/aria L467-487) | `src/components/shell/learner-topbar-tools.tsx:28-34,121-135` |
| LEARNER-profile-misc-R02 | Job Preferences card missing: Role Preference (multi), Specific Role Preference (free text), Work Shift Preference (select), Preferred Employment City (select). Loaded by `getLearnerJobPreferences`, edited inline, absent from vNext checklist and schema. Effect on drive matching UNCONFIRMED. | MISSING-FIELD | S3 | `components/profile/about/jobPreferences.js:118-231`; `about.js` loadAllData jobPreferences; error "Failed to update job preferences" (L46) | no `jobPreferences` in `src/components/profile`, `modules/people/profile-validation.ts` or checklist |
| LEARNER-profile-misc-R03 | Education entry validation and pickers absent. Legacy requires education type, institution name, grading type, grade obtained and max grade (messages: "Education type is required", "Institution name is required", "Grading type is required", "Grade obtained is required", "Max grade is required for job screening", toast "Please fill in all required fields (grading type, grade obtained, and max grade)"); server repeats it ("Grading type is required for every education entry."). vNext makes every education field optional free text (`profile-validation.ts:132-166`), including `educationType`. Because `educationLevel()` in verification matches the typed string by prefix (`evidence.ts:49-57`: starts with 10, 12, DIPLOMA, or exactly UG/PG), a learner who types "Tenth" or "B.Tech" gets "Add 10th education" forever with no picker to guide them. Round A -06 covers the missing catalogue; this adds the missing required-field validation and the verification coupling. | VALIDATION | S2 | `qualifications.js:216-270`; `LearnerProfileServiceImpl.java:474-487`; `EducationConfig.java` | `learner-profile-workspace.tsx:65-75` (no `type: "select"` for educationType); `profile-validation.ts:132-166` |
| LEARNER-profile-misc-R04 | Contact validation weaker. Legacy: primary mobile required and exactly 10 digits ("Primary mobile number must be exactly 10 digits"), alternate phone 10-15 digits, "Alternate phone number cannot be the same as primary mobile number", "Primary mobile number is required when alternate phone is provided", contact email validated. vNext accepts `+`, spaces, hyphens, 8 to 21 chars (`/^[+]?\d[\d\s-]{7,20}$/`), has no same-as-primary check and no editable primary mobile on the profile. | VALIDATION | S3 | `contacts.js:71-80,177-186`; `LearnerProfileServiceImpl.java:349-382` | `profile-validation.ts:48-62` (`phoneValue`), contacts schema (`alternatePhone`, `contactEmail` only) |
| LEARNER-profile-misc-R05 | Profile completion is weighted in legacy (Personal 15, Contact 10, Education 15, Skills 10, Experience 10, Projects 10, others 2 to 5; required flags on Personal, Contact, Education, Skills) with a message tier (`getMessage`) and colour tier; vNext is an unweighted count of filled sections. A learner with only low-value sections filled scores higher than in legacy. | COPY / STATE | S4 | `utils/profileUtils.js:10-25`, `ProfileCompleteness.js` | `modules/people/learner-profile-checklist.ts:20-43` |
| LEARNER-learning-misc-R01 | Learner never receives in-app or email notices for grade publication or assignment due reminders. Legacy: `COURSE_GRADE_PUBLISHED` dispatched on publish (with points and percentage), `COURSE_ASSIGNMENT_DUE` sent by `NotificationSchedulerService` for upcoming deadlines, plus the submission confirmation. vNext records `COURSES_ASSIGNMENT_GRADE_PUBLISHED` only as an activity event; no code turns it into a learner notification (the only `deliverInAppNotification*` caller outside placements/verification is `offer-service.ts:536`), so the learner "Course" inbox tab has no course-generated items and no due-soon cue outside the list page. Round A -08 covers only the submission notice. | SIDE-EFFECT | S2 | `AssignmentServiceImpl.java:749,1024-1080` (grade published), `NotificationSchedulerService.java:430-470` (due reminder), `NotificationEvent.java:26-27` | `assignment-submission-service.ts:842-857` (activity event only); `modules/activity/notification-service.ts:245-270` unused by courses |

## 4. WRONG and SEVERITY-CHANGE details

- profile-misc-11 (WRONG): see table. The claim "vNext requires the user to return and refresh" is false; return-to-tab refresh exists with a 45 s throttle and an edit/save guard, and merges server changes only into untouched fields (`learnerProfileReconcile`). Remove the gap or restate as COPY S4 at most.
- learning-misc-01 (SEVERITY-CHANGE S1 to S2): the upload code path, receipts, grants and a 10-file cap exist. What is "blocked" is `assignmentFilesRuntimeEnabled()`, an environment decision. Track as an environment checklist item; if the deployed dev site shows no file option on a published assignment, restore S1.

## 5. UNCONFIRMED and how to confirm on the deployed dev site

| # | Item | How to confirm |
|---|---|---|
| U1 | Assignment file submission flag on dev | Open a published assignment as a learner; check the "File" choice is enabled and that a 60 MB and a `.py` file are rejected with a clear message. |
| U2 | Class/department announcements in the learner feed (Round A -22) | Post a class-scoped and a department-scoped announcement as faculty/college admin, check the learner inbox and pinned section. |
| U3 | Bell count vs inbox (profile-misc-R01) | Create 25 unread notifications for one learner; bell should show 25, shows 20. Mark one read from the inbox and check whether the bell updates without reload. Also compare bell count with inbox count for a learner with notifications in a second college (inbox filters by `collegeId`, the bell endpoint may not). |
| U4 | Learner course notifications (learning-misc-R01) | Publish a grade as faculty; check the learner inbox, email log and the "Course" tab for any item. |
| U5 | Verification: what blocks "Send" | With a learner who has an unmarked 10th entry and no resume, open `/learn/profile/verification` and confirm no missing list is shown (profile-misc-15). |
| U6 | Free-text education type (R03) | Save education type "Tenth" with marks, open verification page, check the Education submit state and server `INCOMPLETE_DOCUMENTS` text. |
| U7 | Edit-dialog discard confirm (profile-misc-10) | Open Edit profile, type, press Escape and Cancel. |
| U8 | Legacy slug course links resolve (learning-misc-41) | Open `/learn/courses/<legacy-slug>/home`. |
