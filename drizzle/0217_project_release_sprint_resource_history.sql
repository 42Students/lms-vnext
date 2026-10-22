-- [chat-14] Legacy release/sprint/resource fields; journal integration by lane15.
ALTER TABLE project_instances ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN legacy_template_bound boolean;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN legacy_recoverable_content boolean;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN target_date date;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN notes text;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN version integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN legacy_sprint_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN legacy_release_label varchar(160);
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN legacy_derived_status varchar(32);
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN sprint_number integer;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN started_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN started_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN completed_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN completed_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN deleted_by_workspace boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_resource_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_resource_kind varchar(32);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_sprint_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_task_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_file_name text;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_file_url text;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_attachment_url text;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_download_url text;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN legacy_uploaded_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
