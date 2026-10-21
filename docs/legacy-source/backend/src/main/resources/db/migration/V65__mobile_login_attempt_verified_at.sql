ALTER TABLE mobile_login_attempt
    ADD COLUMN verified_at DATETIME NULL;

CREATE INDEX idx_mobile_login_attempt_verified_at
    ON mobile_login_attempt (verified_at);
