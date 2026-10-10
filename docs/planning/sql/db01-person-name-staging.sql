-- DB01 canonical person-name persistence candidate.
-- STAGED ONLY: W01 must add the fields to src/db/schema/users.ts through a
-- generated Drizzle migration/snapshot and replay the full journal first.

ALTER TABLE users
  ADD COLUMN given_name varchar(120),
  ADD COLUMN family_name varchar(120),
  ADD COLUMN identity_profile_version integer NOT NULL DEFAULT 1;

ALTER TABLE users
  ADD CONSTRAINT users_given_name_nonblank_ck
    CHECK (given_name IS NULL OR char_length(trim(given_name)) > 0),
  ADD CONSTRAINT users_family_name_nonblank_ck
    CHECK (family_name IS NULL OR char_length(trim(family_name)) > 0),
  ADD CONSTRAINT users_identity_profile_version_ck
    CHECK (identity_profile_version >= 1);

-- Greenfield rule:
-- - new/edited people use explicit given_name/family_name;
-- - display_name remains the presentation/cache value used by existing code;
-- - never infer first/last by splitting display_name because multi-part and
--   single-name users make that lossy.
--
-- Existing dev rows may keep NULL canonical names until edited; no production
-- legacy-data migration exists for vNext.
--
-- Email is deliberately not part of this ALTER. A profile email change must
-- use a verified Identity Platform workflow and then reconcile users.email;
-- a DB-only update would let the login identifier and platform row diverge.

-- Self-name writes use identity_profile_version as an optimistic concurrency
-- token and recompute display_name from exact given_name/family_name. Existing
-- NULL canonical names are not inferred from display_name.
