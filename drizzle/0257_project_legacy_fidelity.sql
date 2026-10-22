-- [chat-14] Legacy projects/sprints/tasks/comments/deliveries: audit-only source provenance.
-- Every source ID is confined to the mapped project. Source fields never grant access.
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS legacy_release_id integer;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS legacy_release_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS legacy_sort_order integer;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS legacy_release_label varchar(160);
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS legacy_version bigint;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_releases_source_order_idx ON project_releases(project_id,legacy_sort_order,id);
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS legacy_sprint_id integer;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS legacy_sort_order integer;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS legacy_version bigint;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_sprints_source_order_idx ON project_sprints(project_id,release_id,legacy_sort_order,id);
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS legacy_task_id integer;
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS legacy_sort_order integer;
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS legacy_carried_from_sprint_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS legacy_version bigint;
--> statement-breakpoint
ALTER TABLE project_tasks ALTER COLUMN task_type SET DEFAULT 'STORY';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_tasks_source_order_idx ON project_tasks(project_id,sprint_id,legacy_sort_order,id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_tasks_active_order_idx ON project_tasks(project_id,sprint_id,sequence,id)
 WHERE deleted_at IS NULL;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN IF NOT EXISTS legacy_comment_id integer;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN IF NOT EXISTS legacy_project_id integer;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN IF NOT EXISTS legacy_task_id integer;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN IF NOT EXISTS legacy_commenter_id integer;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN IF NOT EXISTS legacy_commenter_type varchar(20);
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN IF NOT EXISTS legacy_commenter_name varchar(160);
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
ALTER TABLE project_task_comments ADD COLUMN IF NOT EXISTS legacy_body_was_null boolean;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_task_comments_scoped_history_idx
 ON project_task_comments(project_id,task_id,deleted_at,created_at,id);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_sort_order integer;
--> statement-breakpoint
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS legacy_member_id integer;
--> statement-breakpoint
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS legacy_version bigint;
--> statement-breakpoint
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS legacy_role_label varchar(80);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_members_source_type_idx
 ON project_members(project_id,legacy_user_type,membership_id);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_draft_saved_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_draft_saved_by_name varchar(160);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_submitted_by_name varchar(160);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_submitted_by_type varchar(40);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_reviewed_by_name varchar(160);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_reviewed_by_type varchar(40);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_locked_by_name varchar(160);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_last_updated_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_last_updated_by_name varchar(160);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_last_updated_by_type varchar(40);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_primary_attachment_url text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_delivery_events_submission_history_idx
 ON project_delivery_events(project_id,submission_id,occurred_at,id);
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS legacy_meeting_id integer;
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS legacy_local_start timestamp;
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS legacy_local_end timestamp;
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS legacy_time_zone varchar(80);
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS legacy_organizer_name varchar(160);
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS legacy_organizer_type varchar(32);
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS legacy_calendar_sync_status varchar(24);
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS legacy_needs_schedule_review boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_meetings_legacy_id_idx ON project_meetings(project_id,legacy_meeting_id)
 WHERE legacy_meeting_id IS NOT NULL;
