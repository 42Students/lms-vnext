-- Tracks which distinct accounts hit a given error signature ("blast radius"), so an admin can
-- tell "1 student hit this 40 times" (a stuck retry loop, probably) from "40 different students
-- hit this once" (a real, widespread bug) instead of only seeing a raw occurrence count.
--
-- Only populated when the log message carries an "account=<id>/<ROLE>" marker, which today only
-- ClientErrorReportController writes -- native backend exceptions logged elsewhere don't carry a
-- structured account id, so blast radius is only ever known for frontend-reported errors. That's
-- disclosed in the API response (distinctAccountCount is null when never populated) rather than
-- silently showing a count of zero.
CREATE TABLE log_alert_signature_account (
    signature_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    first_seen_at TIMESTAMP NOT NULL,
    PRIMARY KEY (signature_id, account_id),
    CONSTRAINT fk_log_alert_signature_account_signature
        FOREIGN KEY (signature_id) REFERENCES log_alert_signature (id) ON DELETE CASCADE
);
