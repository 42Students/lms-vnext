# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-001-044 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy `Audit trail — <name>` modal width 800 `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1719-1729`
- Expected fix: Restore row audit trigger and selected-student scoped audit history dialog/link.

## G2-19-010-037 [P1] GAP facet F10
- Files: src/modules/messaging/tpo-campaign-dispatch-service.ts
- Legacy: Legacy writes recipient rows SENT/FAILED/NO_EMAIL/NOT_CONFIGURED/UNSUBSCRIBED/NOT_FOUND `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:68-110`
- Expected fix: Create a status translation table and preserve historical skipped reason visibility.

## G2-19-010-061 [P1] GAP facet F19
- Files: src/modules/messaging/tpo-campaign-dispatch-service.ts
- Legacy: Legacy loops recipients within one synchronous transactional request max500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:50-67` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:93-113`
- Expected fix: Measure request timeout for 500 recipients; queue/resume with at-most-once guarantee if needed.

## G2-2-006-055 [P1] MISSING facet F21
- Files: (none, new feature)
- Legacy: LS:18,105-149 R2StorageUtils HEAD metadata verification, fails 503 on outage
- Expected fix: Wire vNext attested R2 upload lifecycle and safe retries.

## G2-2-009-039 [P1] MISSING facet F13
- Files: (none, new feature)
- Legacy: LF:241-245 skeleton, error Retry record disables corrections
- Expected fix: Add detail fetch skeleton/error and hard-disable correction until verified.

## G2-2-012-017 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LC:174 at-risk ORDER lowest attendance ratio then held DESC
- Expected fix: Compute marked sessions per learner INCLUDING implicit PRESENT, then sort lowest percent.

## G2-2-014-024 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: LC:118-128 null flags preserve untouched fields, metadata safe
- Expected fix: Restore partial per-course active/enabled/allow-display update semantics.

## G2-2-015-052 [P1] GAP facet F19
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: legacy fetch all classes/courses then individual per-pair progress; local refresh (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:77-95,136-164`)
- Expected fix: Surface truncation of class choices as well as learner rows; avoid silently hiding valid classes

## G2-2-015-077 [P1] GAP facet F12
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: Only quizzes with PUBLISHED, active, enabled and undeleted enter denominator `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:68-72`
- Expected fix: Define CLOSED-course quiz denominator parity and exclude unless old behavior intentionally changed

## G2-2-015-079 [P1] GAP facet F12
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: Legacy video, assignments, quizzes each clamped to current denominator before percent `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:188-195`
- Expected fix: Clamp all three done counters to denominators and keep percentage within 0–100

## G2-2-015-080 [P1] GAP facet F12
- Files: src/modules/courses/college-learner-progress-service.ts, src/components/courses/college-learner-progress-report.tsx
- Legacy: Legacy zero measurable items returns null average and no learners, with precise explanatory message `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-161`
- Expected fix: Use no-measure value, display note rather than 0% for no-work course

## G2-2-015-096 [P1] GAP facet F23
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: Legacy no-work reports null average with explicit reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-161`
- Expected fix: Document and restore dropped guard; a dashboard must not claim 0% where no work exists

## G2-2-017-028 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: List all nondeleted course content IDs, find maximum current attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:92-100`
- Expected fix: Build delivery-aware valid set and current attempt lookup

## G2-2-017-059 [P1] GAP facet F22
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: Admin counts only latest attempt if completed `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:89-99`
- Expected fix: Rank latest attempt first, then filter completed

## G2-2-018-007 [P1] GAP facet F03
- Files: src/components/courses/super-admin-lesson-bulk-visibility.tsx
- Legacy: Lessons.js:499-502 hides when loadError; pending spinner on both controls
- Expected fix: Disable bulk edits whenever underlying list is known incomplete or stale.

## G2-2-018-018 [P1] GAP facet F06
- Files: src/components/courses/super-admin-lesson-bulk-visibility.tsx
- Legacy: Lessons.js:499-502 bulk buttons set both active and enabled true/false
- Expected fix: Make bulk Show/Hide update lesson's own visibility/status, not content visibility.

## G2-2-018-027 [P1] GAP facet F08
- Files: src/components/courses/super-admin-lesson-bulk-visibility.tsx
- Legacy: Lessons.js:362-364 partial `N of M updated. Retry will target only the failed lessons.`
- Expected fix: Restore partial update notice and failed-only retry.

## G2-2-023-004 [P1] MISSING facet F01
- Files: src/modules/organizations/service.ts, src/modules/colleges/service.ts
- Legacy: AdminRecycleBinController.java:232-285 POST /restore with entityType/id/collegeId
- Expected fix: Add generic restore dispatcher guarded by entity type.

## G2-2-026-005 [P1] GAP facet F01
- Files: src/modules/courses/faculty-submission-review-service.ts
- Legacy: AssignmentController.java:216-268 offers `/submissionStats` and `/submissionStats/bulk`.
- Expected fix: Add roster-aware single/bulk statistics service with same authorized counts and missing-student IDs.

## G2-2-026-009 [P1] GAP facet F02
- Files: src/components/courses/assignment-submission-control.tsx
- Legacy: SubmitAssignmentModal.jsx:207-253 displays eligible written response, PDF, file, repository, external link sections simultaneously.
- Expected fix: Restore simultaneous multi-method authoring and dynamic repeated asset sections where eligible.

## G2-2-026-017 [P1] GAP facet F04
- Files: src/modules/courses/faculty-submission-review-service.ts
- Legacy: SubmissionStatsDTO.java:9-15 includes totalStudents,totalSubmitted,totalGraded,notGraded,notSubmitted and 2 student-ID lists.
- Expected fix: Compute all roster-derived stats including both absent ID sets with tenant authorization.

## G2-2-026-027 [P1] GAP facet F06
- Files: src/modules/courses/assignment-validation.ts
- Legacy: AssignmentServiceImpl.java:315-372 permits an array of mixed submission assets and enforces distinct asset IDs.
- Expected fix: Implement complete mixed submissionParts payload and duplicate asset ID checks at service boundary.

## G2-2-026-052 [P1] GAP facet F10
- Files: src/modules/courses/faculty-submission-review-service.ts
- Legacy: AssignmentServiceImpl.java:754-817 computes roster-based submission stats and missing learner IDs.
- Expected fix: Create roster join for not-submitted counts and IDs with scoped delivery audience.

## G2-2-035-001 [P1] GAP facet F01
- Files: src/modules/courses/learner-playback-settings.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:34-46 GET /api/v1/client-settings accessible signed-in roles
- Expected fix: Expose safe authenticated GET `/api/client-settings` or migrate every reader to server-injected props.

## G2-2-035-030 [P1] GAP facet F12
- Files: src/modules/courses/learner-playback-settings.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:52 progress save default15000 floor5000
- Expected fix: Align default frequency (15 sec vs 5 sec) to avoid 3x client writes at 10k users.

## Lane chat-2 fast verification disposition (2026-10-22)

- OK (source inspected): G2-19-010-037 legacy status translation and skip reasons; G2-2-015-052 explicit choice truncation; G2-2-015-077 imported quiz flags filtered; G2-2-015-079 denominator clamping; G2-2-015-080 and G2-2-015-096 no-work/null average; G2-2-017-059 latest attempt before completion; G2-2-035-030 legacy 15-second save default.
- DEFERRED (requires source/route/security or integration-level verification, not asserted OK): G2-19-001-044, G2-19-010-061, G2-2-006-055, G2-2-009-039, G2-2-012-017, G2-2-014-024, G2-2-017-028, G2-2-018-007, G2-2-018-018, G2-2-018-027, G2-2-023-004, G2-2-026-005, G2-2-026-009, G2-2-026-017, G2-2-026-027, G2-2-026-052, G2-2-035-001. These are not verified complete; handle through a dedicated implementation review.
