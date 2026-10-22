-- Historical recruiter grants: provenance cannot create entitlements.
-- NULL valid_until remains fail-closed; unrecognized capabilities stay audit-only.
ALTER TABLE placement_recruiter_college_grants
  ADD COLUMN IF NOT EXISTS legacy_import_metadata jsonb;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_recruiter_college_grants
  ADD CONSTRAINT placement_recruiter_grant_legacy_metadata_ck
  CHECK (legacy_import_metadata IS NULL OR jsonb_typeof(legacy_import_metadata) = 'object')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
-- Enforce the legacy 500-character bound without truncating historical reasons.
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_recruiter_college_grants ADD CONSTRAINT placement_recruiter_grant_revoke_reason_length_ck
  CHECK (revoke_reason IS NULL OR length(revoke_reason) <= 500)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
