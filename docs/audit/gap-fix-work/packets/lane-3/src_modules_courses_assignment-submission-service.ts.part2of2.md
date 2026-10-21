# Work packet: edit src/modules/courses/assignment-submission-service.ts (part 2 of 2)

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/student-assignment.md, docs/audit/gap2/lane-5/l17-u019-grade-audit-log.md, docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md, docs/audit/gap2/lane-2/assignment-controller.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md

## G2-3-016-029  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`
- vNext now: `src/modules/courses/assignment-submission-service.ts:804-893`
- Fix: Legacy publish all grade action iterates independently, skips ungraded/already-published, returns counts and failures. VNext separate per-row API cannot reproduce bulk one-click semantics; add batch mutation with correct authorization.

## G2-3-016-038  [P1] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:32-45`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:430-474`
- vNext now: `src/modules/courses/assignment-submission-service.ts:280-330`, `373-410`
- Fix: Legacy multipart file uploads use FileDTO JSON and validated receipt per asset; vNext normalized assignmentSubmissionFiles with one receipt in current FILE path plus link table. Implement multi-file/mixed parts preserving receipt ownership and original name.

## G2-17-019-047  [P1] GAP  facet F23  effort M
- Legacy: Legacy activity row best-effort despite potential missing audit. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1107`
- vNext now: vNext generic activity atomic but does not record before/after private score. `src/modules/courses/assignment-submission-service.ts:782-801`
- Fix: Keep generic feed private and add separate complete grade ledger.

## G2-12-021-012  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:318-371 submissionAssets supports multiple files, text, repository links
- vNext now: src/modules/courses/assignment-submission-service.ts:205-211 prepares one FILE receipt only
- Fix: Allow mixed file/text/link submission assets, retaining per-asset type/label

## G2-12-021-017  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:429-451 loops every file asset, rejects duplicate receipt IDs
- vNext now: src/modules/courses/assignment-submission-service.ts:205-211,388-397 handles one receipt and sequence 0
- Fix: Consume one distinct receipt per file in the same submission transaction

## G2-12-021-027  [P1] GAP  facet F14  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:429-451 accepts multiple file receipts
- vNext now: src/db/schema/course-upload-receipts-staged.ts:84-104 normalized per-file rows support sequences though src/modules/courses/assignment-submission-service.ts:388-397 only writes 0
- Fix: Enable multi-file producer and UI on already normalized relation

## G2-2-026-033  [P2] GAP  facet F07  effort M
- Legacy: AssignmentServiceImpl.java:501-517 errors on non-assignment, deleted, inactive, missing or expired deadlines.
- vNext now: assignment-submission-service.ts:111-137 / 218-236 checks published status; `assignment-submission-deadline-policy.ts` separately enforces due date.
- Fix: Document exact error matrix and distinguish deadline-unset, expired, hidden and unpublished cases.

## G2-2-026-035  [P2] GAP  facet F07  effort M
- Legacy: AssignmentServiceImpl.java:465-492 has distinct expired/used/mismatch/owner/object-size upload errors.
- vNext now: assignment-submission-service.ts:281-326 returns generic `ASSIGNMENT_UPLOAD_RECEIPT_INVALID` for several cases.
- Fix: Retain no-leak receipt validation while distinguishing safe actionable client errors.

## G2-2-026-037  [P2] GAP  facet F07  effort S
- Legacy: AssignmentController.java:299-310 `Only faculty or admin can publish grades`; ungraded publish rejects with detailed message.
- vNext now: assignment-submission-service.ts:826-833 rejects with `ASSIGNMENT_NOT_GRADED`.
- Fix: Provide legacy readable rejection copy and current retry action without leaking data.

## G2-15-031-023  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:59-64`
- vNext now: `src/modules/courses/assignment-submission-service.ts:105-145`
- Fix: Legacy submission modal callback and toast vs new stored typed submission and refresh.

## G2-3-016-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:318-426`
- vNext now: `src/modules/courses/assignment-submission-service.ts:228-244`, `280-330`
- Fix: Legacy exact error `Assignment submission requires content in one of the allowed submission methods.` and `Submission type is not allowed for this assignment.`; vNext uses typed CoursesServiceError codes. Map user-visible copy.

## G2-3-016-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:327-336`, `345-360`
- vNext now: `src/modules/courses/assignment-submission-service.ts:280-330`, `src/db/schema/assignment-submission-links.ts:12-15`
- Fix: Legacy duplicate submission item ID and invalid asset content errors, file upload requires upload_receipt_id and link http(s); vNext file receipt and link constraints differ. Add per-item validations with exact error messages.

## G2-3-016-021  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:822-858`
- vNext now: `src/modules/courses/assignment-submission-service.ts:737-779`, `src/components/courses/faculty-assignment-review.tsx:114-116`
- Fix: Legacy points negative/max and conflict exact messages, vNext grade guards use GRADE_INVALID/NO_CHANGE/STALE and regrade feedback 8 chars. Match errors, retain stronger regrade explanation.

## G2-3-016-022  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:598-599`
- vNext now: `src/modules/courses/assignment-submission-service.ts:352-371`
- Fix: Legacy submission notification sent after persistence via legacy service, vNext adds in-app notice `Assignment submitted` and body. Confirm exact legacy notification wording and timing, preserve no duplicate receipts.

## G2-3-016-023  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:741-750`
- vNext now: `src/modules/courses/assignment-submission-service.ts:866-894`
- Fix: Legacy published-grade notification comes from publishGrade, vNext inserts inAppNotification on publication. Compare title/action destination and privacy.

## G2-2-026-042  [P3] GAP  facet F08  effort S
- Legacy: AssignmentController.java:307-308 returns `Grade published` response text.
- vNext now: assignment-submission-service.ts:870-896 writes grade publication activity + notification; route publish returns `{submission}`.
- Fix: Show `Grade published` confirmation in faculty operation feedback or document new copy.
