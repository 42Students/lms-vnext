-- Shared retry budget for mobile and email fallback OTP verification.
-- Must be applied before deploying the matching auth service; existing attempts start at zero.
ALTER TABLE mobile_login_attempt
    ADD COLUMN verification_attempts INT NOT NULL DEFAULT 0;
