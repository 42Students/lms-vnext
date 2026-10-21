-- 13 Oct 2026: TPO messages reach a recruiter by email only when unread (one email per conversation at most every 6 hours),
-- and a recruiter can reply to that email: the reply goes to hello+r-<reply_token>@42lms.com, the backend reads it from the
-- hello@ mailbox and posts it into the conversation. Every reply read is logged in inbound_email.

ALTER TABLE tpo_message_thread
    ADD COLUMN recruiter_emailed_at DATETIME NULL COMMENT 'Last unread-messages email to the recruiter (at most one per 6 hours)',
    ADD COLUMN reply_token VARCHAR(32) NULL COMMENT 'Code in this conversation''s reply address: hello+r-<code>@42lms.com',
    ADD UNIQUE KEY uk_tpo_message_thread_reply_token (reply_token);

ALTER TABLE tpo_message
    ADD COLUMN via VARCHAR(10) NOT NULL DEFAULT 'APP' COMMENT 'APP | EMAIL (a recruiter''s reply to our email)';

CREATE TABLE inbound_email (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gmail_id VARCHAR(100) NOT NULL COMMENT 'Gmail message id: each reply is read once',
    received_at DATETIME NULL,
    from_address VARCHAR(320) NULL,
    to_address VARCHAR(500) NULL,
    subject VARCHAR(500) NULL,
    thread_id BIGINT NULL COMMENT 'tpo_message_thread the reply address belongs to',
    message_id BIGINT NULL COMMENT 'tpo_message the reply became',
    status VARCHAR(20) NOT NULL COMMENT 'POSTED | NO_THREAD | WRONG_SENDER | NOT_VERIFIED | EMPTY | ACCESS_ENDED | FAILED',
    body_preview VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_inbound_email_gmail (gmail_id),
    INDEX idx_inbound_email_thread (thread_id),
    INDEX idx_inbound_email_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inbound_mailbox_state (
    mailbox VARCHAR(320) NOT NULL PRIMARY KEY,
    history_id BIGINT NULL COMMENT 'Gmail history id read up to',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
