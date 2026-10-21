# Work packet: edit src/db/schema/courses.ts (part 5 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md, docs/audit/gap2/lane-8/course.md

## G2-4-011-080  [P1] GAP  facet F22  effort L
- Legacy: Old table has int faculty/course/class/batch, int semester, varchar academic_year, bool is_active, role, start/end date. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:18-60`)
- vNext now: New table has UUID delivery/membership, role, startedAt/endedAt timestamps; join resolves cohort/section/year. (`src/db/schema/courses.ts:228-260`; `src/modules/admin-ui/super-admin-faculty-assignments-service.ts:29-48`)
- Fix: Document each column transformation, null and history semantics.

## G2-4-011-082  [P1] GAP  facet F22  effort M
- Legacy: Old active boolean can be toggled in edit form. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:46-53`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:588-590`)
- vNext now: New endedAt lifecycle and optimistic timestamp edit for role. (`src/db/schema/courses.ts:242-260`; `src/components/admin/super-admin-faculty-assignment-create.tsx:136-146`)
- Fix: Preserve explicit active state or document reversible lifecycle.

## G2-8-020-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:195-263 detail by numeric course ID or slug
- vNext now: src/db/schema/courses.ts:37,43-44 UUID courseId plus code but no slug
- Fix: Preserve legacy slug/deep-link adapter or redirect to canonical UUID.

## G2-8-020-006  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:23-41 legacy shortTitle, active, enabled, allowedForDisplay
- vNext now: src/db/schema/courses.ts:43-53 name/code/shortTitle/status but no enabled/display flag
- Fix: Add explicit visibility/enabled controls or documented supported equivalents.

## G2-8-020-007  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:20-34 14 metadata card fields including image URLs/thumbnail/rich intro
- vNext now: src/db/schema/courses.ts:45-50 short title, official code, color, takeaways, description only
- Fix: List all legacy metadata fields in editor and preserve converted values.

## G2-8-020-010  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:25-28 deptId int and courseName string
- vNext now: src/db/schema/courses.ts:38-44 department UUID, name/code required
- Fix: Map numeric department/course identity and mandatory code.

## G2-8-020-011  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:32-35 parentCourseId and createdByOrgId
- vNext now: src/db/schema/courses.ts:34-64 neither parent nor createdByOrgId stored
- Fix: Preserve parent-child course links and provenance where used.

## G2-8-020-012  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:36-41 active, enabled Booleans and allowedForDisplay int
- vNext now: src/db/schema/courses.ts:51-53 single ACTIVE/ARCHIVED status
- Fix: Define exact truth table and display-policy mapping.

## G2-8-020-013  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:42-43 slug VARCHAR64 unique globally
- vNext now: src/db/schema/courses.ts:43-44,66-77 code VARCHAR64 unique per department when ACTIVE
- Fix: Keep URL identifier distinct from course code or publish stable migration aliases.

## G2-8-020-014  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:20-34 metadata image, courseCode, dates, HTML, colors etc.
- vNext now: src/db/schema/courses.ts:45-50 text/hex fields only
- Fix: Add metadata adapter with safe fields and preserve old course homepage.

## G2-8-020-042  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:233-267 duplicate name OR shortTitle case-insensitive within department
- vNext now: src/db/schema/courses.ts:66-77 unique active dept+lower(name) and dept+lower(code)
- Fix: Reconcile shortTitle unique rule and current code uniqueness.

## G2-8-020-043  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:59-105 generates random valid slug, max5 retries
- vNext now: src/db/schema/courses.ts:34-77 course code required input, no independent slug
- Fix: Provide deterministic URL alias and preserve old slug references.

## G2-8-020-044  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:168-185 no delete if lessons/content; soft-delete preserving references
- vNext now: src/db/schema/courses.ts:51-53 ARCHIVED state; offerings FK
- Fix: Map delete dependency guards and restore history, never orphan learner data.

## G2-8-020-045  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:188-209 restore only deleted in same college; slug remains reserved
- vNext now: src/db/schema/courses.ts:66-77 active-only unique code/name permits archive reuse
- Fix: Prevent restore collision; enforce unique active checks and immutable slug alias.

## G2-8-020-050  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:20-34 imageUrl/imageUrlLp/thumbnail HTTP(S) optional
- vNext now: src/db/schema/courses.ts:45-50 no image URLs or storage references
- Fix: Add safe media storage/link fields or intentional retirement decisions.

## G2-8-020-051  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:55-57 JSON content includes rich HTML
- vNext now: src/db/schema/courses.ts:45-50 description plain text; no embedded HTML field
- Fix: Preserve sanitized introduction/htmlContent or record dropped rich-text behavior.

## G2-8-020-066  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:22 table course with inherited int ID
- vNext now: src/db/schema/courses.ts:34-37 table courses with UUID PK
- Fix: Stable legacy numeric-to-UUID map for URLs and joins.

## G2-8-020-067  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:23-28 short_title/dept_id/course_name
- vNext now: src/db/schema/courses.ts:38-47 departmentId/name/code/shortTitle/officialCode
- Fix: Map legacy names/short titles, decide code versus officialCode precedence.

## G2-8-020-068  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:32-35 parent_course_id and created_by_org_id
- vNext now: src/db/schema/courses.ts:34-64 absent columns
- Fix: Backfill parent and creator organization metadata to new schema or side table.

## G2-8-020-069  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:36-41 active/enabled/allowed_for_display
- vNext now: src/db/schema/courses.ts:51-53 status ACTIVE/ARCHIVED
- Fix: Represent independent legacy Boolean/display flags, not collapsed status.
