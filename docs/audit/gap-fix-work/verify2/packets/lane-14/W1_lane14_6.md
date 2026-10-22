# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-017-015 [P1] MISSING facet F04
- Files: src/db/schema/projects.ts, src/db/schema/project-audit-staged.ts
- Legacy: Old taskStatusSnapshot varchar30 nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:40-41`
- Expected fix: Promote task status snapshot to registered schema and write on state action.

## G2-12-017-021 [P1] GAP facet F06
- Files: src/components/projects/project-task-comments.tsx, src/modules/projects/task-comment-service.ts
- Legacy: Old comments permitted for any active project member, no mentor/assignee-only restriction `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:164-172`
- Expected fix: Confirm non-assignee project membership gets write access, not only owner/mentor.

## G2-12-017-030 [P1] MISSING facet F08
- Files: src/components/projects/project-task-comments.tsx
- Legacy: Legacy progress system actions rendered as a timeline with status icons `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:569-580`
- Expected fix: Restore activity timeline with source-driven details.

## G2-12-017-058 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: Old MySQL project_task_comment int id, is_deleted, commenter metadata, progress_value, comment_type,status_snapshot `docs/legacy-source/backend/src/main/resources/db/migration/V76__project_task_comments.sql:1-17` `docs/legacy-source/backend/src/main/resources/db/migration/V77__project_task_comment_actions.sql:5-25`
- Expected fix: Promote needed staged columns, migrate legacy types, preserve historical system events.

## G2-12-017-060 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: Old commentType VARCHAR30 includes NOTE/PROGRESS/NEEDS_HELP/REVIEW/BLOCKED/STATUS_UPDATE `docs/legacy-source/backend/src/main/resources/db/migration/V77__project_task_comment_actions.sql:1-14` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:13-35`
- Expected fix: Backfill legacy enum aliases and represent system state audit kinds.

## G2-12-002-051 [P1] GAP facet F12
- Files: src/db/schema/academic-terms.ts
- Legacy: isMandatory true default, editable hidden switch `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:31-36`
- Expected fix: Define boolean-to-enum translation and persistence

## G2-12-002-076 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: Legacy read can soft-hide deleted rows, repository hard DELETE `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SemesterCourseRepository.java:16-20,37-39`
- Expected fix: Check retention and restoration behavior

## G2-13-014-061 [P1] MISSING facet F23
- Files: src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-114` search/stats/refresh three API operations absent in vNext pipeline model
- Expected fix: Offer compatibility API or retire with verified frontend caller replacement and route inventory

## G2-17-23-077 [P1] GAP facet F19 Response workload
- Files: (none, new feature)
- Legacy: LC:32–41 single offer action but TS:180 invokes JS:1168–1256 and JS:1325–1420 may visit every active application+interviews
- Expected fix: Benchmark worst-case student with many offers/interviews and ensure consistent lock ordering, bounded work, no timeout-induced partial writes

## G2-18-019-006 [P1] GAP facet F04 Faculty identity
- Files: (none, new feature)
- Legacy: LV:15-16 `faculty_id` int references faculty identity logically; LS:112-115 retrieves faculty by phone
- Expected fix: Document faculty_id → user/membership UUID identity crosswalk; do not load old faculty IDs as UUIDs

## G2-18-026-026 [P1] GAP facet F11 Superadmin scoping
- Files: (none, new feature)
- Legacy: NPC:67-77,152-162,192-202 reject wrong scoped college or organization with explicit 403 copy
- Expected fix: Verify role and organization checks for every mutation and preserve explicit unauthorized feedback for selected wrong college

## G2-19-029-022 [P1] GAP facet F04 Academic advisory
- Files: (none, new feature)
- Legacy: LG:66-71 EMPTY_COLLEGE_NO_ACADEMIC_DATA (no departments/faculty/students) warning; LB:224-241 adds when incomplete
- Expected fix: Keep academic setup warnings separate from domain login verdict; owner must decide stricter full-handover gate semantics

## G2-13-013-054 [P1] GAP facet F22
- Files: src/db/schema/courses.ts, drizzle/0004_courses_c2_learning.sql
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:13-38` MySQL lesson int id, lesson_name,course_id,active,enabled,sequence,version,BaseModel is_deleted
- Expected fix: Produce field-level legacy→vNext mapping including course ancestry and archived/deleted/visibility/version semantics

## G2-13-018-008 [P1] GAP facet F04
- Files: src/modules/academics/program-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:21-22` 4-year integer duration
- Expected fix: Preserve canonical two semesters/year and handle legacy programs with nonstandard term counts without fractional years

## G2-13-018-014 [P1] GAP facet F05
- Files: src/modules/academics/program-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:34-38` organization-wide list available
- Expected fix: Support cross-college org program list for organization-wide superadmin scope where still needed

## G2-13-018-031 [P1] GAP facet F11
- Files: src/modules/academics/program-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:89-115` allows global superadmin/organization-superadmin list if scoped
- Expected fix: Provide all-college read scope for authorized admin without weakening college mutations

## G2-13-018-055 [P1] GAP facet F22
- Files: src/modules/academics/program-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:15-50` queries findByDept/College/Org and findByIdAndNotDeleted
- Expected fix: Preserve organization/superadmin cross-college reports while restricting normal college roles

## G2-13-017-001 [P1] GAP facet F01
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:14-18` project_task entity with projectId/taskKey and workspace/template merge semantics
- Expected fix: Map legacy task identity and template-vs-workspace merge state to UUID task and templateKey without resurrecting deleted overrides

## G2-13-017-007 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:20` projectId Integer, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:26` taskKey varchar120 unique per project
- Expected fix: Crosswalk legacy project/task IDs and handle task keys longer than 64 without silent truncation/collision

## G2-13-017-010 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:41-48` dueDate, dueLabel, sprintKey, sprintLabel
- Expected fix: Preserve display label data or derive equivalent from linked sprint descriptions with verified rendering

## G2-13-017-015 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:85-92` submissionUrl<=2048,submittedBy int,submittedAt LocalDateTime
- Expected fix: Migrate URL and submitter to first versioned submission with accurate IST timestamp and validation cap

## G2-13-017-016 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:94-104` sortOrder,createdBy,createdByType,updatedBy
- Expected fix: Preserve creator/updater provenance via durable task activity history and migration actor references

## G2-13-017-019 [P1] GAP facet F05
- Files: src/modules/projects/mentor-task-delete-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskRepository.java:21-26` all rows includes soft-deleted to suppress template fallback
- Expected fix: Provide durable suppression key for deleted template tasks in workspace synthesis

## G2-13-017-031 [P1] GAP facet F10
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskRepository.java:15-19` JPA read/count soft-deleted=false projectId
- Expected fix: Implement deleted-as-suppressed state when task template fallback requires history; otherwise document intentional hard deletion

## G2-13-017-035 [P1] GAP facet F11
- Files: src/db/schema/projects.ts, src/modules/projects/learner-own-task-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:68-75` assigneeId+assigneeType allow learner/faculty separate ID namespaces
- Expected fix: Map faculty/nonlearner assignment records with explicit owner decision; avoid accidental learner conversion

## Lane chat-4 rapid verification triage (22 Oct 2026)
- G2-12-017-015: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-12-017-021: OK — comment write checks active project membership, not mentor/assignee only.
- G2-12-017-030: OK — immutable task activity events are merged into comment timeline with status snapshots.
- G2-12-017-058: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-12-017-060: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-12-002-051: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-12-002-076: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-014-061: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-17-23-077: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-18-019-006: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-18-026-026: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-19-029-022: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-013-054: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-018-008: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-018-014: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-018-031: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-018-055: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-017-001: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-017-007: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-017-010: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-017-015: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-017-016: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-017-019: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-017-031: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
- G2-13-017-035: DEFERRED — needs end-to-end source, authorization, data-migration or runtime parity verification; not asserted fixed.
