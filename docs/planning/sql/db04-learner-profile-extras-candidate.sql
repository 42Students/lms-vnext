-- DB04 learner profile gap closure candidate.
-- SOURCE/STAGING ONLY. NOT A REGISTERED MIGRATION. NOT EXECUTED.
-- W01/Chat1 owns schema-barrel export, migration generation and replay.

-- Extend the private receipt purpose vocabulary exactly once when DB04 is
-- promoted. This preserves the active one-time learner video-intro user job
-- without storing arbitrary public URLs as canonical identity.
ALTER TABLE profile_private_document_receipts
  DROP CONSTRAINT IF EXISTS profile_private_doc_purpose_ck;
ALTER TABLE profile_private_document_receipts
  ADD CONSTRAINT profile_private_doc_purpose_ck CHECK (
    purpose IN (
      'AADHAAR','PAN','MARKSHEET','RESUME','PROFILE_IMAGE',
      'EDUCATION_CERTIFICATE','CERTIFICATION',
      'EXPERIENCE_CERTIFICATE','OFFER_LETTER','VIDEO_INTRO'
    )
  );

CREATE TABLE learner_profile_identity_summaries (
  learner_membership_id uuid PRIMARY KEY
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  aadhaar_last4 varchar(4),
  pan_last4 varchar(4),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_profile_identity_aadhaar_last4_ck
    CHECK (aadhaar_last4 IS NULL OR aadhaar_last4 ~ '^[0-9]{4}$'),
  CONSTRAINT learner_profile_identity_pan_last4_ck
    CHECK (pan_last4 IS NULL OR pan_last4 ~ '^[A-Z0-9]{4}$')
);

CREATE TABLE learner_profile_private_document_bindings (
  learner_membership_id uuid NOT NULL
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  purpose varchar(32) NOT NULL,
  receipt_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (learner_membership_id,purpose),
  CONSTRAINT learner_profile_private_binding_receipt_fk
    FOREIGN KEY (receipt_id,learner_membership_id,purpose)
    REFERENCES profile_private_document_receipts
      (id,owning_membership_id,purpose)
    ON DELETE RESTRICT,
  CONSTRAINT learner_profile_private_binding_receipt_uq UNIQUE (receipt_id),
  CONSTRAINT learner_profile_private_binding_purpose_ck
    CHECK (purpose IN ('AADHAAR','PAN','RESUME'))
);

CREATE FUNCTION db04_assert_private_profile_binding_usable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM profile_private_document_receipts r
     WHERE r.id = NEW.receipt_id
       AND r.owning_membership_id = NEW.learner_membership_id
       AND r.purpose = NEW.purpose
       AND r.scan_status = 'CLEAN'
       AND r.revoked_at IS NULL
       AND (r.retention_until IS NULL OR r.retention_until > now())
  ) THEN
    RAISE EXCEPTION 'profile private receipt is not usable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db04_private_profile_binding_usable_guard
  BEFORE INSERT OR UPDATE OF receipt_id,learner_membership_id,purpose
  ON learner_profile_private_document_bindings
  FOR EACH ROW EXECUTE FUNCTION db04_assert_private_profile_binding_usable();

CREATE TABLE learner_profile_video_intros (
  learner_membership_id uuid PRIMARY KEY
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  receipt_id uuid NOT NULL,
  receipt_purpose varchar(32) NOT NULL DEFAULT 'VIDEO_INTRO',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_profile_video_intro_receipt_fk
    FOREIGN KEY (receipt_id,learner_membership_id,receipt_purpose)
    REFERENCES profile_private_document_receipts
      (id,owning_membership_id,purpose)
    ON DELETE RESTRICT,
  CONSTRAINT learner_profile_video_intro_receipt_uq UNIQUE (receipt_id),
  CONSTRAINT learner_profile_video_intro_purpose_ck
    CHECK (receipt_purpose='VIDEO_INTRO'),
  CONSTRAINT learner_profile_video_intro_time_ck
    CHECK (uploaded_at <= now() + interval '5 minutes')
);

CREATE FUNCTION db04_assert_video_intro_usable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM profile_private_document_receipts r
     WHERE r.id = NEW.receipt_id
       AND r.owning_membership_id = NEW.learner_membership_id
       AND r.purpose = 'VIDEO_INTRO'
       AND r.scan_status = 'CLEAN'
       AND r.revoked_at IS NULL
       AND (r.retention_until IS NULL OR r.retention_until > now())
  ) THEN
    RAISE EXCEPTION 'video intro receipt is not usable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db04_video_intro_usable_guard
  BEFORE INSERT ON learner_profile_video_intros
  FOR EACH ROW EXECUTE FUNCTION db04_assert_video_intro_usable();

CREATE FUNCTION db04_video_intro_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'learner video intro is one-time immutable profile state'
    USING ERRCODE = '55000';
END $$;
CREATE TRIGGER db04_video_intro_update_guard
  BEFORE UPDATE OR DELETE ON learner_profile_video_intros
  FOR EACH ROW EXECUTE FUNCTION db04_video_intro_immutable();

-- profile_document API-schema additions (not SQL columns):
-- address.currentCity/currentState/currentPincode
-- address.permanentCity/permanentState/permanentPincode
-- socialProfiles.codingProfiles with the legacy closed platform vocabulary:
-- LEETCODE,HACKERRANK,CODECHEF,CODEFORCES,GFG,HACKEREARTH.
--
-- Required PG witnesses before promotion:
-- wrong owner/purpose binding -> reject
-- PENDING/REJECTED/revoked/expired receipt -> reject
-- duplicate purpose binding -> deterministic replace transaction or conflict
-- raw Aadhaar/PAN never stored in summary or generic profile JSON
-- VIDEO_INTRO second insert/update/delete -> reject
-- same receipt cannot bind twice
