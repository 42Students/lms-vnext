-- [chat-14] Historical project and task fields; registration reserved for lane 15.
-- Preflight imported identity collisions and update service ACLs before enabling.
ALTER TABLE project_templates ADD COLUMN legacy_task_fields jsonb;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN legacy_project_id integer;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN legacy_status varchar(32);
--> statement-breakpoint
CREATE UNIQUE INDEX project_instances_college_legacy_id_uq
 ON project_instances(college_id, legacy_project_id) WHERE legacy_project_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN legacy_release_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN due_label varchar(160);
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN legacy_task_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN due_label varchar(160);
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN legacy_sprint_label varchar(160);
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN legacy_assignee_type varchar(32);
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN legacy_assignee_name text;
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN created_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN updated_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN deleted_by_workspace boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN progress_value integer;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN task_status_snapshot varchar(30);
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD CONSTRAINT project_task_comments_progress_value_ck
 CHECK (progress_value IS NULL OR progress_value BETWEEN 0 AND 100);
--> statement-breakpoint
ALTER TABLE project_task_comments DROP CONSTRAINT project_task_comments_kind_ck;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD CONSTRAINT project_task_comments_kind_ck
 CHECK (comment_kind IN ('NOTE','PROGRESS_UPDATE','FLAG_FOR_MENTOR','PROGRESS','NEEDS_HELP','REVIEW','BLOCKED','STATUS_UPDATE'));
