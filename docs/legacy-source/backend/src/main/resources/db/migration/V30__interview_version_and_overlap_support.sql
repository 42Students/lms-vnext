-- Add optimistic locking version column for interview (prevents cancel/confirm race).
ALTER TABLE interview ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
