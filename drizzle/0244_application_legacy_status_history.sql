-- [chat-14] Historic application status events use a separate import-only
-- table; never coerce unknown old statuses or invent an actor in native history.
CREATE TABLE placement_application_legacy_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
  legacy_history_id bigint NOT NULL,
  legacy_application_id bigint,
  legacy_actor_id bigint,
  legacy_from_status varchar(50),
  legacy_to_status varchar(50) NOT NULL,
  legacy_reason varchar(500),
  legacy_was_deleted boolean,
  legacy_changed_at timestamptz,
  imported_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_app_legacy_history_application_event_uq
    UNIQUE(application_id,legacy_history_id)
);
--> statement-breakpoint
CREATE INDEX placement_app_legacy_history_application_time_idx
  ON placement_application_legacy_status_history(application_id,legacy_changed_at);
