# Work packet (wave 2): edit src/modules/courses/assignment-submission-service.ts

31 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/grade-audit-log-entity.md, docs/audit/gap2/lane-2/assignment-controller.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-3/student-assignment.md, docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md

## G2-17-019-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/GradeAuditLogRepository.java:10-11 — History reachable via repository findByStudentAssignmentId.
- vNext now: src/modules/courses/assignment-submission-service.ts:711-799 — Grade method emits generic activity event, not history API.
- Fix: Expose per-submission authenticated audit history.

## G2-17-019-021  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1070-1080 — Publishes grade notification to learner.
- vNext now: src/modules/courses/assignment-submission-service.ts:880-892 — Enqueues learner in-app notice tied to publication event.
- Fix: Compare email/in-app channels and notification copy.

## G2-2-026-015  [P2] GAP  facet F04  effort M
- Legacy: StudentAssignment.java:19-49 persists assignmentName, names, facultyId, file DTO, html, link, points, graded flag.
- vNext now: assessments.ts:137-201 stores assignment/membership foreign keys, typed text/url, score and publication; names joined at read in `assignment-submission-service.ts:602-642`.
- Fix: Map display names and assignment snapshots; assess downstream expectations of renamed fields.

## G2-2-026-031  [P2] GAP  facet F06  effort S
- Legacy: viewSubmissionsModal.jsx:465-486 grade number min 0 max assignment points else 1000, step 1.
- vNext now: assignment-validation.ts:148-165 requires whole points 0..10000 + expectedVersion; `assignment-submission-service.ts:742-746` caps to stored max.
- Fix: Replace fallback 1000 with persisted maxPoints; maintain integer entry and precise cap message.

## G2-2-026-058  [P2] GAP  facet F11  effort M
- Legacy: AssignmentServiceImpl.java:647-675 filters faculty learner-wide responses by teaching/content authorization.
- vNext now: assignment-submission-service.ts:549-656 lists a specific scoped assignment and delivery.
- Fix: Add a teacher-scoped cross-assignment learner history if parity requires learnerId workflow.

## G2-2-026-060  [P2] GAP  facet F12  effort M
- Legacy: AssignmentServiceImpl.java:520-550 explicitly evaluates legacy offsetless deadline in Asia/Kolkata.
- vNext now: assignment-submission-service.ts:225-235 uses Date object stored timestamptz; `faculty-assignment-review.tsx:46-56` formats en-IN Asia/Kolkata.
- Fix: Audit conversion of old offsetless due_date to true IST instant before import.

## G2-2-026-073  [P2] GAP  facet F15  effort M
- Legacy: AssignmentServiceImpl.java:594-599 calls `sendAssignmentSubmittedNotification(saved)`.
- vNext now: assignment-submission-service.ts:353-373 records activity event and in-app `Assignment submitted` notice in transaction.
- Fix: Compare recipients/channels/template and timing; preserve no-leak notification if restored.

## G2-2-026-086  [P2] GAP  facet F19  effort M
- Legacy: AssignmentController.java:171-199 accepts optional paging parameters in one round trip.
- vNext now: assignment-submission-service.ts:549-651 joins member+users and sorts SQL before in-memory filtering.
- Fix: Avoid loading full lesson roster when only one page/filter is displayed.

## G2-2-026-091  [P2] GAP  facet F20  effort M
- Legacy: AssignmentServiceImpl.java:923-929 checks `max - awarded` before addition to avoid long overflow.
- vNext now: assignment-submission-service.ts:742-746 uses finite integer bounded replacement score.
- Fix: For any additive grading restore subtraction-before-addition overflow check.

## G2-2-026-092  [P2] GAP  facet F21  effort M
- Legacy: SubmitAssignmentModal.jsx:1-3 uses `uploadFileViaPresign` to R2 and `UploadFromLinkButton` Google Drive import.
- vNext now: assignment-submission-service.ts:203-210 / :281-326 uses private upload receipts with object attestation.
- Fix: Record storage provider and Drive import parity decision; preserve signed/private access.

## G2-2-026-100  [P2] GAP  facet F22  effort M
- Legacy: AssignmentServiceImpl.java:562-599 persists assignment snapshot points and first/last name.
- vNext now: assessments.ts:137-201 stores current assignment reference and member reference; `assignment-submission-service.ts:611-640` reads live user display name.
- Fix: Clarify historical snapshot policy for renamed learners/edited max scores.

## G2-15-031-017  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:21-22`
- vNext now: `src/modules/courses/assignment-submission-service.ts:17-62`
- Fix: Legacy 50 MiB PDF/file presign + link methods vs vNext guarded receipt/multipart.

## G2-15-031-029  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:1-2`
- vNext now: `src/modules/courses/assignment-submission-service.ts:105-145`
- Fix: Legacy submitAssignment/saveContentProgress vs typed parts and upload receipts.

## G2-15-031-044  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:77-84`
- vNext now: `src/modules/courses/assignment-submission-service.ts:9-62`
- Fix: Legacy grade display flags vs new published grade notice event recipients/timing.

## G2-15-031-058  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:1-2`
- vNext now: `src/modules/courses/assignment-submission-service.ts:17-62`
- Fix: Old R2 presign upload service vs new signed grants and receipts.

## G2-3-016-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:14-19`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:553-568`
- vNext now: `src/db/schema/assessments.ts:137-155`, `src/modules/courses/assignment-submission-service.ts:179-216`
- Fix: Legacy student_assignment rows keyed to lesson_content_id and learner numeric student_id, vNext assignment_submissions keyed assignment UUID, delivery UUID, membership UUID. Map learner assignment route and archived content references.

## G2-3-016-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:26-29`, `35-51`
- vNext now: `src/db/schema/assessments.ts:160-187`, `src/modules/courses/assignment-submission-service.ts:603-636`
- Fix: Legacy stored student first/last names, gradingDate string and graded 0/1; vNext derives learnerDisplayName and gradedAt timestamp/gradingStatus enum. Match full name display and empty placeholder.

## G2-3-016-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:47-51`, `60-82`
- vNext now: `src/components/courses/faculty-assignment-review.tsx:72-88`, `src/modules/courses/assignment-submission-service.ts:79-102`
- Fix: Legacy independent numeric graded flag and explicit publication bit; vNext gradingStatus and gradePublished determine badge/action. Map labels `Not graded`, `Graded`, `Published` exactly.

## G2-3-016-012  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:627-640`, `678-694`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:3-39`, `src/modules/courses/assignment-submission-service.ts:603-670`
- Fix: Legacy list submissions by lesson content and per learner createdAt DESC pageable, vNext standard read sorts submittedAt ASC and faculty report later can sort NEWEST/OLDEST; align default sort and page count.

## G2-3-016-015  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/StudentAssignmentDTO.java:13-29`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:553-568`
- vNext now: `src/modules/courses/assignment-submission-service.ts:179-216`, `336-350`
- Fix: Legacy submit uses studentId+lessonContentId, optional html/link/file and server-stamped semesterNumber; vNext uses assignmentId/deliveryId and authenticated membership, strict typed TEXT/LINK/FILE. Map form fields and multipart input.

## G2-3-016-026  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:553-599`
- vNext now: `src/modules/courses/assignment-submission-service.ts:336-371`
- Fix: Legacy submitted row stores assignmentName, student names, points and JSON asset fields; vNext writes normalized submission plus in-app receipt. Build compatibility read projection/migration.

## G2-3-016-027  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:822-858`
- vNext now: `src/modules/courses/assignment-submission-service.ts:760-799`
- Fix: Legacy grading saves old points and version plus separate GradeAuditLog, vNext updates pointsAwarded/gradedAt/version but previousPoints is not set in shown grade write. Set previousPoints atomically and preserve auditable prior grade.

## G2-3-016-032  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:728-734`
- vNext now: `src/modules/courses/assignment-submission-service.ts:844-859`
- Fix: Legacy anti-spoof publish actor compares passed facultyId to principal unless admin; vNext derives actor from context with no client facultyId. Keep this security improvement, update UI contract.

## G2-3-016-035  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:827-843`
- vNext now: `src/db/schema/assessments.ts:247-267`, `src/modules/courses/assignment-submission-service.ts:742-769`
- Fix: Legacy grade max bound is stored StudentAssignment.points, vNext compares to parent maxPoints; if changed after submission, old grade could become invalid. Snapshot maximum points at submission.

## G2-3-016-036  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:563-568`
- vNext now: `src/modules/courses/assignment-submission-service.ts:472-474`
- Fix: Legacy duplicate submission throws `Already submitted for this assignment`; vNext typed ASSIGNMENT_ALREADY_SUBMITTED. Match exact frontend alert/toast wording.

## G2-3-016-037  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:723-736`
- vNext now: `src/modules/courses/assignment-submission-service.ts:817-839`
- Fix: Legacy missing submission `Submission not found`, ungraded `Cannot publish grade: submission has not been graded yet`; vNext typed errors. Add exact visible error mapping.

## G2-3-016-040  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:598-599`, `749-750`
- vNext now: `src/modules/courses/assignment-submission-service.ts:352-371`, `866-894`
- Fix: Legacy send submit and grade-published notifications; vNext in-app notices generated in same transaction. Confirm learner template body and exact routing against old screenshot.

## G2-3-016-043  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:564-568`, `722-736`, `827-858`
- vNext now: `src/components/courses/faculty-assignment-review.tsx:114-116`, `src/modules/courses/assignment-submission-service.ts:472-474`
- Fix: Legacy messages Already submitted for this assignment, Submission not found, Points obtained cannot be negative, Cannot publish grade; vNext uses error codes and regrade prompt. Match visible strings.

## G2-3-016-044  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:627-640`
- vNext now: `src/modules/courses/faculty-assignment-submissions-model.ts:23-39`, `src/modules/courses/assignment-submission-service.ts:603-670`
- Fix: Legacy supports Pageable and roster-backed totals, vNext listAssignmentSubmissions loads all then filters/sorts in memory and slices 20. Add SQL-level page/count for large classes.

## G2-3-016-048  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:598-599`, `749-750`
- vNext now: `src/modules/courses/assignment-submission-service.ts:352-371`, `866-894`
- Fix: Legacy notifier fires submission/publish events via service; vNext inserts activity and in-app notifications transactionally. Ensure after-commit delivery semantics and de-dupe.

## G2-12-021-028  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:594-598 sendsAssignmentSubmittedNotification after save
- vNext now: src/modules/courses/assignment-submission-service.ts:359-371 creates activity/inAppNotifications within transaction
- Fix: Compare recipients/event/template channels and preserve legacy submission alert delivery
