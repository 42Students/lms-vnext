-- DB09 compatibility layer for legacy placement notification_outbox.
-- STAGED ONLY. NOT REGISTERED. NOT EXECUTED.

CREATE TABLE notification_cancellation_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  status varchar(16) NOT NULL DEFAULT 'OPEN',
  cancelled_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_cancellation_groups_status_ck
    CHECK (status IN ('OPEN','CANCELLED','EXPIRED')),
  CONSTRAINT notification_cancellation_groups_cancel_shape_ck
    CHECK (
      (status='CANCELLED' AND cancelled_at IS NOT NULL)
      OR (status<>'CANCELLED' AND cancelled_at IS NULL)
    ),
  CONSTRAINT notification_cancellation_groups_id_scope_uq
    UNIQUE (id,organization_id,college_id)
);

CREATE TABLE notification_delivery_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  source_event_id uuid REFERENCES activity_events(id) ON DELETE RESTRICT,
  event_key varchar(64) NOT NULL,
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  audience_type varchar(16) NOT NULL,
  channel varchar(16) NOT NULL,
  cancellation_group_id uuid,
  not_before timestamptz NOT NULL DEFAULT now(),
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  materialized_child_id uuid,
  safe_failure_code varchar(64),
  materialized_at timestamptz,
  sent_at timestamptz,
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_delivery_intents_group_scope_fk
    FOREIGN KEY (cancellation_group_id,organization_id,college_id)
    REFERENCES notification_cancellation_groups(id,organization_id,college_id)
    ON DELETE RESTRICT,
  CONSTRAINT notification_delivery_intents_audience_ck
    CHECK (audience_type IN ('LEARNER','RECRUITER','FACULTY')),
  CONSTRAINT notification_delivery_intents_channel_ck
    CHECK (channel IN ('APP','EMAIL','SMS','WHATSAPP')),
  CONSTRAINT notification_delivery_intents_status_ck
    CHECK (status IN ('PENDING','CANCELLED','MATERIALIZED','SENT','FAILED')),
  CONSTRAINT notification_delivery_intents_event_ck
    CHECK (length(trim(event_key)) BETWEEN 1 AND 64),
  CONSTRAINT notification_delivery_intents_version_ck CHECK (version >= 0),
  CONSTRAINT notification_delivery_intents_materialized_shape_ck
    CHECK (
      (status IN ('MATERIALIZED','SENT') AND materialized_at IS NOT NULL AND materialized_child_id IS NOT NULL)
      OR (status NOT IN ('MATERIALIZED','SENT') AND materialized_at IS NULL AND materialized_child_id IS NULL)
    ),
  CONSTRAINT notification_delivery_intents_sent_shape_ck
    CHECK (
      (status='SENT' AND sent_at IS NOT NULL)
      OR (status<>'SENT' AND sent_at IS NULL)
    )
);

CREATE UNIQUE INDEX notification_delivery_intents_idempotency_uq
  ON notification_delivery_intents(
    organization_id,college_id,event_key,recipient_user_id,channel,
    coalesce(source_event_id,'00000000-0000-0000-0000-000000000000'::uuid)
  );
CREATE INDEX notification_delivery_intents_due_idx
  ON notification_delivery_intents(status,not_before)
  WHERE status='PENDING';
CREATE INDEX notification_delivery_intents_cancel_group_idx
  ON notification_delivery_intents(cancellation_group_id,status)
  WHERE cancellation_group_id IS NOT NULL;

-- Materialization policy:
-- APP      -> in_app_notifications (materialized_child_id = notification id)
-- external -> outbound_messages     (materialized_child_id = outbound id)
-- External recipient/contact/merge payload remains encrypted in outbound_messages.
