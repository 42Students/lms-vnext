ALTER TABLE outbound_suppressions ADD COLUMN IF NOT EXISTS legacy_suppression_id integer,
 ADD COLUMN IF NOT EXISTS legacy_reason_category varchar(24),
 ADD COLUMN IF NOT EXISTS legacy_created_at timestamptz,
 ADD COLUMN IF NOT EXISTS clear_actor_user_id uuid,
 ADD COLUMN IF NOT EXISTS clear_reason varchar(500);
ALTER TABLE outbound_global_email_suppressions ADD COLUMN IF NOT EXISTS legacy_suppression_id integer,
 ADD COLUMN IF NOT EXISTS legacy_reason_category varchar(24),
 ADD COLUMN IF NOT EXISTS legacy_created_at timestamptz,
 ADD COLUMN IF NOT EXISTS clear_actor_user_id uuid,
 ADD COLUMN IF NOT EXISTS clear_reason varchar(500);
CREATE UNIQUE INDEX IF NOT EXISTS db10_outbound_suppressions_legacy_uq
 ON outbound_suppressions(organization_id,legacy_suppression_id)
 WHERE legacy_suppression_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS db10_outbound_suppression_history_idx
 ON outbound_suppressions(recipient_hash,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS db10_global_email_suppressions_legacy_uq
 ON outbound_global_email_suppressions(legacy_suppression_id)
 WHERE legacy_suppression_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS db10_global_email_suppression_history_idx
 ON outbound_global_email_suppressions(recipient_hash,created_at);
ALTER TABLE outbound_suppressions DROP CONSTRAINT IF EXISTS db10_outbound_suppressions_reason_ck;
ALTER TABLE outbound_suppressions ADD CONSTRAINT db10_outbound_suppressions_reason_ck
 CHECK (reason IN ('UNSUBSCRIBED','BOUNCE','COMPLAINT','ADMIN_BLOCK','LEGACY_UNSPECIFIED'));
ALTER TABLE outbound_global_email_suppressions DROP CONSTRAINT IF EXISTS db10_global_email_suppressions_reason_ck;
ALTER TABLE outbound_global_email_suppressions ADD CONSTRAINT db10_global_email_suppressions_reason_ck
 CHECK (reason IN ('UNSUBSCRIBED','BOUNCE','COMPLAINT','LEGACY_UNSPECIFIED'));
