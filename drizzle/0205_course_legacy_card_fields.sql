-- [chat-14] Preserve course creator organization and legacy card fields.
-- Unique active short titles match legacy behavior but duplicate data must
-- be reconciled before lane 15 registers this migration.
ALTER TABLE courses ADD COLUMN created_by_organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN image_url_learning_path text;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN thumbnail_url text;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN legacy_introduction_html text;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN legacy_course_start_date_text text;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN legacy_course_end_date_text text;
--> statement-breakpoint
CREATE UNIQUE INDEX courses_active_department_short_title_uq
 ON courses(department_id, lower(short_title))
 WHERE status = 'ACTIVE' AND short_title IS NOT NULL;
