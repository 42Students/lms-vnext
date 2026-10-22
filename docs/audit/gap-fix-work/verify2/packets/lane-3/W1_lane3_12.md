# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-026-004 [P1] GAP facet F01
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: AssignmentController.java:201-214 GET `/fetchSubmissionsByLearnerId?learnerId=` returns learner-wide array.
- Expected fix: Provide authorized learner-wide history through existing aggregate route or explicit scoped equivalent.

## G2-2-026-007 [P1] GAP facet F01
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: AssignmentController.java:354-382 exposes additive descriptive-grading PATCH.
- Expected fix: Decide intentional removal; if needed add authorized additive points workflow respecting caps, versioning and audit.

## G2-2-026-039 [P1] MISSING facet F07
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: AssignmentServiceImpl.java:909-925 differentiates already-graded descriptive increment and max-points overflow.
- Expected fix: If descriptive grading retained, implement already-graded and overflow validation with exact messages.

## G2-2-026-050 [P1] MISSING facet F10
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: AssignmentController.java:354-382 PATCH `/addDescriptivePoints` adds points to score.
- Expected fix: Implement separate additive action if legacy descriptive marking remains required.

## G2-2-026-055 [P1] GAP facet F11
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: AssignmentController.java:101-140 allows assigned teacher/content author, prior grader, scoped admin or superadmin to grade.
- Expected fix: Confirm content owner and previous grader equivalence; grant only within verified tenant and delivery scope.

## G2-2-026-064 [P1] GAP facet F12
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: AssignmentServiceImpl.java:820-859 grade replaces points, resets published flag, writes previousPoints.
- Expected fix: Persist previousPoints on every regrade for parity and audit correctness.

## G2-2-026-065 [P1] GAP facet F12
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: AssignmentServiceImpl.java:901-949 permits descriptive addition only when not already auto/manual graded; guards long overflow.
- Expected fix: Decide whether learner descriptive sub-scores need additive flow; preserve overflow-safe arithmetic if restored.

## G2-2-026-071 [P1] GAP facet F14
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: SubmitAssignmentModal.jsx:403-449 saves repeated file/link assets and multiple receipt IDs.
- Expected fix: Support multiple receipts/files/links with ordered asset table and atomic verification.

## G2-2-026-084 [P1] GAP facet F19
- Files: src/modules/courses/assignment-submission-service.ts, src/modules/courses/faculty-assignment-submissions-model.ts
- Legacy: AssignmentController.java:183-198 caps unpaged result to 50 and explicit size to 100.
- Expected fix: Push pagination to SQL with scoped count/limit/offset for >10000 submissions.

## G2-2-033-002 [P1] GAP facet F01
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:28-48 GET with optional since
- Expected fix: Preserve incremental live-update semantics with bounded cursor or dedicated change feed.

## G2-2-033-016 [P1] GAP facet F04
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:68-78 incremental deleted rows omit confidential text
- Expected fix: Invalidate previously cached deleted rows during polling; ensure stale cards disappear on other sessions.

## G2-2-033-039 [P1] GAP facet F10
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-151 sets isDeleted true
- Expected fix: Decide audit/retention policy for erased messages and downstream sync tombstones.

## G2-2-033-045 [P1] GAP facet F12
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:64-78 deleted incremental content redacted
- Expected fix: Use privacy-safe tombstone IDs and support client deletion sync without redisclosing content.

## G2-2-033-070 [P1] GAP facet F20
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:64-78 deleted content redacted to ID when polling
- Expected fix: Protect privacy and stale-state consistency with tombstones or versioned refresh.

## G2-2-033-077 [P1] GAP facet F22
- Files: src/modules/courses/discussion-service.ts, src/db/schema/discussions.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-151 JPA isDeleted soft deletion
- Expected fix: Choose retention semantics and tombstone mechanism before migrating old deleted content.

## G2-2-033-081 [P1] GAP facet F23
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:28-48 supports since incremental with deleted tombstones
- Expected fix: Restore incremental update parity for other-client delete/pin events.

## G2-2-033-082 [P1] GAP facet F23
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-151 moderator/owner delete soft
- Expected fix: Obtain explicit data retention decision; preserve CAS concurrency improvement.

## G2-15-030-017 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: L:557-564 Ant table pageSize10 when >10, x=800
- Expected fix: Add bounded pagination, avoid 5000-row DOM.

## G2-18-016-060 [P1] GAP facet F23
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:554-590 complete-answer rules
- Expected fix: Restore validation contract or explicitly approve accepting unanswered questions and update copy

## G2-2-001-027 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LS:167-168 Keep the name under 100 characters
- Expected fix: Restore max 100, allow 1-character assignee, exact error.

## G2-2-003-022 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LR:42-49 offer/hired/cancelled/rescheduled intentionally not email/SMS
- Expected fix: Enforce negative event-channel policy to prevent cost/privacy regressions.

## G2-3-008-004 [P1] GAP facet F01
- Files: src/components/courses/admin-course-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:476-478`
- Expected fix: Legacy Course Name in college list links to `/college-admin/courses/{slugOrId}`, vNext course-name cell is plain text and requires other navigation. Restore name link to detail page.

## G2-3-008-019 [P1] GAP facet F04
- Files: src/components/courses/admin-course-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- Expected fix: Legacy visible flag uses active AND enabled and warns hidden cascades to lessons/quizzes/content; vNext single ACTIVE/ARCHIVED enum, may differ from legacy hide-without-delete.

## G2-3-008-027 [P1] GAP facet F06
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:52-60`
- Expected fix: Legacy short display name required max64, official code optional max40, new college code required max64 and shortTitle/officialCode hidden. Restore old field requirements.

## G2-3-008-028 [P1] GAP facet F06
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-70`
- Expected fix: Legacy introduction heading required <=255 and description required; vNext no heading and description optional <=5000.
