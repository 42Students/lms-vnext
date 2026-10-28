-- DB-008 legacy course identity: normalized live titles/codes, forever reserved slugs.
CREATE UNIQUE INDEX courses_active_department_name_trim_uq
 ON courses(department_id,lower(btrim(name)))
 WHERE status='ACTIVE' AND deleted_at IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX courses_active_department_short_title_trim_uq
 ON courses(department_id,lower(btrim(short_title)))
 WHERE status='ACTIVE' AND deleted_at IS NULL AND short_title IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX courses_active_department_code_live_uq
 ON courses(department_id,lower(btrim(code)))
 WHERE status='ACTIVE' AND deleted_at IS NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS courses_active_department_name_uq;
--> statement-breakpoint
DROP INDEX IF EXISTS courses_active_department_short_title_uq;
--> statement-breakpoint
DROP INDEX IF EXISTS courses_active_department_code_uq;
--> statement-breakpoint
DO $idem$ BEGIN
 EXECUTE $ddl$ALTER TABLE courses ADD CONSTRAINT db05_course_name_nonblank_ck CHECK (btrim(name) <> '')$ddl$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
 EXECUTE $ddl$ALTER TABLE courses ADD CONSTRAINT db05_course_short_title_nonblank_ck CHECK (short_title IS NULL OR btrim(short_title) <> '')$ddl$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
 EXECUTE $ddl$ALTER TABLE courses ADD CONSTRAINT db05_course_slug_nonblank_ck CHECK (slug IS NULL OR btrim(slug) <> '')$ddl$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
