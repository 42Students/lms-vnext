-- 13 Oct 2026: every email to a 42lms.com address is kept here (Cloudflare Email Routing -> Email Worker -> backend), no Gmail.
-- Replies to a conversation are also posted into it (kind REPLY); everything else (kind OTHER: a recruiter replying to an
-- invite, a student replying to a code email, mail to hello@...) is read on Super Admin > Inbound mail.
ALTER TABLE inbound_email
    ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'REPLY' COMMENT 'REPLY (to a conversation) | OTHER',
    ADD COLUMN body_text MEDIUMTEXT NULL COMMENT 'The email''s text (for a reply: its own words, without the quoted email)',
    ADD COLUMN recruiter_id INT NULL COMMENT 'Sender matched to a recruiter by address',
    ADD COLUMN learner_id INT NULL COMMENT 'Sender matched to a student by address',
    ADD COLUMN college_id INT NULL,
    ADD COLUMN handled_at DATETIME NULL COMMENT 'Marked done on Super Admin > Inbound mail',
    ADD COLUMN handled_by INT NULL,
    ADD INDEX idx_inbound_email_kind (kind, handled_at, created_at);
