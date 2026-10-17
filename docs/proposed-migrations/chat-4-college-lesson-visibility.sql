-- [chat-4] COL-course-tabs-13
-- Registration proposal only. College lesson records currently have lifecycle
-- status ACTIVE/ARCHIVED, which is not a reversible visibility setting.
-- Do not implement Show/Hide by archiving lessons or rewriting published content.
-- Register this separately from the DB05 private-materials proposal.
ALTER TABLE "course_lessons"
 ADD COLUMN IF NOT EXISTS "visible_to_students" boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "course_lessons_active_visible_idx"
 ON "course_lessons" ("learning_path_id","visible_to_students","sequence")
 WHERE "status" = 'ACTIVE';
-- After registering:
-- 1. Add a Drizzle field in the canonical course_lessons declaration.
-- 2. Gate learner lesson queries on visible_to_students=true.
-- 3. Add a tenant-scoped optimistic-version API for single and bulk changes.
-- 4. Enforce the same flag in deep-link and progress readers.
-- 5. Audit and return a per-ID result for retry of failed bulk changes.
-- Leave visibility UI blocked until all read paths enforce this flag.
