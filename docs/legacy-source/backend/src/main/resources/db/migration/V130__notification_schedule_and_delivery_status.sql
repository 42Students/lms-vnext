-- M2 (super-admin audit): "schedule a notification (no entity field either); see delivery
-- status, resend or retry".
--
-- Both columns are nullable with no default, so every existing row keeps behaving exactly as it
-- does today: scheduled_at IS NULL means "deliver immediately", which is what every notification
-- created before this migration was.
--
-- delivery_status is deliberately a short varchar rather than an enum: MySQL enums can't be
-- extended without an ALTER, and the set of states here (SCHEDULED / SENT / FAILED) is the kind
-- that grows.

ALTER TABLE notification
    ADD COLUMN scheduled_at DATETIME NULL,
    ADD COLUMN delivery_status VARCHAR(20) NULL,
    ADD COLUMN delivery_error VARCHAR(500) NULL,
    ADD COLUMN delivered_at DATETIME NULL;

-- The release job scans for due notifications by (delivery_status, scheduled_at); without this
-- it is a full table scan on a table that only grows.
CREATE INDEX idx_notification_scheduled ON notification (delivery_status, scheduled_at);
