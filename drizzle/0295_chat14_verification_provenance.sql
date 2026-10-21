-- [chat-14] Source-only verification evidence and deterministic revision history.
ALTER TABLE profile_verifications ADD COLUMN IF NOT EXISTS legacy_college_id integer;
ALTER TABLE profile_verifications ADD COLUMN IF NOT EXISTS legacy_verified_by_user_id integer;
ALTER TABLE profile_verifications ADD COLUMN IF NOT EXISTS legacy_verified_at timestamptz;
ALTER TABLE profile_verification_events ADD COLUMN IF NOT EXISTS legacy_actor_id integer;
ALTER TABLE profile_verification_events ADD COLUMN IF NOT EXISTS legacy_timestamp timestamptz;
CREATE INDEX IF NOT EXISTS profile_verification_events_history_idx ON profile_verification_events(verification_id,next_version,created_at,id);
