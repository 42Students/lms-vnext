-- Add optimistic locking version column for learner and faculty (prevents concurrent profile edit conflicts).
ALTER TABLE learner ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE faculty ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
