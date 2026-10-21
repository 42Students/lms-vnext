-- Recruiter phase 1, step 4 (L9): recruiters are identified by their work email only; a mobile number is just a contact.
-- A recruiter who moves company is a new account (new work email) and may keep the same phone, so the phone is no longer unique.
DROP INDEX uk_recruiter_contact_mobile ON recruiter;
CREATE INDEX idx_recruiter_contact_mobile ON recruiter (contact_mobile);

-- Accepting a TPO's invite link now proves the work mailbox first: a one-time code goes to the email, and the link is spent only
-- after the right code. Codes are stored hashed, expire, and lock after a few wrong tries.
CREATE TABLE recruiter_invite_code (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invite_token_hash CHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    code_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    wrong_tries INT NOT NULL DEFAULT 0,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_recruiter_invite_code_token (invite_token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
