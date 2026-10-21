# Work packet: edit src/db/schema/assignment-submission-links.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/student-assignment.md

## G2-3-016-016  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:260-426`
- vNext now: `src/db/schema/assessments.ts:224-241`, `src/db/schema/assignment-submission-links.ts:5-15`
- Fix: Legacy submissionAssets supports many mixed WRITTEN_RESPONSE, repository/external LINK and FILE assets with per-asset receipt; vNext core submissionType enum requires one TEXT/LINK/FILE, extra link table supports links but primary write path inserts one mode. Finish mixed multi-part insert/read.

## G2-3-016-050  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:19-88`
- vNext now: `src/db/schema/assessments.ts:137-269`, `src/db/schema/assignment-submission-links.ts:5-15`
- Fix: Legacy student_assignment has assignment_name, lesson_content_id, student/faculty IDs, JSON assignment_contents/submission_assets, grading_date, html_content, submission_link, points max/obtained, graded flag, version, status, attempt, publication, semester. VNext normalized submission loses some direct snapshot fields; migration must account for them.

## G2-3-016-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:327-336`, `345-360`
- vNext now: `src/modules/courses/assignment-submission-service.ts:280-330`, `src/db/schema/assignment-submission-links.ts:12-15`
- Fix: Legacy duplicate submission item ID and invalid asset content errors, file upload requires upload_receipt_id and link http(s); vNext file receipt and link constraints differ. Add per-item validations with exact error messages.
