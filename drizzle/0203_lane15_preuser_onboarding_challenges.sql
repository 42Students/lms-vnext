CREATE TABLE IF NOT EXISTS identity_preuser_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 channel varchar(12) NOT NULL,
 source varchar(16) NOT NULL,
 contact_fingerprint varchar(64) NOT NULL,
 roll_fingerprint varchar(64),
 code_mac varchar(64) NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 verified_at timestamptz, consumed_at timestamptz, revoked_at timestamptz,
 CONSTRAINT identity_preuser_channel_ck CHECK (channel IN ('EMAIL','PHONE')),
 CONSTRAINT identity_preuser_source_ck CHECK (source IN ('CONTACT','ROLL')),
 CONSTRAINT identity_preuser_roll_shape_ck CHECK ((source='ROLL')=(roll_fingerprint IS NOT NULL)),
 CONSTRAINT identity_preuser_hash_ck CHECK(
  contact_fingerprint ~ '^[0-9a-f]{64}$' AND code_mac ~ '^[0-9a-f]{64}$'
  AND (roll_fingerprint IS NULL OR roll_fingerprint ~ '^[0-9a-f]{64}$')),
 CONSTRAINT identity_preuser_attempts_ck CHECK(attempts BETWEEN 0 AND 5),
 CONSTRAINT identity_preuser_ttl_ck CHECK(expires_at>created_at AND
  expires_at<=created_at+interval '5 minutes'),
 CONSTRAINT identity_preuser_state_ck CHECK(
  (verified_at IS NULL OR (verified_at>=created_at AND verified_at<expires_at))
  AND (consumed_at IS NULL OR (verified_at IS NOT NULL AND consumed_at>=verified_at))
  AND (revoked_at IS NULL OR revoked_at>=created_at))
);
CREATE INDEX IF NOT EXISTS identity_preuser_contact_rate_idx
 ON identity_preuser_challenges(college_id,contact_fingerprint,created_at);
CREATE INDEX IF NOT EXISTS identity_preuser_roll_rate_idx
 ON identity_preuser_challenges(college_id,roll_fingerprint,created_at)
 WHERE roll_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS identity_preuser_expiry_idx ON identity_preuser_challenges(expires_at);
