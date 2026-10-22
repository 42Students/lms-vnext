# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-008-031 [P1] GAP facet F06
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:549-555`
- Expected fix: Legacy active/enabled/allowedForDisplay default true and switch; new always ACTIVE course creation, no Visible to students control/warning.

## G2-3-008-041 [P1] MISSING facet F08
- Files: src/components/courses/admin-course-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:576-593`
- Expected fix: Legacy partial bulk success warning `X of Y updated. Retry will target only failed courses.` and Retry failed; no college bulk UI in new.

## G2-3-008-045 [P1] MISSING facet F09
- Files: src/components/courses/admin-course-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:456-465`
- Expected fix: Old bulk confirmation names up to first five selected courses and scope, new college has no bulk confirmation.

## G2-3-008-072 [P1] GAP facet F20
- Files: src/app/(authenticated)/college/courses/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:140-212`
- Expected fix: Legacy request-sequence resets selection, media and edit when college changes; vNext duplicate query and client drawer may persist across membership changes.

## G2-3-008-081 [P1] GAP facet F23
- Files: src/components/courses/admin-course-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:491-516`
- Expected fix: Legacy Delete + Duplicate direct action, new Archive+Duplicate menu and no bulk college visibility; priority workflow mismatch.

## G2-3-001-027 [P1] GAP facet F06
- Files: src/components/courses/college-quiz-create.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:348-380`
- Expected fix: Make due date required at creation and retain 5-minute time-step/date-disabled constraints; current draft form accepts blank due.

## G2-3-001-030 [P1] GAP facet F06
- Files: src/components/courses/college-quiz-create.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:413-415`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:250-253`
- Expected fix: Restore `Publish now` toggle default on: legacy create could publish immediately; vNext always creates draft and needs separate action.

## G2-3-001-034 [P1] GAP facet F06
- Files: src/components/courses/college-quiz-create.tsx, src/modules/courses/quiz-validation.ts
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:346-347`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:19-25`
- Expected fix: Enforce legacy 5000-char description max or formally approve 10000-char new limit; distinguish UI and server validation.

## G2-3-001-047 [P1] GAP facet F10
- Files: src/components/courses/college-quiz-create.tsx, src/app/api/courses/quizzes/route.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:7-8`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:243-272`
- Expected fix: Support legacy create `publish=true` server-side or explicitly document intentional two-step publish rollout.

## G2-3-001-080 [P1] GAP facet F20
- Files: src/components/courses/college-quiz-create.tsx, src/components/courses/college-quiz-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:9-14`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:225-259`
- Expected fix: Audit IST wall-clock ↔ UTC offsets, DST-independent parsing, seconds stripping and late comparisons end-to-end.

## G2-3-001-086 [P1] GAP facet F22
- Files: src/modules/courses/quiz-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:19-28`
- Expected fix: Align description max length 5000 vs 10000 and required date policy; document DB/validation decision explicitly.

## G2-3-020-022 [P1] GAP facet F10
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:37-49`, `77-96`
- Expected fix: Legacy create loops and saves a row for every (faculty, course) without duplicate guard; vNext per-delivery assignment enforces active unique membership/role and at-most-one PRIMARY. Map duplicate behavior and bulk atomicity, avoid silently skipping.

## G2-3-007-014 [P1] GAP facet F04
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:49-72`
- Expected fix: Legacy average rounds each learner percent before averaging rounded values; vNext averages raw fractions then rounds: can differ by 1. Align formula precisely.

## G2-3-007-026 [P1] GAP facet F07
- Files: src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx, src/modules/courses/faculty-assessment-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:59-67`; `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:148-157`
- Expected fix: Legacy roster API failure falls back to partial data with warning+Retry roster, vNext Promise.all rejects entire report; restore partial-data degrade for roster-only failure.

## G2-3-007-036 [P1] GAP facet F11
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:49-71`; `docs/legacy-source/frontend/src/utils/quizReport.js:31-47`
- Expected fix: Legacy quiz report includes all submissions for quiz, vNext filters to only learners on current verified delivery roster; differences for transferred/withdrawn students need product decision.

## G2-3-007-038 [P1] GAP facet F12
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:99-114`
- Expected fix: Legacy shared quiz classId null has no single roster denominator, vNext refuses ambiguous multi-delivery without deliveryId. Add section-choice UI or legacy aggregate mode.

## G2-3-007-057 [P1] GAP facet F20
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:69-72`; `docs/legacy-source/frontend/src/utils/scoreDistribution.js:14-20`
- Expected fix: Integer-rounded averages and grade distribution boundary handling differ on 59.5/89.5 weighted scores; add shared regression fixtures.

## G2-12-009-041 [P1] GAP facet F11
- Files: src/modules/courses/discussion-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:438-465`
- Expected fix: Legacy isFacultyRole or own message can delete, including own pinned; vNext learner own deletion only when not pinned, plus faculty moderator.

## G2-12-009-076 [P1] GAP facet F22
- Files: src/modules/courses/discussion-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:373-399`
- Expected fix: Legacy deletion uses soft-delete retaining moderation/audit history; vNext `.delete(courseDiscussionMessages)` hard removes row. DB05 parity draft not yet registered per doc.

## G2-15-031-041 [P1] GAP facet F14
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:1-22`
- Expected fix: Legacy R2 presign files+links vs vNext upload grants/receipts and runtime flags.

## G2-15-031-061 [P1] GAP facet F22
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:66-86`
- Expected fix: Old content DTO submissions vs courseAssignments/submissions/file parts, migrate methods/grades.

## G2-17-027-021 [P1] GAP facet F10
- Files: src/modules/courses/discussion-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:87-94`
- Expected fix: Legacy lesson-thread fetch by lessonContentId; new list by deliveryId can mix messages from multiple lessons.

## G2-3-003-037 [P1] GAP facet F11
- Files: src/modules/courses/quiz-attempt-service.ts, src/components/courses/learner-quiz-attempt.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:188-190`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:330-340`
- Expected fix: Legacy allows faculty preview via effective role and includes correct answers; new learner page does not branch by teacher and requires learner access. Restore teacher preview elsewhere with explicit permission.

## G2-3-003-060 [P1] GAP facet F20
- Files: src/modules/courses/quiz-attempt-service.ts, src/modules/courses/quiz-validation.ts
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:527-530`
- Expected fix: Legacy request includes shownQuestionIds revision-check; vNext claims authored immutability. Assert session can't submit against swapped question IDs after publish/unpublish/edits.

## G2-3-027-005 [P1] MISSING facet F01
- Files: src/app/api/courses/progress/[contentId]/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-512`
- Expected fix: Legacy faculty/learner assignment list, paged and coursesForClass dropdown endpoints require equivalent role-scoped global assessment lists; content GET by lesson does not replace them.
