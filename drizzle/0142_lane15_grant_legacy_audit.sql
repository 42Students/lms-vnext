-- Historical recruiter grants: provenance cannot create entitlements.
-- NULL valid_until remains fail-closed; unrecognized capabilities stay audit-only.
ALTER TABLE placement_recruiter_college_grants
  ADD COLUMN legacy_import_metadata jsonb;
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants
  ADD CONSTRAINT placement_recruiter_grant_legacy_metadata_ck
  CHECK (legacy_import_metadata IS NULL OR jsonb_typeof(legacy_import_metadata) = 'object');
--> statement-breakpoint
-- Enforce the legacy 500-character bound without truncating historical reasons.
ALTER TABLE placement_recruiter_college_grants ADD CONSTRAINT placement_recruiter_grant_revoke_reason_length_ck
  CHECK (revoke_reason IS NULL OR length(revoke_reason) <= 500);
