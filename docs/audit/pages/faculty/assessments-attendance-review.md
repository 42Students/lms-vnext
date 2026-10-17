# Faculty / Assessments and Attendance-Grades: Round R review (covers `assessments.md` and `attendance-grades.md`)

Reviewed: 2026-10-16 by Round R agent (Sonnet 5.5). Independent audit done first (legacy FE `lms2-fe` ref `lms-dev-2026` = `_hr-tpo-fe` 63fea105, legacy BE `42LMS-BACKEND\lms` lms-dev-2026 9993beec, vNext main fe28b3791 which includes the chat-7 faculty submission review/file review commits 454b30338 and c7c89c721), then diffed against Round A. Round A files for `courses.md` / `courses-review.md` were not opened. No gradebook gaps are reported as missing: legacy has no faculty gradebook (only admin analytics `data/admin/analytics-student/studentsGradeBook`), so Round A attendance-grades-21 is correct.

## 1. Summary

- Round A gaps reviewed: 52 (assessments 30, attendance-grades 22).
- CONFIRMED 46, WRONG 4, SEVERITY-CHANGE 2, MISSED 10 (8 assessments, 2 attendance-grades).
- Discrepancy rate = (MISSED 10 + WRONG 4 + SEVERITY-CHANGE 2) / (52 + 10) = 16 / 62 = 25.8%. Above the 15% threshold in the plan (section 5): re-audit of this account is indicated, although 6 of the 10 MISSED rows are S3/S4 detail and the 4 WRONG rows are mostly over-reports.
- Top misses: published assignment cannot be edited at all while Round A feared the opposite (R01); quiz deadline can be moved after attempts or after close (R02); no unsaved-changes guard on create forms (R03).

## 2. Round A gap verdicts

| Round A gap ID | verdict | note |
|---|---|---|
| FAC-assessments-01 | CONFIRMED | No assignment resources (Instructions rich text, PDF, File, Link) and no `allowed_submission_types`. Re-verified: `db/schema/assessments.ts` `courseAssignments` has only title, description, dueAt, maxPoints, sequence. Keep S1. |
| FAC-assessments-02 | CONFIRMED | Overlaps 01 (same schema root cause); learners can submit text, one URL or files only. |
| FAC-assessments-03 | CONFIRMED | grep for shuffle/randomi finds only `db/schema/quizzes.ts` and migration 0098; no authoring or attempt code. |
| FAC-assessments-04 | CONFIRMED | `dueAt` nullable in `faculty-quiz-authoring-model.ts` L8 and `faculty-assignment-authoring-model.ts` L12; legacy BE also returns `Due date is required` / `Assignment due date is required` (QuizServiceImpl L730, AssignmentContentWriteService L291). |
| FAC-assessments-05 | CONFIRMED | `facultyQuizResultsTransition` requires status CLOSED; grep for auto-close in `src/modules/courses` finds nothing. Legacy gate is the deadline (QuizServiceImpl `setGradePublished` L276-L290 `Quiz results can only be released after the deadline has passed`). Resolves the UNCONFIRMED. |
| FAC-assessments-06 | CONFIRMED | Two-step grade/publish; candidate for the intentional list, owner decision (private-until-published is a deliberate vNext rule). |
| FAC-assessments-07 | CONFIRMED | `assignment-submission-service.ts` publish path only calls `recordActivityEventInTransaction` (L843); no notification/message producer anywhere in `modules/courses`. Legacy `sendGradePublishedNotification` dispatches COURSE_GRADE_PUBLISHED (AssignmentServiceImpl L1024-L1087). |
| FAC-assessments-08 | CONFIRMED | Wording `Release results`/`Withhold results` vs `Publish results`/`Hide results`. Note legacy enabling rule is deadline, see 05. |
| FAC-assessments-09 | CONFIRMED | No faculty Preview Quiz. Faculty can only see questions of a DRAFT quiz (`FacultyQuizQuestionEditor`) or aggregate accuracy on the report. |
| FAC-assessments-10 | CONFIRMED | Legacy chips `Draft` / `Needs due date` / `Closed` / `Open` (table.js L275-L281). |
| FAC-assessments-11 | CONFIRMED | |
| FAC-assessments-12 | CONFIRMED | Current legacy create modal strings (`Assigned courses could not be loaded`, `No lessons in this course yet`) exist in committed `_hr-tpo-fe` 63fea105; an older detached worktree `lms-dev-2026-frontend` (83347e29) has different strings, so cite the 63fea105 tree only. |
| FAC-assessments-13 | CONFIRMED | |
| FAC-assessments-14 | CONFIRMED | |
| FAC-assessments-15 | WRONG | See section 4. For faculty, `commandFacultyAssignment` EDIT is allowed only for DRAFT with zero submissions (`faculty-assignment-authoring-service.ts` L84-L90), so the feared "due date changed after submissions on a published assignment" cannot happen. The real problem is the opposite and is missed: see FAC-assessments-R01. |
| FAC-assessments-16 | CONFIRMED | |
| FAC-assessments-17 | CONFIRMED | |
| FAC-assessments-18 | CONFIRMED | Legacy per-question max 100 (QuizBuilderModal L503, BE `MAX_POINTS_PER_QUESTION` 100); vNext input max 1000. |
| FAC-assessments-19 | CONFIRMED | Legacy FE 1-1000, BE 0-1000 (AssignmentContentWriteService L300). |
| FAC-assessments-20 | CONFIRMED | Candidate intentional (Section scoping). |
| FAC-assessments-21 | CONFIRMED | |
| FAC-assessments-22 | SEVERITY-CHANGE | S3 to S4. After chat-7 `454b30338`/`c7c89c721`, uploaded files show `Uploaded File` + `Open file` with scoped download grants (`faculty-submission-file-review.tsx` L88-L92), matching legacy `Open file`. Residual: no inline PDF iframe preview; written responses are plain text in vNext because the learner side submits plain text. |
| FAC-assessments-23 | CONFIRMED | Chips `Pending` already match the legacy list chips; only the strip text (`Grade pending`, `Graded: N pts`) differs. Keep S3. |
| FAC-assessments-24 | CONFIRMED | |
| FAC-assessments-25 | WRONG | vNext cards already show course, section, lesson and `Due {date|No due date}` (`faculty-assessment-overview.tsx` L170-L176). Only the `Created:` fallback is absent and `Needs due date` is covered by 10/04. Retire this row. |
| FAC-assessments-26 | WRONG | `View Report` is rendered for every item regardless of status (overview L217-L223). `View submissions` appearing only for PUBLISHED is correct because assignments in DRAFT cannot have submissions. |
| FAC-assessments-27 | CONFIRMED | |
| FAC-assessments-28 | WRONG | Resolved: headings match. Quiz report uses `Score distribution`, `Question accuracy`, `Worst-answered first.`, `Student scores`; assignment report `Score distribution`, `Submission timing`, `Student scores`; PDF button is `Download PDF` as in legacy `ReportSummaryHeader`; file name pattern `<kind>-report-<title>.pdf` matches legacy. The legacy `This report is incomplete` modal has no vNext counterpart because data is loaded server-side in one call. Residual wording differences are in R06. |
| FAC-assessments-29 | CONFIRMED | Still UNCONFIRMED at 375px; batch in section 5. |
| FAC-assessments-30 | CONFIRMED | |
| FAC-attendance-grades-01 | CONFIRMED | Nuance: the legacy SMS goes to the learner's `contactMobile` (templated as "Dear Parent"), there is no separate parent number (LearnerServiceImpl L605-L628); correction SMS only when an absence is removed (L635-L675). |
| FAC-attendance-grades-02 | CONFIRMED | Includes switching Report/Mark mode and session select. |
| FAC-attendance-grades-03 | SEVERITY-CHANGE | S3 to S4. vNext saves atomically (`faculty-service.ts` transaction), so legacy partial-failure reporting has no equivalent need; the only residual is a generic failure text. |
| FAC-attendance-grades-04 | CONFIRMED | No success message after save (only `router.refresh()`); `window.confirm` instead of Modal. |
| FAC-attendance-grades-05 | CONFIRMED | |
| FAC-attendance-grades-06 | CONFIRMED | |
| FAC-attendance-grades-07 | CONFIRMED | Verified legacy BE also caps duration (`A single class session cannot exceed 12 hours`, ClassScheduleServiceImpl L146-L156) and vNext has none (`faculty-schedule-mutation-model.ts`). See also R02 for the past-date rule. |
| FAC-attendance-grades-08 | CONFIRMED | |
| FAC-attendance-grades-09 | CONFIRMED | |
| FAC-attendance-grades-10 | CONFIRMED | Candidate intentional (section-level delivery). |
| FAC-attendance-grades-11 | CONFIRMED | |
| FAC-attendance-grades-12 | CONFIRMED | |
| FAC-attendance-grades-13 | CONFIRMED | See R01 for a behavioural asymmetry not covered here. |
| FAC-attendance-grades-14 | CONFIRMED | |
| FAC-attendance-grades-15 | CONFIRMED | |
| FAC-attendance-grades-16 | CONFIRMED | Page states explicitly that correction requests do not exist in the registered database. |
| FAC-attendance-grades-17 | CONFIRMED | Resolved: vNext button label is `Download PDF` (`faculty-report-download.tsx` L33); legacy label is `Download Report` and failure text `Couldn't generate the attendance report. Please try again.` (TeacherAttendanceView L184, L227). |
| FAC-attendance-grades-18 | CONFIRMED | |
| FAC-attendance-grades-19 | CONFIRMED | `faculty-course-home-signals.tsx` L150 text "currently match the legacy risk rules". |
| FAC-attendance-grades-20 | CONFIRMED | Still UNCONFIRMED at 375px. |
| FAC-attendance-grades-21 | CONFIRMED | Legacy has no faculty gradebook, not a false gap. |
| FAC-attendance-grades-22 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| FAC-assessments-R01 | A PUBLISHED assignment cannot be edited at all (title, instructions, due date, points), even with zero submissions; the list still shows an `Edit` drawer for it, which fails with an opaque transition error. Legacy allows editing a live assignment until learner submissions exist, and the title remains correctable afterwards (`Learner submissions exist` alert). A typo in a published title or a deadline extension before anyone submits needs archive + recreate in vNext (archive is blocked once submissions exist, so with one submission the title can never be fixed). | VALIDATION | S2 | FE:newAssignment.js L128-L157, L436-L445 (title always editable, rest locked only if submissions exist); BE:AssignmentContentWriteService.java L239-L275 | `faculty-assignment-authoring-service.ts` L88-L90 (`current.status!=="DRAFT"||submission` rejects EDIT); `faculty-assessment-overview.tsx` L184-L200 (Edit shown for any owned item); `faculty-assignment-editor.tsx` L93 note |
| FAC-assessments-R02 | A published or closed quiz's deadline can still be moved after learner attempts and after the quiz closed (and after results were released). The editor hint says "you can still edit its title, description and due date". Legacy rejects this with 409 (`Quiz deadline cannot be changed after learner submissions exist` / `after a published quiz has closed`), also locks randomization, and the builder disables the date picker with `This quiz is already closed. Its deadline cannot be moved forward.` | VALIDATION | S2 | BE:QuizServiceImpl.java L172-L199; FE:QuizBuilderModal.jsx L287-L291, L352-L356, L374 | `faculty-quiz-authoring-service.ts` L77-L97 (metadata edits allowed for non-draft, only questions and attempt limit locked; comment "title, text and deadline metadata"); `faculty-assessment-editor.tsx` L303-L308 hint |
| FAC-assessments-R03 | No unsaved-changes guard on assessment authoring: closing the Create drawer, the Edit drawer or the inline authoring/quiz-builder forms discards typed questions silently. Legacy has dirty-close Modals `Discard this quiz draft?` / `Discard quiz changes?` / `Discard this assignment draft?` plus `beforeunload` and route-change guards. | STATE | S3 | FE:QuizBuilderModal.jsx L73-L92, L206-L223; newAssignment.js L380-L401 | `faculty-assessment-create.tsx` (Drawer with `onOpenChange={setOpen}` only), `faculty-assessment-editor.tsx` L234-L240, `faculty-lesson-authoring.tsx` (grep for unsaved/Discard/beforeunload finds nothing) |
| FAC-assessments-R04 | List loading cost and paging: `getFacultyAssessmentOverview` loads the full authoring workspace of every teaching delivery on each visit of both lists (and gradebook reuses it) and paginates client-side; legacy lists page server-side (20) with a server course filter and server `summary` counts. Large teaching loads will slow and cannot be paged by the server. | PERFORMANCE | S3 | FE:table.js L40, L432-L447; AssignmentsContent.jsx L288-L311 | `faculty-assessment-service.ts` L9-L24; `faculty-assessment-overview.tsx` L20-L42 |
| FAC-assessments-R05 | Deep link `?content=<quizId>` that auto-opens the quiz submissions (used by notifications/links) has no vNext equivalent; `/teacher/allQuizzes` ignores query params. | MISSING-ACTION | S4 | FE:table.js L52-L53, L453-L460 | `teacher/allQuizzes/page.tsx` (no searchParams) |
| FAC-assessments-R06 | Quiz report header differs: legacy stats are Submitted, Average score, Questions, Due date and the page has a `Back` button; vNext shows `Total attempts` in place of `Due date` (due only appears in the PDF summary) and a `← My Quizzes` link. Assignment report header already matches. | COPY | S4 | FE:QuizReportContent.jsx L138-L146; ReportSummaryHeader.jsx L13 | `teacher/report/quiz/[quizId]/page.tsx` L111-L117 |
| FAC-assessments-R07 | Score distribution bars are not drillable: legacy bars with entries become clickable and list exactly which students fall in the bucket (`studentsByLabel`); vNext bars are display only. | MISSING-ACTION | S4 | FE:ScoreDistributionBars.jsx L16-L22, L54-L73 | `teacher/report/quiz/[quizId]/page.tsx` L132-L158; assignment report equivalent |
| FAC-assessments-R08 | Assignment points are optional in legacy (blank saves as 0, an ungraded/participation assignment); vNext requires `Maximum points` 1-10000, so a zero-point assignment cannot be authored. | VALIDATION | S4 | FE:newAssignment.js L445-L450, L682-L691; BE:AssignmentContentWriteService.java L300 (0 allowed) | `faculty-assignment-editor.tsx` (min 1); `faculty-lesson-authoring.tsx` L335-L350 |
| FAC-attendance-grades-R01 | Window asymmetry: legacy applies the correction window only when marking absent (`attend`); un-marking (mark present via `removeAbsence`) has no time check, so faculty could always clear a wrongly marked absence (and the parent got a correction SMS). vNext blocks every save once the window has expired (`WINDOW_EXPIRED`) and sends users to the College Admin. Record as stricter than legacy; confirm with owner. | VALIDATION | S4 | BE:LearnerServiceImpl.java L520-L560 (window in `attend`), L635-L646 (`removeAbsence` unguarded) | `modules/attendance/faculty-marking-window.ts` L13-L28; `faculty-attendance-workspace.tsx` L305-L308 |
| FAC-attendance-grades-R02 | Scheduling-in-the-past rule: the legacy FE drawer allows past dates, but the legacy BE rejects a start earlier than now minus a configurable grace (`Cannot schedule a class in the past`) and also checks batch and lecture-hall conflicts; vNext accepts any start inside the academic period and has no hall. Effective legacy behaviour (BE wins) is "no back-dated sessions"; vNext allows logging past sessions. Likely an improvement, needs owner confirmation. | VALIDATION | S4 | BE:ClassScheduleServiceImpl.java L296-L316 (`pastBookingGraceMinutes`), L198-L216 (conflict messages) | `modules/attendance/faculty-schedule-mutation-service.ts` L38-L62 (period bounds and overlap only) |

## 4. WRONG and SEVERITY-CHANGE details

- FAC-assessments-15 (WRONG): the claim "a published assignment with submissions may still have its due date changed" is false for the faculty path. `updateAssignment` routes faculty to `commandFacultyAssignment` (`assignment-service.ts` L270-L272) and that service rejects EDIT when `status!=="DRAFT"||submission` (`faculty-assignment-authoring-service.ts` L88-L90). The `maxPoints` guard Round A cites in `assignment-service.ts` L277-L295 is only the non-faculty (admin) branch. Replace with R01.
- FAC-assessments-25 (WRONG): course, section, lesson and due date are all on the vNext card; remove the row (the `Needs due date` flag is already under 10/04).
- FAC-assessments-26 (WRONG): `View Report` is not tied to status; a DRAFT assignment cannot have submissions, so hiding `View submissions` until PUBLISHED is not a loss.
- FAC-assessments-28 (WRONG): headings and the PDF button match legacy; see verdict table.
- FAC-assessments-22 (SEVERITY-CHANGE S3 to S4): chat-7 already restored `Uploaded File` / `Open file` labels; only the inline PDF iframe is missing.
- FAC-attendance-grades-03 (SEVERITY-CHANGE S3 to S4): atomic save removes the partial-save scenario.

## 5. UNCONFIRMED items and how to confirm (batch for the live check on the dev site)

1. Whether prod/dev legacy sends the absence SMS to the learner's own mobile or a guardian field (code shows `studentDetails.getContactMobile()`): confirm in the legacy `learner` table columns or the SMS delivery log (`AdminSmsLogController`).
2. Edit of a PUBLISHED assignment from the My Assignments drawer: open Edit on a published assignment with zero submissions and record the exact error text (R01).
3. Change the due date of a CLOSED quiz that has attempts via Edit, save, and check activity log and learner view (R02).
4. Learner-visible effect of grade publication: with a seeded learner, publish a grade and check the learner notification inbox, email and SMS (FAC-assessments-07 expects none).
5. 375px layout of the My Assignments/My Quizzes card actions, grading drawer and mark mode (FAC-assessments-29, FAC-attendance-grades-20).
6. Attendance PDF: columns and file name versus legacy `attendance-<course>-<month>.pdf` (`Student`, `Present`, `Absent`, `Not marked`, `Attendance %`, `Below 75%` card) after FAC-attendance-grades-17 is built.
7. Scheduling a past session in legacy dev (R02): try yesterday's date in the Schedule Class drawer and record the server message.
8. Whether any scheduled job closes quizzes at their deadline (FAC-assessments-05); a quick DB check of `course_quizzes` rows with `status='PUBLISHED'` and `due_at < now()` on dev answers it.

## FAST v2 chat-4-b latest main sync (2026-10-17)

- `FAC-assessments-R01` source hardening: Faculty's existing published-before-submission edit workflow remains; College Admin assignment PATCH now serializes updates behind an assignment row lock and denies any edit after a learner submission, not merely points/method changes. Admin GET returns fresh title, due date, points, revision and a scoped has-submissions indicator; editor reloads these, rejects submitted assignments and sends the persisted optimistic revision. Stale edits and submission conflicts display actionable messages.
- `FAC-assessments-R02` source hardening: College quiz PATCH locks the complete quiz row, rejects stale revision tokens and archived quizzes, rechecks attempted questions/shuffle/max-attempts and deadline/closure under that lock, and advances the persisted revision monotonically. Admin quiz editor gives specific attempt, stale-version and deadline messages; an unchanged published deadline is no longer included unnecessarily in metadata-only updates.
- These are source-only implementation advances, not runtime parity certification. No tests, lint, typecheck, build or CI per FAST v2. Attempt creation and grading flows need their own later end-to-end acceptance pass.
