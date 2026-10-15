-- T-S1-01 PROPOSAL ONLY. The orchestrator must register migration/schema,
-- lock writers, verify tenant constraints, replay DB and enable runtime checks.
-- Do not grant access based only on a historic ACTIVE status.
ALTER TABLE placement_recruiter_college_grants
 ADD COLUMN valid_until timestamptz,
 ADD COLUMN capabilities text[] NOT NULL DEFAULT ARRAY['DRIVES']::text[],
 ADD COLUMN verification_status varchar(24) NOT NULL DEFAULT 'PENDING',
 ADD COLUMN revoke_reason text;
ALTER TABLE placement_recruiter_college_grants
 ADD CONSTRAINT placement_recruiter_grant_verification_ck
 CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED')),
 ADD CONSTRAINT placement_recruiter_grant_validity_ck
 CHECK (valid_until IS NULL OR valid_until > created_at),
 ADD CONSTRAINT placement_recruiter_grant_capabilities_ck
 CHECK (cardinality(capabilities) > 0 AND
   capabilities <@ ARRAY['DRIVES','APPLICANT_EXPORT','INTERVIEWS','MESSAGES']::text[]);
CREATE INDEX placement_recruiter_grant_validity_idx
 ON placement_recruiter_college_grants (recruiter_user_id, valid_until)
 WHERE status = 'ACTIVE';
CREATE TABLE placement_recruiter_access_policies (
 college_id uuid PRIMARY KEY REFERENCES colleges(id) ON DELETE RESTRICT,
 recruiter_access_months smallint NOT NULL
   CHECK (recruiter_access_months BETWEEN 1 AND 60),
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Historical ACTIVE grants: require owner-reviewed expiry/verification
-- backfill before any code uses them. Do NOT auto-mark verified.
-- Runtime identity/context-service and grant write/renewal must use
-- valid_until + verification + per-college recruiter_access_months atomically.
