-- 13 Oct 2026: recruiters' replies now arrive through Cloudflare Email Routing (an Email Worker posts them to the backend) instead
-- of being read from a Gmail mailbox. inbound_email is keyed by the email's Message-ID, and the Gmail history cursor is gone.
ALTER TABLE inbound_email
    RENAME COLUMN gmail_id TO external_id,
    RENAME INDEX uk_inbound_email_gmail TO uk_inbound_email_external;
ALTER TABLE inbound_email MODIFY external_id VARCHAR(100) NOT NULL COMMENT 'Message-ID of the email: each reply is handled once';

DROP TABLE inbound_mailbox_state;
