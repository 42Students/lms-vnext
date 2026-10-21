-- [chat-14] Old initial workspace presentation defaults; separate from template
-- lifecycle DRAFT/PUBLISHED transitions and runtime create permissions.
ALTER TABLE project_templates ADD COLUMN legacy_initial_workspace_status varchar(40);
--> statement-breakpoint
ALTER TABLE project_templates ADD COLUMN legacy_course_label varchar(160);
--> statement-breakpoint
ALTER TABLE project_templates ADD COLUMN legacy_phase varchar(120);
