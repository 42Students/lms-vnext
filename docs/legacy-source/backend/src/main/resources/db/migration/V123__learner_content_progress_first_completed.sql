-- Course adversarial audit 5.4: completed_at is nullable and gets cleared whenever the client
-- sends {completed: false} (a legitimate "mark as unwatched / rewatch" action), which previously
-- destroyed the only record that the content was ever completed at all. If completion ever feeds
-- a report or a certificate, that history was unrecoverable.
--
-- first_completed_at is set once, the first time a row is ever marked complete, and is never
-- cleared afterward -- an immutable audit trail sitting alongside the mutable "is it complete
-- right now" state that completed_at continues to represent.

ALTER TABLE learner_content_progress
    ADD COLUMN first_completed_at TIMESTAMP NULL;
