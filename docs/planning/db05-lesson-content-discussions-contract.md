# DB-008 — lesson-content discussions are NOT classroom chat

**Owner:** Chat 6 (temporary DATABASE task DB-008)  
**Observed:** 2026-10-11  
**Legacy BE oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**State:** SOURCE REVIEW + UNREGISTERED SQL DRAFT. **NOT database/API tested and NOT verified.**

## Why this is a real separate persisted concept

Current legacy BE `DiscussionController.java` implements:
- `POST /api/v1/discussion/post`: checks access to *lesson content ID*, takes current authenticated principal, overrides client user ID, then calls `DiscussionServiceImpl.postDiscussion`.
- `GET /api/v1/discussion/fetchDiscussion?lessonContentId=...`: checks the same scoped access, returns discussion posts and profile/learner display metadata.
- `DiscussionRepository.fetchDiscussion` selects `discussions` by `lesson_content_id`.

Distinct legacy `ClassroomController.java` exposes a class/course-scoped chat:
`GET/POST /api/v1/classroom/messages`, pin, and delete, where messages are scoped to both `course_id` and `class_id`. Its `ClassroomServiceImpl` adds teaching-assignment checks for faculty mutations and soft-delete behavior. **Do not alias these two unrelated streams.**

Current vNext `src/db/schema/discussions.ts` is `course_discussion_messages` keyed by `delivery_id`. Current `src/modules/courses/discussion-service.ts` implements that class/delivery chat, not the content-bound `/api/v1/discussion` stream. Therefore the existing table does NOT establish DB05 per-content discussion parity.

## Source-field accounting

`docs/planning/db-pass4-columns-db05_courses_and_content.json` has exactly **16** historical `discussions` columns. All 16 now have candidate targets in the *unregistered* `scripts/sql/db05-lesson-content-discussions.draft.sql`, never VERIFIED:

| Legacy fields | Proposed target | Evidence tier and open issue |
| --- | --- | --- |
| `id`, `lesson_content_id` | UUID PK + lesson content FK | Core legacy controller/repository source |
| `user_id` | `author_membership_id` | Controller binds authenticated principal; map into same-college membership |
| `user_name`, `profile_name` | Trusted identity snapshots | Service **ignores** caller-provided names, derives user unique ID/full name from current authenticated user |
| `content_text` | `content_text` | DTO `@NotBlank @Size(max=5000)`, sanitizer in service; historical varchar(255) snapshot may be outdated — MUST reconcile actual DB |
| `sequence` | `sequence` | Controller/DTO/service handle caller sequence; meaning and negative values require review |
| `created_at`, `updated_at`, `is_deleted` | Timestamps, nullable deletion timestamp | Historical table fields; current repository read does not visibly filter soft-delete, so not verified lifecycle parity |
| `parent_discussion_id`, `discussion_status`, `is_faculty_answer` | Nullable drafted fields | Historical physical snapshot only. Inspected current Java entity, controller and DTO do **not** expose these. Producer/consumer unresolved |
| `resolved_at`, `resolved_by`, `attachment_url` | Nullable resolution actor, time, private object key | Historical snapshot only. Enabling resolution/reply/file upload API without source evidence is prohibited |

## Database invariant requirements

- The lesson content MUST belong to the same college as the author membership. Independent foreign keys do **not** enforce this. The draft includes a tenant-check trigger using `lesson_contents -> course_lessons -> course_learning_paths -> course_offerings -> academic_periods.college_id`.
- When historical parent discussion is needed, a composite FK `(parent_discussion_id, lesson_content_id) -> (id, lesson_content_id)` forbids a reply linked to another content. Self-reply is forbidden; cycles longer than one hop still require protection **before any reply feature ships**.
- Never expose the historical `attachment_url` as a raw private object URL. Use authenticated private object receipts only once storage/retention policy has been verified.
- The draft is intentionally separate from `course_discussion_messages`, leaving existing classroom chat unmodified.
- The draft does NOT add a separate API or register a migration, modify the shared schema barrel, or claim any browser workflow parity.

## Gate before Chat 1 can register the draft

1. Confirm current legacy active FE usage (not established by the BE controller alone), the physical 255-vs-5000 text length mismatch, and historical optional-column status.
2. Bind author names server-side; prove wrong-role, wrong-college and mismatched lesson content are rejected. Test author and resolver cross-college cases directly in disposable PostgreSQL.
3. Verify scope-owner immutability or constraints when course offerings/academic periods move; the discussion-table insert/update trigger alone does not revalidate upstream reparenting.
4. Verify safe per-content read order and pagination, soft deletion and class-specific access, with full API and browser coverage in the later global waves.
5. Run the actual `db:migrate`, `test:db`, `lint`, `typecheck`, `test`, `build` and applicable browser tests with exact executed SHA. Tests authored or source comparison DO NOT qualify.

**Current gate:** OPEN. DB-008 remains `IN_PROGRESS`, not `COMPLETED` or `DONE_VERIFIED`.
