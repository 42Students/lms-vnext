-- Job and JobApplication had no optimistic-locking version column, unlike Interview — two
-- admins editing the same job or application concurrently would silently overwrite each
-- other's change with no conflict signal. Mirrors the pattern already used for interview.
ALTER TABLE job ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE job_application ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
