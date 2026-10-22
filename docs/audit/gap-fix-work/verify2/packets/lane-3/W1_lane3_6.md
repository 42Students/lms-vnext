# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-008-016 [P1] GAP facet F04
- Files: src/components/courses/learner-course-workspace.tsx
- Legacy: Legacy uses courseId+classId for quiz filtering and lessonId, merges quiz list (syllabusDetail.js:451-466)
- Expected fix: Provide legacy course/class quiz-to-lesson mapping including authored per-class order

## G2-15-008-025 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy content fetch errors `Lesson content could not be loaded`, server detail, Retry (syllabusDetail.js:360-367,473-478)
- Expected fix: Add route-boundary per-lesson Retry with exact message and safe server error text

## G2-15-008-064 [P1] GAP facet F22
- Files: src/components/courses/learner-course-workspace.tsx
- Legacy: Legacy numeric LessonId/courseId/classId, contentType string aliases, lesson content progress map keyed content ID (syllabusDetail.js:54-76,143-149,451-470,494-515)
- Expected fix: Write migration crosswalk and reference integrity proof for authored ordering and completion

## G2-15-008-068 [P1] GAP facet F23
- Files: src/components/courses/learner-course-workspace.tsx
- Legacy: Legacy unknown/completion errors fail visible with Retry while preserving content (syllabusDetail.js:338-367,473-478)
- Expected fix: Add failure-specific error boundary, completeness warning and unsupported content card

## G2-16-003-056 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: `[issueId].js:203-224`: all screenshot previews loaded by URLs returned with attachment API.
- Expected fix: Return short-lived signed GET URLs only with authorization, not public object keys.

## G2-16-008-017 [P1] GAP facet F05
- Files: src/modules/courses/learner-course-service.ts
- Legacy: `syllabus.js:258-283,842-849`: sortLessonContents tier comparator accommodates heterogeneous sequence/date metadata.
- Expected fix: Verify mixed-kind ordering against legacy sort tier (sequence/date) and adjust tie-breaker/priority.

## G2-16-008-028 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: `syllabus.js:903-908`: learner missing class shows Book icon, `Not assigned to a class` with admin instruction.
- Expected fix: Render class-not-assigned state with guidance for permitted learner.

## G2-16-008-036 [P1] GAP facet F09
- Files: src/components/courses/learner-course-workspace.tsx
- Legacy: `syllabus.js:580-589`: close content triggers progress quiz and assignment reload.
- Expected fix: Refresh course metrics/progress on modal close after quiz/assignment/video completion.

## G2-16-008-040 [P1] GAP facet F10
- Files: src/modules/courses/learner-course-service.ts
- Legacy: `syllabus.js:698-714`: quiz list updates after key bump on dialog close.
- Expected fix: Trigger router.refresh after assessment outcome and dialog close.

## G2-16-008-044 [P1] GAP facet F12
- Files: src/components/courses/learner-course-workspace.tsx
- Legacy: `syllabus.js:1057-1107`: past-due unsubmitted assignment `Not submitted`, remains reviewable.
- Expected fix: Restore `Not submitted` row label and review path even after submission closes.

## G2-16-008-065 [P1] GAP facet F20
- Files: src/components/courses/learner-course-workspace.tsx
- Legacy: `syllabus.js:769-827`: deepLinkKeyRef prevents reopening same modal after re-fetch.
- Expected fix: Consume focus once per URL and respect user-closed dialog after route refresh.

## G2-16-008-071 [P1] GAP facet F22
- Files: src/modules/courses/learner-course-service.ts
- Legacy: `syllabus.js:258-283`: sorting based on legacy content sort candidates and tier.
- Expected fix: Align sequence fallback for content with no explicit order and mixed migration data.

## G2-16-016-010 [P1] GAP facet F06
- Files: src/modules/courses/quiz-validation.ts
- Legacy: QuizQuestionRequestDTO.java:17-31 type ≤30, prompt 1-5000, points1-100, sequence≥0, options 1-20.
- Expected fix: Align points max100 and one-option legacy acceptance only if still valid; document intentional stricter minimum two.

## G2-16-016-014 [P1] GAP facet F07
- Files: src/modules/courses/quiz-validation.ts
- Legacy: QuizQuestionRequestDTO.java:23-25 @Max(100) points.
- Expected fix: Reduce allowed per-question points to100 or document approved scoring change.

## G2-16-028-001 [P1] MISSING facet F01
- Files: src/modules/admin-ui/legacy-superadmin-destination-model.ts, src/app/(authenticated)/superadmin/[...legacy]/page.tsx
- Legacy: resources.js:19-26 and SuperAdminWorkspaceShell.jsx:8-29 serve `/superadmin/projects/workspaces/[workspaceId]/resources` with Resources tab and workspace breadcrumb.
- Expected fix: Map nested legacy workspace resource paths to `/admin/projects/:id/resources` with secure ID translation; preserve `from` breadcrumb.

## G2-16-028-052 [P1] MISSING facet F23
- Files: src/modules/admin-ui/legacy-superadmin-destination-model.ts
- Legacy: legacy superadmin nested URL exists at resources.js:19-26, but generic redirect VDEST:22-35 refuses nested paths.
- Expected fix: Implement secure nested route mapping; preserve site bookmarks.

## G2-17-020-011 [P1] GAP facet F05
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ClassroomMessageRepository.java:27-41 — GET since fetches changed rows including tombstones >= cursor.
- Expected fix: Implement delta polling or realtime updates with removed-row tombstones.

## G2-17-020-025 [P1] GAP facet F10
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-149 — Delete marks isDeleted true, retains record.
- Expected fix: Switch to soft delete with immutable actor/time history.

## G2-17-020-026 [P1] GAP facet F10
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:68-78 — Deleted changed-row redacts sender/text while retaining ID tombstone.
- Expected fix: Prevent deleted text resurfacing; emit redacted delta.

## G2-17-019-006 [P1] GAP facet F03
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1105 — Change is logged for grading and publication.
- Expected fix: Write event with before/after grade values in same transaction.

## G2-17-019-019 [P1] MISSING facet F10
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1105 — Saves grade audit row for every mutation.
- Expected fix: Add immutable event row inside transaction for all grade writes.

## G2-17-019-020 [P1] GAP facet F10
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:741-748 — Publishing records before/after grade values.
- Expected fix: Persist complete publish-grade ledger snapshot.

## G2-17-019-035 [P1] MISSING facet F20
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/planning/database-parity-db06-history-contract.md:71-75 — Producer+event atomicity required at commit.
- Expected fix: Enforce deferred commit completeness and CAS version.

## G2-17-019-039 [P1] GAP facet F22
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/planning/database-parity-db06-history-contract.md:164-181 — Promotion requires coordinated DB producer cutover.
- Expected fix: Release migration/producer atomically; test direct SQL mutation denied.

## G2-17-006-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx, src/modules/courses/learner-course-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:17-22 uses legacy slug or numeric courseId and first catch-all segment; docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:2-10 resolves by slug or integer.
- Expected fix: Create explicit old slug/numeric-to-delivery resolver for legacy bookmarks or record intentional unsupported ID scheme.

## Lane 9 verification notes (2026-10-22)

- OK — G2-16-016-010: quiz question points are 1–100; options accept 1–20 in `quiz-validation.ts` (the runtime additionally validates correct-choice cardinality).
- OK — G2-16-016-014: `quizQuestionInputSchema.points` uses `.max(100)`.
- DEFERRED — Remaining 23 rows: not yet individually inspected; no implementation claim or packet completion is implied.
