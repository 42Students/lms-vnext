-- Audit 4.4 (attendance & scheduling): absence SMS to parents is fire-and-forget with no delivery
-- record.
--
-- The send result was known and thrown away — BulkSMSApps returns a MessageId on success and an
-- error body on failure, and both went to the application log and nowhere else. So when a parent
-- says "I was never told my child was absent", nobody can answer them: not whether it was sent,
-- not whether the operator accepted it, not why it failed. On a platform where absence SMS is the
-- parent-facing half of attendance, that is the one question support actually gets asked.
--
-- ## What is deliberately NOT stored
--
-- Not the message body. These messages name a child, a course and a time, and a delivery log is
-- read by more people and kept longer than the send path itself. The template key identifies what
-- was sent without reproducing it.
--
-- Not the full phone number. The last four digits are enough to confirm "yes, we sent it to the
-- number ending 4821", which is what the question actually needs; the rest is a parent's personal
-- contact detail sitting in a support-facing table.

CREATE TABLE sms_delivery_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- What kind of message this was: attendance.absence, attendance.correction, otp, job.update.
    purpose VARCHAR(64) NOT NULL,
    -- Last four digits only. See above.
    recipient_suffix VARCHAR(8) NULL,
    -- SENT once the operator accepted it, FAILED otherwise. Acceptance is not proof of handset
    -- delivery — BulkSMSApps does not report that — and the column name says only what is known.
    status VARCHAR(16) NOT NULL,
    -- The provider's MessageId, which is what their support needs to trace one message.
    provider_message_id VARCHAR(64) NULL,
    -- Truncated failure reason. Never the message body.
    error_summary VARCHAR(500) NULL,
    college_id INT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

-- Support looks this up two ways: "what happened around this time" and "what happened to this
-- number", the second usually narrowed by purpose.
CREATE INDEX idx_sms_log_created ON sms_delivery_log (created_at);
CREATE INDEX idx_sms_log_recipient ON sms_delivery_log (recipient_suffix, purpose);
