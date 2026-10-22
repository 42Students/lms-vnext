# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-010-131 [P1] MISSING facet F21
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Legacy resource upload presign and Google Drive importer in builder. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183;docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:418-423`)
- Expected fix: Wire existing signed file upload, safe URL resource list and Drive attachment importer.

## G2-4-012-028 [P1] GAP facet F06
- [x] Verified: assignment points blank maps to zero; nonblank requires integer 1–1000 in faculty lesson authoring.
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: Points optional blank saves zero; nonblank only integer 1-1000. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:445-450`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:677-694`)
- Expected fix: Match empty/default/validation behavior.

## G2-4-012-037 [P1] MISSING facet F07
- [x] Verified: empty title, missing assignment resources, and unselected submission methods have distinct validation messages and focus targets in FacultyLessonAuthoring.
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: Missing resource or title and no submission methods each show unique warning. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:355-375`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:412-420`)
- Expected fix: Restore separate exact warnings and form focus.

## G2-4-012-048 [P1] GAP facet F10
- [x] Verified: faculty authoring POST sends scoped lesson/delivery, ISO due date, points, submission methods, and validated resources through the faculty assignment command; the service persists these under delivery authorization.
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: Legacy create POST createLessonContent with lesson/content type, canonical deadline, points, resources/methods. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:456-491`; `docs/legacy-source/frontend/src/api/Services/courseServices.js:292-302`)
- Expected fix: Map missing scope/resources/methods and preserve wire validation.

## G2-4-012-092 [P1] GAP facet F23
- Files: src/components/courses/faculty-lesson-authoring.tsx, src/db/schema/assessments.ts
- Legacy: Old creation publishes immediately with resources/methods. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:456-491`)
- Expected fix: Document owner approval for deviations or fix.

## G2-4-013-012 [P1] GAP facet F03
- [x] Verified: authorized submission metrics survive roster failure; warning Banner says Report is partially loaded and Retry roster links to the same report.
- Files: src/modules/courses/faculty-assessment-report-service.ts, src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx
- Legacy: Partial roster warning yellow Alert Report is partially loaded, Retry roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- Expected fix: Render partial metrics/warning and Retry roster when submission data succeeded.

## G2-4-013-018 [P1] GAP facet F04
- [x] Verified: getFacultyAssignmentReport keeps scoped submissions when roster lookup fails; eligibleLearners is null and submitted count remains available.
- Files: src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx, src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy Submitted stat N/rosterSize if roster found, else N only. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:160-163`)
- Expected fix: Support submission-only report partial state when roster unavailable.

## G2-4-013-034 [P1] GAP facet F07
- [x] Verified: roster failures return reportCompleteness PARTIAL_ROSTER_UNAVAILABLE, with eligible/missing null instead of misleading counts.
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Partial roster failure shows Report is partially loaded and precise completion caution. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:82-85`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- Expected fix: Provide partial warning without false missing/eligible counts.

## G2-4-013-044 [P1] GAP facet F10
- [x] Verified: unique authorized assignment links without deliveryId resolve against faculty assessment overview; shared assignments use an explicit Section chooser.
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy report reads class roster even without dedicated Section filter. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:67-73`)
- Expected fix: Support unambiguous legacy links; retain strict cross-section scope for shared reports.

## G2-4-013-046 [P1] GAP facet F11
- [x] Verified: ambiguous shared assignments display an authorized Section chooser in the report page, rather than selecting an unrelated Section.
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy report may be reached by faculty from Blueprint without deliveryId. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:29-33`)
- Expected fix: Provide safe Section chooser on ambiguous deep links.

## G2-4-013-049 [P1] GAP facet F12
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy isGraded accepts graded==1 OR nonnegative pointsObtained. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:23-28`)
- Expected fix: Map legacy graded flag/score to new grading status consistently.

## G2-4-013-054 [P1] GAP facet F12
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy notSubmitted from entire roster minus deduped student ids, no foreign-row filter. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:95-112`)
- Expected fix: Document differences for withdrawn/transfer students in historic reports.

## G2-4-013-057 [P1] GAP facet F13
- [x] Verified: partial roster still retains submissions and leaves missing unknown.
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy roster partial still displays report data and warning. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:82-88`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- Expected fix: Render partial result with missing-count unknown placeholder.

## G2-4-013-085 [P1] GAP facet F20
- [x] Verified: roster failure is explicitly PARTIAL_ROSTER_UNAVAILABLE, never counted as a zero-member roster.
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy incomplete roster is a partial state rather than all failure. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:82-88`)
- Expected fix: Keep valid submissions data with explicit UNKNOWN completeness when roster unavailable.

## G2-4-013-089 [P1] GAP facet F22
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy studentId numeric, multiple rows deduped per student; status graded numeric or points. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:23-28`; `docs/legacy-source/frontend/src/utils/assignmentReport.js:43-55`)
- Expected fix: Specify migration of attempt count, points, graded visibility and identity.

## G2-4-013-090 [P1] GAP facet F22
- [ ] Partial: nullable dueAt and roster-loss behavior exist; historical period roster snapshot is not established.
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: Legacy due and points values nested in lesson content DTO, can lack roster. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:37-43`; `docs/legacy-source/frontend/src/utils/assignmentReport.js:100-115`)
- Expected fix: Define nullable due and roster-loss behavior, historical period roster snapshot.

## G2-4-028-054 [P1] GAP facet F20
- [x] Verified: people/members redirects intentionally discard c/m, while conversation routes retain compatible query parameters; legacy teamRedirect separates tab from rest.
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: c/m forwarded for conversations but dropped for members (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- Expected fix: Match query precedence for membership destinations.

## G2-17-019-047 [P1] GAP facet F23
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: Legacy activity row best-effort despite potential missing audit. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1107`
- Expected fix: Keep generic feed private and add separate complete grade ledger.

## G2-5-002-066 [P1] GAP facet F21 Integrations
- Files: (none, new feature)
- Legacy: Shared conflict helper used for pre-submit warning and calendar. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:42-44; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230)
- Expected fix: Share full interviewer/student conflict policy with booking.

## G2-5-006-049 [P1] GAP facet F14 Exports
- Files: (none, new feature)
- Legacy: No-class CSV cells blank, multi-session ratio (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:460-463)
- Expected fix: Export screen-equivalent N/P/A/ratio and blank no-class cells.

## G2-5-008-052 [P1] GAP facet F12 Business rules
- Files: (none, new feature)
- Legacy: Delete blocked when enrolled or active class schedules (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:403-425)
- Expected fix: Specify delete dependency semantics and distinct archive safety.

## G2-5-010-029 [P1] GAP facet F06 Forms
- [x] Verified: create/edit Class capacity controls enforce 1–200, and create/update Zod schemas enforce the same whole-number bound and minimum-size invariant.
- Files: (none, new feature)
- Legacy: Edit maxStudents 1–200, lower limit invariant (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:91-105)
- Expected fix: Keep same 1–200 range create/edit.

## G2-5-020-015 [P1] GAP facet F06
- [x] Verified: createDiscussionMessageSchema accepts lessonContentId and messageText while persisted sender membership and display name derive from scoped request context, never client identity.
- Files: src/modules/courses/discussion-service.ts
- Legacy: Legacy post DiscussionDTO carries lessonContentId,sequence,userId,names,text `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:37-55`
- Expected fix: Define lesson post body compatible with content/sequence; ignore spoofed identity.

## G2-5-020-021 [P1] GAP facet F07
- [x] Verified: the write transaction validates lessonContents.deliveryId, checks deletion, and returns LESSON_CONTENT_NOT_FOUND for orphan or other-delivery content.
- Files: src/modules/courses/discussion-service.ts
- Legacy: Legacy orphan content without course/class scope 403 fixed error `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:55-71`
- Expected fix: Implement ancestor-scope guard and wrong-college negative tests.

## G2-5-020-028 [P1] GAP facet F11
- [x] Verified: discussionAccess enforces scoped learning read and faculty creation rechecks active teaching assignments and faculty membership inside the write transaction.
- Files: src/modules/courses/discussion-service.ts
- Legacy: Legacy scope calls requireAccessClass/course + requireTeachingScope `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:47-70`
- Expected fix: Match faculty assigned-teaching access for each lesson content.
