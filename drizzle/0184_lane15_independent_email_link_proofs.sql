-- Legacy email-link verification is distinct from five-minute OTP challenges.
-- No plaintext email/token, roll or password is migrated.
ALTER TABLE identity_auth_attempts
 ADD COLUMN IF NOT EXISTS legacy_account_id integer,
 ADD COLUMN IF NOT EXISTS legacy_account_type varchar(24),
 ADD COLUMN IF NOT EXISTS blocked_until timestamptz,
 ADD COLUMN IF NOT EXISTS superseded_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS identity_auth_attempts_user_contact_state_idx
 ON identity_auth_attempts(user_id,contact_fingerprint,target_role,created_at);
--> statement-breakpoint
ALTER TABLE identity_auth_attempts ADD CONSTRAINT identity_auth_attempts_superseded_ck
 CHECK (superseded_at IS NULL OR superseded_at>=created_at) NOT VALID;
--> statement-breakpoint
CREATE TABLE identity_email_verification_links(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 college_id uuid REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
 application_id uuid REFERENCES placement_applications(id) ON DELETE RESTRICT,
 legacy_application_id varchar(36),
 email_fingerprint varchar(64) NOT NULL,
 email_key_version varchar(16) NOT NULL,
 token_digest varchar(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 verified_at timestamptz,
 revoked_at timestamptz,
 CONSTRAINT identity_email_link_membership_scope_fk
  FOREIGN KEY(membership_id,user_id,college_id)
  REFERENCES college_memberships(id,user_id,college_id) ON DELETE RESTRICT,
 CONSTRAINT identity_email_link_shape_ck CHECK(
  (membership_id IS NULL OR college_id IS NOT NULL)
  AND (application_id IS NULL OR (membership_id IS NOT NULL AND college_id IS NOT NULL))
  AND email_fingerprint ~ '^[0-9a-f]{64}$'
  AND token_digest ~ '^[0-9a-f]{64}$'
  AND length(trim(email_key_version)) BETWEEN 1 AND 16),
 CONSTRAINT identity_email_link_ttl_ck CHECK(
  expires_at > created_at AND expires_at <= created_at+interval '24 hours'
  AND (verified_at IS NULL OR (verified_at>=created_at AND verified_at<=expires_at))
  AND (revoked_at IS NULL OR revoked_at>=created_at))
);
--> statement-breakpoint
CREATE UNIQUE INDEX identity_email_link_digest_uq
 ON identity_email_verification_links(token_digest);
--> statement-breakpoint
CREATE INDEX identity_email_link_contact_idx
 ON identity_email_verification_links(email_fingerprint,created_at);
--> statement-breakpoint
CREATE INDEX identity_email_link_application_idx
 ON identity_email_verification_links(application_id,created_at)
 WHERE application_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX identity_email_link_expiry_idx
 ON identity_email_verification_links(expires_at)
 WHERE verified_at IS NULL AND revoked_at IS NULL;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION identity_email_link_scope_guard() RETURNS trigger
 LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.application_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM placement_applications a
  JOIN placement_jobs j ON j.id=a.job_id
  JOIN college_memberships m ON m.id=a.membership_id
  WHERE a.id=NEW.application_id AND a.membership_id=NEW.membership_id
   AND j.college_id=NEW.college_id AND m.college_id=NEW.college_id
   AND m.user_id=NEW.user_id
 ) THEN
  RAISE EXCEPTION 'Email verification application does not belong to this learner'
   USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER identity_email_link_scope_guard_trg
 BEFORE INSERT OR UPDATE OF application_id,membership_id,college_id,user_id
 ON identity_email_verification_links
 FOR EACH ROW EXECUTE FUNCTION identity_email_link_scope_guard();
--> statement-breakpoint
CREATE TABLE identity_email_ownership_proofs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 email_fingerprint varchar(64) NOT NULL,
 email_key_version varchar(16) NOT NULL,
 verification_link_id uuid NOT NULL REFERENCES identity_email_verification_links(id)
  ON DELETE RESTRICT,
 verified_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT identity_email_proof_state_ck CHECK(
  email_fingerprint ~ '^[0-9a-f]{64}$'
  AND length(trim(email_key_version)) BETWEEN 1 AND 16
  AND (revoked_at IS NULL OR revoked_at>=verified_at))
);
--> statement-breakpoint
CREATE UNIQUE INDEX identity_email_proof_active_uq
 ON identity_email_ownership_proofs(user_id,email_fingerprint)
 WHERE revoked_at IS NULL;
--> statement-breakpoint
CREATE INDEX identity_email_proof_link_idx
 ON identity_email_ownership_proofs(verification_link_id);
