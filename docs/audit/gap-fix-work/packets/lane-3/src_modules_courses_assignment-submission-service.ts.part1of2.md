# Work packet: edit src/modules/courses/assignment-submission-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md, docs/audit/gap2/lane-13/course-submissions-modal.md, docs/audit/gap2/lane-17/grade-audit-log-entity.md, docs/audit/gap2/lane-2/assignment-controller.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-3/student-assignment.md

## G2-12-021-019  [P0] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:574-599 saves consumed receipt with student_assignment_id after submission
- vNext now: src/modules/courses/assignment-submission-service.ts:388-450 inserts file row, then CAS-updates receipt; staged FK requires consumed first
- Fix: Change transaction order to insert submission, atomically consume receipt, insert attested file row; verify composite FK

## G2-12-021-034  [P0] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AssignmentUploadReceiptRepository.java:20-28 atomic claim for Resource receipt guarded by expiry/owner/key
- vNext now: src/modules/courses/assignment-submission-service.ts:388-449 FILE insert precedes receipt claim; transaction may violate composite FK
- Fix: Reverse mutation order to satisfy staged composite FK and ensure rollback on second consumer

## G2-13-008-080  [P1] GAP  facet F22  effort L
- Legacy: Legacy studentAssignment numeric id, pointsObtained, graded and gradePublished (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:43-93`)
- vNext now: New UUID assignmentSubmissions.id, pointsAwarded, gradingStatus, gradePublished, version (`src/modules/courses/assignment-submission-service.ts:16-24`)
- Fix: Map persisted graded flags/grades and preserve historical submissions and publication visibility.

## G2-17-019-006  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1105 — Change is logged for grading and publication.
- vNext now: src/modules/courses/assignment-submission-service.ts:782-797 — Activity entry has summary but not complete immutable before/after grade record.
- Fix: Write event with before/after grade values in same transaction.

## G2-17-019-019  [P1] MISSING  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1105 — Saves grade audit row for every mutation.
- vNext now: src/modules/courses/assignment-submission-service.ts:780-798 — Records activity, not assignment_grade_events.
- Fix: Add immutable event row inside transaction for all grade writes.

## G2-17-019-020  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:741-748 — Publishing records before/after grade values.
- vNext now: src/modules/courses/assignment-submission-service.ts:866-880 — Publish activity event metadata includes gradePublished but no historical points snapshot.
- Fix: Persist complete publish-grade ledger snapshot.

## G2-17-019-035  [P1] MISSING  facet F20  effort M
- Legacy: docs/planning/database-parity-db06-history-contract.md:71-75 — Producer+event atomicity required at commit.
- vNext now: src/modules/courses/assignment-submission-service.ts:750-799 — Grade row/activity event transaction, immutable grade-event absent.
- Fix: Enforce deferred commit completeness and CAS version.

## G2-17-019-039  [P1] GAP  facet F22  effort M
- Legacy: docs/planning/database-parity-db06-history-contract.md:164-181 — Promotion requires coordinated DB producer cutover.
- vNext now: src/modules/courses/assignment-submission-service.ts:711-899 — Existing production mutation doesn't insert grade events.
- Fix: Release migration/producer atomically; test direct SQL mutation denied.

## G2-2-026-004  [P1] GAP  facet F01  effort M
- Legacy: AssignmentController.java:201-214 GET `/fetchSubmissionsByLearnerId?learnerId=` returns learner-wide array.
- vNext now: assignment-submission-service.ts:480-545 `getMyAssignmentSubmission` reads one assignment/delivery; no learnerId parameter in mapped route.
- Fix: Provide authorized learner-wide history through existing aggregate route or explicit scoped equivalent.

## G2-2-026-007  [P1] GAP  facet F01  effort M
- Legacy: AssignmentController.java:354-382 exposes additive descriptive-grading PATCH.
- vNext now: assignment-submission-service.ts:711-803 exposes replacement grade operation with `pointsAwarded`.
- Fix: Decide intentional removal; if needed add authorized additive points workflow respecting caps, versioning and audit.

## G2-2-026-039  [P1] MISSING  facet F07  effort M
- Legacy: AssignmentServiceImpl.java:909-925 differentiates already-graded descriptive increment and max-points overflow.
- vNext now: assignment-submission-service.ts:711-803 has no additive descriptive operation.
- Fix: If descriptive grading retained, implement already-graded and overflow validation with exact messages.

## G2-2-026-050  [P1] MISSING  facet F10  effort M
- Legacy: AssignmentController.java:354-382 PATCH `/addDescriptivePoints` adds points to score.
- vNext now: assignment-submission-service.ts:762-774 replaces score, not additive.
- Fix: Implement separate additive action if legacy descriptive marking remains required.

## G2-2-026-055  [P1] GAP  facet F11  effort M
- Legacy: AssignmentController.java:101-140 allows assigned teacher/content author, prior grader, scoped admin or superadmin to grade.
- vNext now: assignment-submission-service.ts:157-176 / :671-709 checks courses.manage or delivery mutation with persisted active teaching assignment.
- Fix: Confirm content owner and previous grader equivalence; grant only within verified tenant and delivery scope.

## G2-2-026-064  [P1] GAP  facet F12  effort M
- Legacy: AssignmentServiceImpl.java:820-859 grade replaces points, resets published flag, writes previousPoints.
- vNext now: assignment-submission-service.ts:762-770 resets published flag but does not set previousPoints in mapped update.
- Fix: Persist previousPoints on every regrade for parity and audit correctness.

## G2-2-026-065  [P1] GAP  facet F12  effort M
- Legacy: AssignmentServiceImpl.java:901-949 permits descriptive addition only when not already auto/manual graded; guards long overflow.
- vNext now: assignment-submission-service.ts:711-803 requires replacement grade, maxPoints.
- Fix: Decide whether learner descriptive sub-scores need additive flow; preserve overflow-safe arithmetic if restored.

## G2-2-026-071  [P1] GAP  facet F14  effort L
- Legacy: SubmitAssignmentModal.jsx:403-449 saves repeated file/link assets and multiple receipt IDs.
- vNext now: assignment-submission-service.ts:394-428 comments current FILE path accepts one receipt.
- Fix: Support multiple receipts/files/links with ordered asset table and atomic verification.

## G2-2-026-084  [P1] GAP  facet F19  effort M
- Legacy: AssignmentController.java:183-198 caps unpaged result to 50 and explicit size to 100.
- vNext now: assignment-submission-service.ts:602-651 reads all matched submissions then `faculty-assignment-submissions-model.ts:34-39` slices page size20 in memory.
- Fix: Push pagination to SQL with scoped count/limit/offset for >10000 submissions.

## G2-15-031-041  [P1] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:1-22`
- vNext now: `src/modules/courses/assignment-submission-service.ts:17-62`
- Fix: Legacy R2 presign files+links vs vNext upload grants/receipts and runtime flags.

## G2-15-031-061  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:66-86`
- vNext now: `src/modules/courses/assignment-submission-service.ts:17-62`
- Fix: Old content DTO submissions vs courseAssignments/submissions/file parts, migrate methods/grades.

## G2-3-016-024  [P1] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`
- vNext now: `src/components/courses/faculty-assignment-review.tsx:177-225`, `src/modules/courses/assignment-submission-service.ts:804-893`
- Fix: Legacy bulk `publish-grades` endpoint reports published/skippedUngraded/alreadyPublished/failed; vNext only per-submission publish in cited workflow. Add bulk publish confirm/results modal with per-row failures.
