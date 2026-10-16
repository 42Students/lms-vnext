-- Proposal for SA-academics-people-59 (NOT registered by chat-6).
-- Do not deploy until the orchestrator registers a migration and upgrades the
-- first-party R2 grant, completion, thumbnail, and read-attestation contracts.
-- Existing member-owned video assets remain valid and unchanged.
ALTER TABLE lesson_video_assets
  ADD COLUMN uploader_user_id uuid REFERENCES users(id),
  ALTER COLUMN uploader_membership_id DROP NOT NULL;
ALTER TABLE lesson_video_assets
  ADD CONSTRAINT lesson_video_assets_uploader_actor_ck
  CHECK (num_nonnulls(uploader_membership_id, uploader_user_id) = 1);

-- A signed upload by a Super Admin must use owner_kind='USER', owner_id=user.id
-- in its private object key and metadata, scoped to the persisted selected
-- active college. Never put a user's ID in uploader_membership_id.
-- For legacy rows owner_kind='MEMBERSHIP', owner_id=uploader_membership_id.
-- Register together with scanner contract migration (not independently).
