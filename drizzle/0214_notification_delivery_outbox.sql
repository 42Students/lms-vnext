-- [chat-14] Producer-owned outbox for delayed notifications; no worker yet.
-- The active inbox remains private per recipient and must not get eager rows.
CREATE TABLE notification_delivery_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_id uuid NOT NULL REFERENCES activity_events(id) ON DELETE RESTRICT,
 college_id uuid REFERENCES colleges(id) ON DELETE RESTRICT,
 organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
 authored_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 recipient_selection jsonb NOT NULL,
 scheduled_at timestamptz NOT NULL,
 delivery_status varchar(24) NOT NULL DEFAULT 'SCHEDULED',
 delivery_attempts integer NOT NULL DEFAULT 0,
 next_retry_at timestamptz,
 delivery_error varchar(500),
 delivered_at timestamptz,
 dedupe_key text,
 deleted_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT notification_delivery_outbox_status_ck CHECK (delivery_status IN ('SCHEDULED','PROCESSING','SENT','FAILED')),
 CONSTRAINT notification_delivery_outbox_attempts_ck CHECK (delivery_attempts >= 0),
 CONSTRAINT notification_delivery_outbox_status_time_ck CHECK (delivery_status <> 'SENT' OR delivered_at IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX notification_delivery_outbox_dedupe_uq ON notification_delivery_outbox(dedupe_key)
 WHERE dedupe_key IS NOT NULL;
--> statement-breakpoint
CREATE INDEX notification_delivery_outbox_due_idx
 ON notification_delivery_outbox(delivery_status,scheduled_at,next_retry_at) WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX notification_delivery_outbox_scope_idx
 ON notification_delivery_outbox(organization_id,college_id,created_at);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN actor_name_snapshot text;
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN legacy_project_event_key varchar(120);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN legacy_project_event_code varchar(80);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN legacy_project_id integer;
--> statement-breakpoint
CREATE INDEX activity_events_subject_time_idx
 ON activity_events(module,subject_type,subject_id,occurred_at);
--> statement-breakpoint
CREATE INDEX activity_events_project_event_idx
 ON activity_events(legacy_project_id,occurred_at) WHERE legacy_project_id IS NOT NULL;
