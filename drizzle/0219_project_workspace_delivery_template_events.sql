-- [chat-14] Legacy project workspace and delivery provenance (not runtime ACL).
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS legacy_overview jsonb;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS legacy_template_snapshot jsonb;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS legacy_organization_id integer;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS legacy_class_id integer;
--> statement-breakpoint
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS legacy_revision integer;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_review_status varchar(60);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_optimistic_version integer;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_file_name varchar(255);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_file_size integer;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_mime_type varchar(160);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_storage_key text;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS legacy_submitted_local timestamp without time zone;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS project_template_legacy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES project_templates(id) ON DELETE RESTRICT,
  legacy_event_id integer,
  legacy_template_version integer,
  action_type varchar(40),
  lifecycle_status varchar(20),
  snapshot jsonb,
  source_actor_name text,
  changed_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  changed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS project_template_legacy_events_template_source_uq
 ON project_template_legacy_events(template_id,legacy_event_id)
 WHERE legacy_event_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_template_legacy_events_template_time_idx
 ON project_template_legacy_events(template_id,changed_at);
