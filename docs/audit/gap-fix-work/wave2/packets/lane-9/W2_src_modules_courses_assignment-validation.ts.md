# Work packet (wave 2): edit src/modules/courses/assignment-validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-submissions-modal.md, docs/audit/gap2/lane-2/assignment-controller.md

## G2-13-008-077  [P2] GAP  facet F20  effort S
- Legacy: Legacy grade max assignment points with fallback 1000 (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:465-468`)
- vNext now: New maxPoints passed and Zod absolute max10000 (`src/modules/courses/assignment-validation.ts:148-165`)
- Fix: Test missing/zero maximum points; avoid invalid zero max with published grades.

## G2-2-026-016  [P2] GAP  facet F04  effort M
- Legacy: StudentAssignmentDTO.java:12-28 uses snake_case `lesson_content_id,html_content,file_dto,submission_assets`.
- vNext now: assignment-validation.ts:108-143 uses camelCase `deliveryId,textContent,submissionUrl`, discriminated union.
- Fix: Add explicit protocol translation and preserve multipart asset metadata.

## G2-2-026-031  [P2] GAP  facet F06  effort S
- Legacy: viewSubmissionsModal.jsx:465-486 grade number min 0 max assignment points else 1000, step 1.
- vNext now: assignment-validation.ts:148-165 requires whole points 0..10000 + expectedVersion; `assignment-submission-service.ts:742-746` caps to stored max.
- Fix: Replace fallback 1000 with persisted maxPoints; maintain integer entry and precise cap message.
