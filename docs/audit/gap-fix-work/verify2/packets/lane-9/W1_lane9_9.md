# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-012-055 [P1] MISSING facet F23
- Files: src/modules/notifications/types.ts, src/modules/notifications/exotel-sms.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:29-49`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-239`
- Expected fix: Legacy deliberate transport-wide SMS attempt log with support endpoint dropped; no stated product exception, restore encrypted/minimized support audit.

## G2-3-006-018 [P1] GAP facet F05
- Files: src/modules/courses/faculty-assessment-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:440-474`
- Expected fix: Legacy list order from backend listQuizzesV2 (repository ordering UNKNOWN), vNext explicit dueAt ascending/title; compare exact sort before claiming parity.

## G2-3-006-022 [P1] GAP facet F06
- Files: src/components/courses/faculty-assessment-create.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:348-380`
- Expected fix: Legacy builder enforces required future quiz due time and Publish now default, nested FacultyLessonAuthoring needs policy and input parity confirmation.

## G2-3-006-031 [P1] GAP facet F09
- Files: src/components/courses/faculty-assessment-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:550-571`
- Expected fix: Legacy edit preflight checks attempts and shows Edit metadata modal; vNext metadata editor/questions editor split must lock immutable assessment fields after attempts.

## G2-3-006-034 [P1] GAP facet F10
- Files: src/components/courses/faculty-assessment-create.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:201-266`
- Expected fix: Legacy builder can create and publish quiz on same save; ensure vNext FacultyLessonAuthoring form and lifecycle supports immediate publish if intended.

## G2-3-006-037 [P1] GAP facet F11
- Files: src/components/courses/faculty-assessment-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:403-434`
- Expected fix: Legacy shows Preview Quiz and Edit/Delete for faculty actor; new FacultyAssessmentOverview shows mutation controls only facultyOwned, shared offerings are read-only. Confirm parity/authorization decision.

## G2-3-006-038 [P1] GAP facet F12
- Files: src/components/courses/faculty-quiz-review.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:309-338`
- Expected fix: Release gate must be after deadline, publishing grade visibility affects entire quiz; vNext policy requires review with actual deadlineReached value passed default false.

## G2-3-006-039 [P1] GAP facet F12
- Files: src/components/courses/faculty-assessment-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:540-571`
- Expected fix: Quiz after submissions may edit only title/description; verify vNext editor won't offer attempt limit/deadline regardless of authored status.

## G2-3-006-055 [P1] GAP facet F20
- Files: src/components/courses/faculty-quiz-review.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:226-231`; `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:239-251`
- Expected fix: Legacy cancels stale quiz list requests, locks results toggles; vNext fetch/read delayed action lock should ignore responses after delivery/role switch.

## G2-3-006-058 [P1] GAP facet F22
- Files: src/modules/courses/faculty-assessment-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:440-474`
- Expected fix: Legacy facultyProgram courseId/classId/courseSlug and numeric quizId vs vNext offering/delivery/lesson UUID; map course+class to delivery and verify shared offering visibility.

## G2-3-006-059 [P1] GAP facet F22
- Files: src/modules/courses/faculty-assessment-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:309-338`
- Expected fix: Legacy gradePublished value and faculty status derived due need equivalent persisted resultsPublished+dueAt fields and release policy.

## G2-11-016-077 [P1] MISSING facet F23
- Files: src/app/(authenticated)/tpo/messages/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:39-45`
- Expected fix: Legacy Messages tab strip Recruiters/Team no longer exists in same route; implement or alias without duplicating messages.

## G2-11-025-044 [P1] MISSING facet F10
- Files: src/components/verification/TpoVerificationPanel.tsx
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:332-337`
- Expected fix: Legacy Act on selected → Send a message via bulkNudge to selected students; verify TPO page includes equivalent student outreach without hidden access.

## G2-11-025-047 [P1] GAP facet F11
- Files: src/components/verification/VerificationReviewDrawer.tsx
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:52-66`
- Expected fix: Sensitive document URL workflow: legacy getDocumentUrl(learnerId) only authorized by verification service; vNext document grants must scope exact learner membership and prevent raw object key leaks.

## G2-11-025-085 [P1] MISSING facet F23
- Files: src/components/verification/TpoVerificationPanel.tsx
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:332-337`
- Expected fix: Legacy Send a message bulk action is a separate user-facing verification action; not proven present in new TPO verification panel.

## G2-17-027-001 [P1] MISSING facet F01
- Files: src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:26-30`
- Expected fix: Legacy `/api/v1/discussion` is per lesson-content discussion; vNext GET delivery chat is a different resource. Lesson-content API still staged.

## G2-17-027-020 [P1] GAP facet F10
- Files: src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-85`
- Expected fix: Lesson-content post persists Discussion row with sequence; vNext create posts delivery message, not lesson-linked, changing isolation.

## G2-3-027-018 [P1] GAP facet F04
- Files: src/modules/courses/lesson-content-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:12-37`
- Expected fix: Legacy content DTO supports assignment deadline and `clearDeadline`, generic long points; vNext generic lesson-content writer excludes deadline and uses separate assignment writer.

## G2-3-027-042 [P1] GAP facet F10
- Files: src/modules/courses/lesson-content-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:287-323`
- Expected fix: Legacy learner fetch mixes generic/class content, admin fetch all; vNext shared/delivery filtering also requires published learning path and lesson visibility; reconcile intentional gates.

## G2-3-027-052 [P1] GAP facet F11
- Files: src/modules/courses/lesson-content-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-461`
- Expected fix: Legacy ordinary faculty cannot fetch colleagues' authored assignments, admin may; vNext content mutation guard is delivery/courses.manage, and exact authored-by listing parity must be tested.

## G2-3-027-061 [P1] GAP facet F14
- Files: src/modules/courses/lesson-video-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:646-663`
- Expected fix: Legacy supports signed playback URL by content ID but stored R2 URL remains publicly readable; vNext uses dedicated managed video assets/signed playback. Verify all legacy video/file item affordances.

## G2-3-027-086 [P1] MISSING facet F23
- Files: src/app/api/courses/lesson-contents/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-512`
- Expected fix: Legacy cross-course faculty/learner assignment listing absent in content route, may exist elsewhere; record route-by-route verification before deleting parity requirement.

## G2-3-025-001 [P1] GAP facet F01
- Files: src/app/api/courses/learner/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:23-43`
- Expected fix: Preserve a scoped student identifier or explicitly document that all learner reads now resolve the authenticated membership, including access-denied behavior.

## G2-3-025-026 [P1] MISSING facet F06
- Files: src/app/api/courses/learner/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:98-102`
- Expected fix: Implement authorized class-specific read equivalent where required by faculty/admin consumers; no classId in the learner API.

## G2-3-025-034 [P1] GAP facet F10
- Files: src/app/api/courses/learner/route.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/SemesterService.js:49-67`
- Expected fix: Legacy has GET byStudent, GET byStudent semesters and GET byClass; vNext exposes only GET /api/courses/learner (with server-side setup reads). Build/record 3-to-many endpoint mapping.


## Fast verification triage — chat-4
- OK (direct source inspection): none conclusively verified in this pass.
- DEFERRED (not validated or fixed; needs deeper parity review): G2-3-012-055, G2-3-006-018, G2-3-006-022, G2-3-006-031, G2-3-006-034, G2-3-006-037, G2-3-006-038, G2-3-006-039, G2-3-006-055, G2-3-006-058, G2-3-006-059, G2-11-016-077, G2-11-025-044, G2-11-025-047, G2-11-025-085, G2-17-027-001, G2-17-027-020, G2-3-027-018, G2-3-027-042, G2-3-027-052, G2-3-027-061, G2-3-027-086, G2-3-025-001, G2-3-025-026, G2-3-025-034.
- This is a triage disposition, not an assertion of feature parity. Deferred facets remain open for implementation and independent comparison.
