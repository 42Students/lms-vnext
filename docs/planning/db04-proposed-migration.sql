-- DB04 CANDIDATE ONLY. DO NOT APPLY, REGISTER OR COPY TO drizzle/
-- until DB03's Drizzle snapshot/journal is rebased, reviewed and verified.
-- This file is intentionally outside the active migration path.
-- Must be regenerated/compared to src/db/schema/profile-verification.ts
-- under disposable PostgreSQL before production adoption.

CREATE TABLE profile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  section varchar(16) NOT NULL CHECK (section IN ('EDUCATION','IDENTITY')),
  status varchar(20) NOT NULL CHECK (status IN ('SUBMITTED','SENT_BACK','VERIFIED','UPDATE_PENDING')),
  submitted_snapshot jsonb NOT NULL,
  verified_snapshot jsonb,
  submitted_at timestamptz NOT NULL,
  verified_at timestamptz,
  decided_at timestamptz,
  decided_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  decided_by_name varchar(200),
  note varchar(500),
  row_version integer NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_verifications_learner_section_uq UNIQUE (learner_membership_id,section),
  CONSTRAINT profile_verifications_verified_state_ck
    CHECK (status NOT IN ('VERIFIED','UPDATE_PENDING') OR
       (verified_snapshot IS NOT NULL AND verified_at IS NOT NULL)),
  CONSTRAINT profile_verifications_send_back_note_ck
    CHECK (status <> 'SENT_BACK' OR (note IS NOT NULL AND length(trim(note))>=3)),
  CONSTRAINT profile_verifications_id_member_uq UNIQUE (id,learner_membership_id)
);
CREATE INDEX profile_verifications_status_section_idx ON profile_verifications(status,section);
CREATE INDEX profile_verifications_learner_status_idx ON profile_verifications(learner_membership_id,status);

CREATE TABLE profile_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES profile_verifications(id) ON DELETE RESTRICT,
  action varchar(20) NOT NULL CHECK (action IN ('SUBMITTED','UPDATE_SUBMITTED','VERIFIED','SENT_BACK')),
  actor_kind varchar(20) NOT NULL CHECK (actor_kind IN ('LEARNER','COLLEGE_ADMIN','SUPER_ADMIN','TPO')),
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_name varchar(200),
  note varchar(500),
  snapshot jsonb,
  prior_version integer NOT NULL,
  next_version integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_verification_events_revision_ck
    CHECK (prior_version>=0 AND next_version=prior_version+1),
  CONSTRAINT profile_verification_events_sendback_reason_ck
    CHECK (action <> 'SENT_BACK' OR (note IS NOT NULL AND length(trim(note))>=3)),
  CONSTRAINT profile_verification_events_revision_uq UNIQUE (verification_id,next_version)
);
CREATE INDEX profile_verification_events_created_idx ON profile_verification_events(verification_id,created_at);

CREATE TABLE profile_private_document_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owning_membership_id uuid NOT NULL
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  purpose varchar(32) NOT NULL
    CHECK (purpose IN (
      'AADHAAR','PAN','MARKSHEET','RESUME','PROFILE_IMAGE',
      'EDUCATION_CERTIFICATE','CERTIFICATION',
      'EXPERIENCE_CERTIFICATE','OFFER_LETTER'
    )),
  related_entry_id uuid,
  private_object_key text NOT NULL,
  object_generation varchar(80) NOT NULL,
  sha256_hex varchar(64) NOT NULL,
  mime_type varchar(128) NOT NULL,
  size_bytes bigint NOT NULL
    CHECK (size_bytes > 0 AND size_bytes <= 26214400),
  scan_status varchar(16) NOT NULL DEFAULT 'PENDING'
    CHECK (scan_status IN ('PENDING','CLEAN','REJECTED')),
  uploaded_by_user_id uuid NOT NULL
    REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  retention_until timestamptz,
  CONSTRAINT profile_private_doc_generation_uq
    UNIQUE (private_object_key,object_generation),
  CONSTRAINT profile_private_doc_id_owner_uq
    UNIQUE (id,owning_membership_id),
  CONSTRAINT profile_private_doc_id_owner_purpose_uq
    UNIQUE (id,owning_membership_id,purpose),
  CONSTRAINT profile_private_doc_key_ck CHECK (
    private_object_key ~ '^private/[A-Za-z0-9_/-]+$'
    AND position('..' IN private_object_key)=0
    AND position('://' IN private_object_key)=0
  ),
  CONSTRAINT profile_private_doc_generation_ck
    CHECK (object_generation ~ '^[0-9]+$'),
  CONSTRAINT profile_private_doc_sha256_ck
    CHECK (sha256_hex ~ '^[0-9A-Fa-f]{64}$'),
  CONSTRAINT profile_private_doc_mimetype_ck
    CHECK (char_length(trim(mime_type)) > 0),
  CONSTRAINT profile_private_doc_retention_ck
    CHECK (retention_until IS NULL OR retention_until >= uploaded_at),
  CONSTRAINT profile_private_doc_revocation_ck
    CHECK (revoked_at IS NULL OR revoked_at >= uploaded_at)
);
CREATE INDEX profile_private_doc_member_purpose_idx
  ON profile_private_document_receipts(owning_membership_id,purpose);

-- DB04 qualification/image persistence proposal. This block is intentionally
-- ahead of current staged Drizzle and must be reviewed before integration.
CREATE TABLE learner_profile_education_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  education_type varchar(120) NOT NULL,
  program varchar(200),
  specialization varchar(200),
  institution_name varchar(300) NOT NULL,
  start_year smallint,
  end_year smallint,
  is_currently_pursuing boolean NOT NULL DEFAULT false,
  grading_type varchar(32) NOT NULL,
  grade_obtained varchar(64) NOT NULL,
  max_grade varchar(64) NOT NULL,
  is_recent_education boolean NOT NULL DEFAULT false,
  qualifying_exam varchar(120),
  exam_rank varchar(200),
  exam_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  legacy_degree varchar(100),
  legacy_field varchar(100),
  legacy_score varchar(100),
  legacy_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT learner_profile_education_id_owner_uq UNIQUE (id,learner_membership_id),
  CONSTRAINT learner_profile_education_grading_ck
    CHECK (grading_type IN ('CGPA','GPA','Percentage','Grade')),
  CONSTRAINT learner_profile_education_grade_ck
    CHECK (length(trim(grade_obtained))>0 AND length(trim(max_grade))>0),
  CONSTRAINT learner_profile_education_start_year_ck
    CHECK (start_year IS NULL OR start_year BETWEEN 1900 AND 2200),
  CONSTRAINT learner_profile_education_end_year_ck
    CHECK (end_year IS NULL OR end_year BETWEEN 1900 AND 2200),
  CONSTRAINT learner_profile_education_year_order_ck
    CHECK (start_year IS NULL OR end_year IS NULL OR end_year>=start_year),
  CONSTRAINT learner_profile_education_pursuing_ck
    CHECK (NOT is_currently_pursuing OR end_year IS NULL),
  CONSTRAINT learner_profile_education_exam_details_ck
    CHECK (jsonb_typeof(exam_details)='object')
);
CREATE INDEX learner_profile_education_active_idx
  ON learner_profile_education_entries(learner_membership_id,archived_at);
CREATE INDEX learner_profile_education_screening_idx
  ON learner_profile_education_entries(learner_membership_id,program,specialization,grading_type,end_year)
  WHERE archived_at IS NULL;
CREATE UNIQUE INDEX learner_profile_education_recent_uq
  ON learner_profile_education_entries(learner_membership_id)
  WHERE archived_at IS NULL AND is_recent_education;

CREATE TABLE learner_profile_education_documents (
  education_entry_id uuid NOT NULL,
  learner_membership_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  purpose varchar(32) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (education_entry_id,receipt_id),
  CONSTRAINT learner_profile_education_documents_education_fk
    FOREIGN KEY (education_entry_id,learner_membership_id)
    REFERENCES learner_profile_education_entries(id,learner_membership_id)
    ON DELETE RESTRICT,
  CONSTRAINT learner_profile_education_documents_receipt_fk
    FOREIGN KEY (receipt_id,learner_membership_id,purpose)
    REFERENCES profile_private_document_receipts(id,owning_membership_id,purpose)
    ON DELETE RESTRICT,
  CONSTRAINT learner_profile_education_documents_purpose_ck
    CHECK (purpose IN ('MARKSHEET','EDUCATION_CERTIFICATE'))
);
CREATE INDEX learner_profile_education_documents_owner_idx
  ON learner_profile_education_documents(learner_membership_id,education_entry_id);

CREATE TABLE learner_profile_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  receipt_id uuid NOT NULL,
  receipt_purpose varchar(32) NOT NULL DEFAULT 'PROFILE_IMAGE',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,
  CONSTRAINT learner_profile_images_receipt_fk
    FOREIGN KEY (receipt_id,learner_membership_id,receipt_purpose)
    REFERENCES profile_private_document_receipts(id,owning_membership_id,purpose)
    ON DELETE RESTRICT,
  CONSTRAINT learner_profile_images_receipt_purpose_ck
    CHECK (receipt_purpose='PROFILE_IMAGE'),
  CONSTRAINT learner_profile_images_order_ck CHECK (display_order>=0),
  CONSTRAINT learner_profile_images_active_ck
    CHECK ((is_active AND deactivated_at IS NULL) OR
           (NOT is_active AND deactivated_at IS NOT NULL)),
  CONSTRAINT learner_profile_images_owner_receipt_uq
    UNIQUE (learner_membership_id,receipt_id)
);
CREATE INDEX learner_profile_images_active_order_idx
  ON learner_profile_images(learner_membership_id,display_order)
  WHERE is_active;

CREATE TABLE profile_verification_settings (
  college_id uuid PRIMARY KEY REFERENCES colleges(id) ON DELETE RESTRICT,
  tpo_can_verify_profiles boolean NOT NULL DEFAULT true,
  cgpa_to_pct varchar(24) NOT NULL DEFAULT 'X9_5'
    CHECK (cgpa_to_pct IN ('X9_5','MINUS_0_5_X10','MINUS_0_75_X10','X10')),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profile_verification_tpo_grants (
  membership_id uuid PRIMARY KEY REFERENCES college_memberships(id) ON DELETE RESTRICT,
  granted_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
CREATE INDEX profile_verification_tpo_grants_revoked_idx
  ON profile_verification_tpo_grants(revoked_at);

CREATE TABLE profile_verification_academic_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL,
  learner_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  level varchar(16) NOT NULL CHECK (level IN ('10TH','12TH','DIPLOMA','UG','PG')),
  original_grade varchar(64) NOT NULL,
  original_scale varchar(32),
  original_max varchar(32),
  percentage_basis_points integer CHECK
    (percentage_basis_points IS NULL OR percentage_basis_points BETWEEN 0 AND 10000),
  applied_rule varchar(24) NOT NULL CHECK
    (applied_rule IN ('X9_5','MINUS_0_5_X10','MINUS_0_75_X10','X10')),
  source_snapshot_version integer NOT NULL CHECK (source_snapshot_version>0),
  verified_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  verified_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_verification_academic_marks_level_uq UNIQUE (learner_membership_id,level),
  -- Reject a forged mark pointing at another learner's verification row.
  CONSTRAINT profile_verification_academic_marks_parent_fk
    FOREIGN KEY (verification_id,learner_membership_id)
    REFERENCES profile_verifications(id,learner_membership_id) ON DELETE RESTRICT
);
CREATE INDEX profile_verification_academic_marks_verification_idx
  ON profile_verification_academic_marks(verification_id);

-- Defense in depth against database-role mutation of review history.
CREATE FUNCTION db04_reject_event_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'profile verification event history is immutable' USING ERRCODE='23514';
END $$;
CREATE TRIGGER db04_profile_verification_events_immutable
  BEFORE UPDATE OR DELETE ON profile_verification_events
  FOR EACH ROW EXECUTE FUNCTION db04_reject_event_mutation();

CREATE FUNCTION db04_check_current_revision() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.learner_membership_id IS DISTINCT FROM OLD.learner_membership_id
     OR NEW.section IS DISTINCT FROM OLD.section THEN
    RAISE EXCEPTION 'profile verification ownership is immutable' USING ERRCODE='23514';
  END IF;
  IF NEW.row_version <> OLD.row_version+1 THEN
    RAISE EXCEPTION 'profile verification revision must increase by one' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db04_profile_verifications_revision
  BEFORE UPDATE ON profile_verifications
  FOR EACH ROW EXECUTE FUNCTION db04_check_current_revision();

-- TODO before adoption: object existence / file scanning verifier, privilege
-- grants, event-retention policy, contract-schema sync, educational mark
-- publication and GCP Identity privacy test suite. Also prove the staged
-- education/image composite-FK ownership constraints, concurrent recent-row
-- uniqueness, image deactivation semantics and canonical-vs-profile-JSON sync.
