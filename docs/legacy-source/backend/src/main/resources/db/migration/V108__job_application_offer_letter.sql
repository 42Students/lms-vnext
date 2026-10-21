-- Nothing tracked the actual offer-letter document or when it was sent — OFFERED/HIRED were
-- just status flags with no attached artifact.
ALTER TABLE job_application ADD COLUMN offer_letter_url TEXT NULL AFTER rejection_reason;
ALTER TABLE job_application ADD COLUMN offer_letter_sent_at DATETIME NULL AFTER offer_letter_url;
