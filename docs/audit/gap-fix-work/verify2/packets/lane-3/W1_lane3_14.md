# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-027-046 [P1] GAP facet F10
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/modules/courses/progress-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:747-789`
- Expected fix: Legacy progress completed can be supplied by learner; vNext timed media computes watched threshold, handles unknown duration, and binds membership/delivery. Specify exact parity policy.

## G2-3-016-024 [P1] MISSING facet F09
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/faculty-assignment-review.tsx, src/modules/courses/assignment-submission-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`
- Expected fix: Legacy bulk `publish-grades` endpoint reports published/skippedUngraded/alreadyPublished/failed; vNext only per-submission publish in cited workflow. Add bulk publish confirm/results modal with per-row failures.

## G2-3-016-029 [P1] MISSING facet F10
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`
- Expected fix: Legacy publish all grade action iterates independently, skips ungraded/already-published, returns counts and failures. VNext separate per-row API cannot reproduce bulk one-click semantics; add batch mutation with correct authorization.

## G2-3-016-038 [P1] GAP facet F14
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:32-45`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:430-474`
- Expected fix: Legacy multipart file uploads use FileDTO JSON and validated receipt per asset; vNext normalized assignmentSubmissionFiles with one receipt in current FILE path plus link table. Implement multi-file/mixed parts preserving receipt ownership and original name.

## G2-3-025-037 [P1] GAP facet F11
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/modules/courses/learner-course-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:42-43`
- Expected fix: Legacy principal can request an authorized learner ID; vNext requires an ACTIVE LEARNER college membership, so test delegated/scoped reads and legitimate faculty/admin class use.

## G2-3-025-038 [P1] GAP facet F11
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/modules/courses/learner-course-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:101-107`
- Expected fix: Legacy /byClass redacts detail and faculty email only when principal is learner; vNext instructor read requires learner, while faculty must use separate delivery endpoints.

## G2-3-025-042 [P1] GAP facet F12
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/modules/courses/learner-course-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:183-190`
- Expected fix: Legacy displays mapped active/not-deleted semester courses (and allowedForDisplay filter); vNext requires active offering/delivery/section enrollment, which can hide unmapped-by-delivery catalog entries.

## G2-3-005-020 [P1] GAP facet F06
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-quiz-create.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:348-380`
- Expected fix: Require future due date, 5-minute increments, past day restriction; new form accepts blank due.

## G2-3-005-025 [P1] GAP facet F06
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-quiz-create.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:206-223`
- Expected fix: Restore beforeunload/route-change dirty guard to prevent lost quiz edits.

## G2-3-005-035 [P1] GAP facet F10
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/app/api/courses/quizzes/route.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:3-36`
- Expected fix: Legacy create can publish immediately; new create is draft + separate transition, alters workflow and UI notifications.

## G2-3-005-040 [P1] GAP facet F12
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:442-473`
- Expected fix: Result release gate depends on deadline and published status; verify boundaries CLOSED, DRAFT and exactly due instant.

## G2-3-005-041 [P1] GAP facet F12
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-quiz-create.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:352-390`
- Expected fix: After attempts, lock deadline/attempt limit/questions/randomization; allow only title and description corrections.

## G2-3-005-058 [P1] GAP facet F22
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/modules/courses/quiz-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:17-28`
- Expected fix: Legacy description max 5000 vs new 10000; also creation required date UI vs nullable service payload.

## G2-3-004-017 [P1] GAP facet F06
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-quiz-create.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:554-560`
- Expected fix: Legacy opens modal builder, has publish-now and date required; vNext inline creator defaults draft and optional date. Restore authoring parity for Super Admin.

## G2-3-022-048 [P1] MISSING facet F23
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:65-74`, `147-157`
- Expected fix: Legacy about(kind,key) contextual conversations, search across team, mentions and global asks are not fully reproduced by standalone private pairs; prioritize context thread and rollup parity.

## G2-4-004-015 [P1] MISSING facet F03
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Builder has `Upload from Drive` and attachment add picker. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- Expected fix: Add legacy resource picker (PDF/file/HTTPS link) and Google Drive import in assignment builder.

## G2-4-004-030 [P1] GAP facet F06
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Builder modal create defaults points 0, audience ALL, submit method WRITTEN_RESPONSE. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- Expected fix: Use legacy initial points=0 and written-response-only method unless changed by owner.

## G2-4-004-031 [P1] GAP facet F06
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-create.tsx, src/components/courses/college-assignment-actions.tsx
- Legacy: Title field max 255 characters, input placeholder `e.g., Module 1 Project`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- Expected fix: Allow 255-character title as in legacy and reproduce placeholder.

## G2-4-004-032 [P1] GAP facet F06
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Points InputNumber min 0 (zero allowed) with `Enter points` required validation. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363`)
- Expected fix: Decide zero-point assignment support; restore 0 lower bound and backend check if parity required.

## G2-4-004-036 [P1] GAP facet F06
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-actions.tsx
- Legacy: Legacy edit fetches full content record/version and includes resources/submission settings. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:90-135; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-218`)
- Expected fix: Add resource editor and version-aware edit parity while preserving vNext concurrency checks.

## G2-4-004-037 [P1] MISSING facet F06
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-create.tsx, src/db/schema/course-assignment-materials.ts
- Legacy: Legacy resources support PDF/file/link, resource title, optional uploaded file and Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- Expected fix: Integrate file/link/Drive resources with existing signed storage API and persistence.

## G2-4-004-042 [P1] MISSING facet F07
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Legacy upload error `Select a PDF file.` for invalid .pdf MIME/name. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-169`)
- Expected fix: Restore PDF validation and exact inline/server error behavior.

## G2-4-004-052 [P1] GAP facet F10
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-create.tsx, src/components/courses/college-assignment-actions.tsx
- Legacy: Legacy creates/edits POST `/api/v1/admin/assignments/content/save` with content_data_dto and resources, edits include lesson_content_id. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-235; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java:44-60`)
- Expected fix: Port all authoring payload fields/materials and protect edits with optimistic version.

## G2-4-004-054 [P1] GAP facet F10
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Legacy bulk POST `/api/v1/admin/assignments/{id}/publish-grades` performs server-side partial commits and one bulk audit entry. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- Expected fix: Provide server-side atomic-scope partial publishing endpoint with bulk audit and retry receipt; avoid client interruption.

## G2-4-004-055 [P1] GAP facet F10
- Verification: DEFERRED — requires cross-file parity validation; no unverified OK claim.
- Files: src/components/courses/college-assignment-actions.tsx
- Legacy: Legacy delete invokes `deleteLessonContent(id)` and confirms existing submissions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:316-327; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:373-378`)
- Expected fix: Match deletion semantics, archival visibility and restrictions, particularly for submissions already present.
