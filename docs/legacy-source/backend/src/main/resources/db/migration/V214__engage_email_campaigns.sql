-- V214: engage email campaigns
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Phase 3 (non-global): email campaigns from Engage. The placement cell writes one email to many recruiter leads; each gets
-- their own copy with their name and an unsubscribe link. Unsubscribed and email-less recruiter leads are skipped.
CREATE TABLE IF NOT EXISTS tpo_email_campaign (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  sent_by_faculty_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  recipients INT NOT NULL DEFAULT 0,
  sent INT NOT NULL DEFAULT 0,
  skipped INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  KEY idx_tpo_email_campaign_college (college_id, id)
);

CREATE TABLE IF NOT EXISTS tpo_email_campaign_recipient (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  campaign_id BIGINT NOT NULL,
  recruiter_lead_id BIGINT NOT NULL,
  email VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL,
  unsubscribe_token_hash CHAR(64) NULL,
  KEY idx_tpo_email_campaign_recipient_campaign (campaign_id),
  KEY idx_tpo_email_campaign_recipient_token (unsubscribe_token_hash)
);
