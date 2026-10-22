-- Registers nullable columns that src/db/schema declares for registered tables
-- but that no numbered migration ever created. Drizzle lists every declared
-- column in inserts and unqualified selects, so these tables fail at runtime
-- without them. Additive and nullable only: no backfill, no behaviour change.

-- announcements (src/db/schema/db10-announcements.ts)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_sender_type varchar(40);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_receiver_type varchar(40);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_receiver_label varchar(160);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_original_title text;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_original_message text;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_source_created_local timestamp;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_source_updated_local timestamp;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_source_time_zone varchar(80);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_was_title_missing boolean;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS legacy_button_url text;

-- messaging receipts (src/db/schema/messaging-receipts.ts)
ALTER TABLE messaging_delivery_batches ADD COLUMN IF NOT EXISTS legacy_command_id integer;
ALTER TABLE messaging_delivery_batches ADD COLUMN IF NOT EXISTS legacy_purpose varchar(160);
ALTER TABLE messaging_delivery_batches ADD COLUMN IF NOT EXISTS legacy_created_at_local varchar(36);
CREATE UNIQUE INDEX IF NOT EXISTS messaging_batches_legacy_command_uq
  ON messaging_delivery_batches (legacy_command_id) WHERE legacy_command_id IS NOT NULL;
ALTER TABLE messaging_delivery_receipts ADD COLUMN IF NOT EXISTS legacy_receipt_id integer;
ALTER TABLE messaging_delivery_receipts ADD COLUMN IF NOT EXISTS legacy_attempted_at_local varchar(36);
ALTER TABLE messaging_delivery_receipts ADD COLUMN IF NOT EXISTS failure_code varchar(64);
ALTER TABLE messaging_delivery_receipts ADD COLUMN IF NOT EXISTS safe_failure_summary varchar(180);
CREATE UNIQUE INDEX IF NOT EXISTS messaging_receipts_legacy_id_uq
  ON messaging_delivery_receipts (legacy_receipt_id) WHERE legacy_receipt_id IS NOT NULL;
ALTER TABLE messaging_sms_delivery_attempts ADD COLUMN IF NOT EXISTS legacy_attempt_id integer;
ALTER TABLE messaging_sms_delivery_attempts ADD COLUMN IF NOT EXISTS command_id uuid;
ALTER TABLE messaging_sms_delivery_attempts ADD COLUMN IF NOT EXISTS safe_failure_summary varchar(180);
ALTER TABLE messaging_sms_delivery_attempts ADD COLUMN IF NOT EXISTS provider_status varchar(40);
CREATE UNIQUE INDEX IF NOT EXISTS messaging_sms_attempts_legacy_id_uq
  ON messaging_sms_delivery_attempts (legacy_attempt_id) WHERE legacy_attempt_id IS NOT NULL;

-- TPO CRM (src/db/schema/tpo-crm.ts)
ALTER TABLE placement_tpo_leads ADD COLUMN IF NOT EXISTS legacy_lead_id integer;
ALTER TABLE placement_tpo_leads ADD COLUMN IF NOT EXISTS legacy_college_id integer;
ALTER TABLE placement_tpo_leads ADD COLUMN IF NOT EXISTS legacy_owner_faculty_id integer;
ALTER TABLE placement_tpo_lead_activities ADD COLUMN IF NOT EXISTS legacy_activity_id integer;
ALTER TABLE placement_tpo_lead_activities ADD COLUMN IF NOT EXISTS legacy_lead_id integer;
ALTER TABLE placement_tpo_followups ADD COLUMN IF NOT EXISTS legacy_followup_id integer;
ALTER TABLE placement_tpo_followups ADD COLUMN IF NOT EXISTS legacy_lead_id integer;
ALTER TABLE placement_tpo_email_campaigns ADD COLUMN IF NOT EXISTS legacy_campaign_id integer;
ALTER TABLE placement_tpo_email_campaigns ADD COLUMN IF NOT EXISTS legacy_sender_user_id integer;
ALTER TABLE placement_tpo_email_campaigns ADD COLUMN IF NOT EXISTS legacy_subject text;
ALTER TABLE placement_tpo_email_campaigns ADD COLUMN IF NOT EXISTS legacy_body text;
ALTER TABLE placement_tpo_email_campaigns ADD COLUMN IF NOT EXISTS legacy_sent_count integer;
ALTER TABLE placement_tpo_email_campaigns ADD COLUMN IF NOT EXISTS legacy_failed_count integer;
ALTER TABLE placement_tpo_email_campaign_recipients ADD COLUMN IF NOT EXISTS legacy_recipient_id integer;
ALTER TABLE placement_tpo_email_campaign_recipients ADD COLUMN IF NOT EXISTS legacy_unsubscribe_sha256 varchar(64);
CREATE INDEX IF NOT EXISTS tpo_email_recipient_legacy_unsubscribe_idx
  ON placement_tpo_email_campaign_recipients (legacy_unsubscribe_sha256)
  WHERE legacy_unsubscribe_sha256 IS NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tpo_email_recipient_legacy_unsubscribe_ck') THEN
    ALTER TABLE placement_tpo_email_campaign_recipients
      ADD CONSTRAINT tpo_email_recipient_legacy_unsubscribe_ck
      CHECK (legacy_unsubscribe_sha256 IS NULL OR legacy_unsubscribe_sha256 ~ '^[a-f0-9]{64}$');
  END IF;
END $$;
