-- [chat-14] DRAFT ONLY. Register AFTER general_notification_outbox and its recipient/tenant constraints.
CREATE TABLE general_sms_delivery_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 notice_id uuid REFERENCES general_notification_outbox(id) ON DELETE RESTRICT,
 college_id uuid REFERENCES colleges(id) ON DELETE RESTRICT,
 legacy_sms_log_id integer,
 purpose varchar(64) NOT NULL,
 recipient_suffix varchar(4),
 status varchar(16) NOT NULL,
 provider_message_id varchar(64),
 error_summary varchar(500),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT db10_sms_delivery_logs_status_ck CHECK(status IN ('SENT','FAILED')),
 CONSTRAINT db10_sms_delivery_logs_suffix_ck CHECK(recipient_suffix IS NULL OR recipient_suffix ~ '^[0-9]{4}$'),
 CONSTRAINT db10_sms_delivery_logs_purpose_ck CHECK(length(trim(purpose)) BETWEEN 1 AND 64)
);
--> statement-breakpoint
CREATE INDEX db10_sms_delivery_logs_college_status_time_idx ON general_sms_delivery_logs(college_id,status,created_at);
--> statement-breakpoint
CREATE INDEX db10_sms_delivery_logs_notice_idx ON general_sms_delivery_logs(notice_id);
