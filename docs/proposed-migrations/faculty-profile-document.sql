-- STAGED/PROPOSED ONLY. Do not apply automatically; migration owner registers this.
-- Existing faculty_profiles is the same-college membership-keyed table.
ALTER TABLE faculty_profiles
  ADD COLUMN IF NOT EXISTS profile_document jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE faculty_profiles
  ADD COLUMN IF NOT EXISTS profile_document_version integer NOT NULL DEFAULT 0;
ALTER TABLE faculty_profiles
  ADD CONSTRAINT faculty_profiles_document_version_nonnegative
  CHECK (profile_document_version >= 0);
-- Keep identity numbers and contact login fields out of the profile JSON.
