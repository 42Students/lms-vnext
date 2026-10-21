-- Lossless legacy application-status event archive, NOT live application state.
CREATE TABLE placement_legacy_application_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
  source_legacy_event_id varchar(40),
  old_status varchar(50),
  new_status varchar(50) NOT NULL,
  reason varchar(500),
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  source_actor_type varchar(32),
  source_deleted boolean NOT NULL DEFAULT false,
  changed_at timestamptz NOT NULL,
  CONSTRAINT placement_legacy_status_nonblank_ck CHECK (length(trim(new_status)) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX placement_legacy_status_source_uq
 ON placement_legacy_application_status_events(application_id,source_legacy_event_id)
 WHERE source_legacy_event_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX placement_legacy_status_timeline_idx
 ON placement_legacy_application_status_events(application_id,changed_at);
