ALTER TABLE notification_delivery_outbox DROP CONSTRAINT IF EXISTS notification_delivery_outbox_status_ck;
ALTER TABLE notification_delivery_outbox ADD CONSTRAINT notification_delivery_outbox_status_ck
  CHECK (delivery_status IN ('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'));
