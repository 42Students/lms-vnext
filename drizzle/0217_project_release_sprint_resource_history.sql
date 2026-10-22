-- [chat-14] Legacy release/sprint/resource fields; journal integration by lane15.
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS legacy_template_bound boolean;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS legacy_recoverable_content boolean;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS target_date date;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS notes text;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE project_releases ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS legacy_sprint_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS legacy_release_label varchar(160);
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS legacy_derived_status varchar(32);
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS sprint_number integer;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS started_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS started_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS completed_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS completed_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS deleted_by_workspace boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_resource_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_resource_kind varchar(32);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_sprint_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_task_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_file_name text;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_file_url text;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_attachment_url text;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_download_url text;
--> statement-breakpoint
ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS legacy_uploaded_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
