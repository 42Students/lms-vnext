ALTER TABLE mobile_login_attempt
    ADD COLUMN email_otp VARCHAR(12) NULL AFTER otp,
    ADD COLUMN email_otp_expires_at DATETIME NULL AFTER expires_at,
    ADD COLUMN email_otp_sent_at DATETIME NULL AFTER email_otp_expires_at;
