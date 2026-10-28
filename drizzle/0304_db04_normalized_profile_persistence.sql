-- DB-007 registered normalized education and private-profile persistence.
-- 0063 registered receipts; 0283 registered gallery, not recreated here.
-- New-system rows only; no old LMS production data imported.
CREATE TABLE learner_profile_education_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  education_type varchar(120) NOT NULL,
  program varchar(200),
  specialization varchar(200),
  institution_name varchar(300) NOT NULL,
  start_year integer,
  end_year integer,
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
  legacy_qualification_id integer,
  legacy_certificate_upload text,
  legacy_start_year_raw varchar(32),
  legacy_end_year_raw varchar(32),
  legacy_grade_raw varchar(120),
  legacy_max_grade_raw varchar(120),
  legacy_pursuing_raw varchar(16),
  legacy_recent_raw varchar(16),
  legacy_was_deleted boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT learner_profile_education_id_owner_uq UNIQUE (id,learner_membership_id),
  CONSTRAINT learner_profile_education_type_ck CHECK (length(trim(education_type))>0),
  CONSTRAINT learner_profile_education_institution_ck CHECK (length(trim(institution_name))>0),
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
--> statement-breakpoint
CREATE INDEX learner_profile_education_active_idx
  ON learner_profile_education_entries(learner_membership_id,archived_at);
--> statement-breakpoint
CREATE INDEX learner_profile_education_screening_idx
  ON learner_profile_education_entries(learner_membership_id,program,specialization,grading_type,end_year)
  WHERE archived_at IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX learner_profile_education_recent_uq
  ON learner_profile_education_entries(learner_membership_id)
  WHERE archived_at IS NULL AND is_recent_education;
--> statement-breakpoint
CREATE TABLE learner_profile_education_documents (
  education_entry_id uuid NOT NULL,
  learner_membership_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  purpose varchar(32) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_profile_education_documents_pk PRIMARY KEY (education_entry_id,receipt_id),
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
--> statement-breakpoint
CREATE INDEX learner_profile_education_documents_owner_idx
  ON learner_profile_education_documents(learner_membership_id,education_entry_id);
--> statement-breakpoint
CREATE INDEX learner_profile_education_legacy_source_idx ON learner_profile_education_entries(learner_membership_id,legacy_qualification_id) WHERE legacy_qualification_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE profile_private_document_receipts
  DROP CONSTRAINT IF EXISTS profile_private_doc_purpose_ck;
--> statement-breakpoint
ALTER TABLE profile_private_document_receipts
  ADD CONSTRAINT profile_private_doc_purpose_ck CHECK (
    purpose IN (
      'AADHAAR','PAN','MARKSHEET','RESUME','PROFILE_IMAGE',
      'EDUCATION_CERTIFICATE','CERTIFICATION',
      'EXPERIENCE_CERTIFICATE','OFFER_LETTER','VIDEO_INTRO'
    )
  );
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE learner_profile_private_document_bindings (
  learner_membership_id uuid NOT NULL
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  purpose varchar(32) NOT NULL,
  receipt_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_profile_private_binding_pk PRIMARY KEY (learner_membership_id,purpose),
  CONSTRAINT learner_profile_private_binding_receipt_fk
    FOREIGN KEY (receipt_id,learner_membership_id,purpose)
    REFERENCES profile_private_document_receipts
      (id,owning_membership_id,purpose)
    ON DELETE RESTRICT,
  CONSTRAINT learner_profile_private_binding_receipt_uq UNIQUE (receipt_id),
  CONSTRAINT learner_profile_private_binding_purpose_ck
    CHECK (purpose IN ('AADHAAR','PAN','RESUME'))
);
--> statement-breakpoint
CREATE FUNCTION db04_assert_private_profile_binding_usable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM profile_private_document_receipts r
     WHERE r.id = NEW.receipt_id
       AND r.owning_membership_id = NEW.learner_membership_id
       AND r.purpose = NEW.purpose
       AND r.scan_status = 'CLEAN'
       AND r.revoked_at IS NULL
       AND (r.retention_until IS NULL OR r.retention_until > now()) FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile private receipt is not usable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $;
--> statement-breakpoint
CREATE TRIGGER db04_private_profile_binding_usable_guard
  BEFORE INSERT OR UPDATE OF receipt_id,learner_membership_id,purpose
  ON learner_profile_private_document_bindings
  FOR EACH ROW EXECUTE FUNCTION db04_assert_private_profile_binding_usable();
--> statement-breakpoint
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
--> statement-breakpoint
CREATE FUNCTION db04_assert_video_intro_usable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM profile_private_document_receipts r
     WHERE r.id = NEW.receipt_id
       AND r.owning_membership_id = NEW.learner_membership_id
       AND r.purpose = 'VIDEO_INTRO'
       AND r.scan_status = 'CLEAN'
       AND r.revoked_at IS NULL
       AND (r.retention_until IS NULL OR r.retention_until > now()) FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'video intro receipt is not usable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $;
--> statement-breakpoint
CREATE TRIGGER db04_video_intro_usable_guard
  BEFORE INSERT ON learner_profile_video_intros
  FOR EACH ROW EXECUTE FUNCTION db04_assert_video_intro_usable();
--> statement-breakpoint
CREATE FUNCTION db04_video_intro_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'learner video intro is one-time immutable profile state'
    USING ERRCODE = '55000';
END; $;
--> statement-breakpoint
CREATE TRIGGER db04_video_intro_update_guard
  BEFORE UPDATE OR DELETE ON learner_profile_video_intros
  FOR EACH ROW EXECUTE FUNCTION db04_video_intro_immutable();
--> statement-breakpoint
CREATE TRIGGER db04_video_intro_no_truncate
  BEFORE TRUNCATE ON learner_profile_video_intros
  FOR EACH STATEMENT EXECUTE FUNCTION db04_video_intro_immutable();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db04_reject_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $db04_event$
BEGIN
 RAISE EXCEPTION 'profile verification event history is immutable' USING ERRCODE = '23514';
END;
$db04_event$;
--> statement-breakpoint
CREATE TRIGGER db04_profile_verification_events_immutable
 BEFORE UPDATE OR DELETE ON profile_verification_events
 FOR EACH ROW EXECUTE FUNCTION db04_reject_event_mutation();
--> statement-breakpoint
CREATE TRIGGER db04_profile_verification_events_no_truncate
 BEFORE TRUNCATE ON profile_verification_events
 FOR EACH STATEMENT EXECUTE FUNCTION db04_reject_event_mutation();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db04_check_current_revision() RETURNS trigger LANGUAGE plpgsql AS $db04_revision$
BEGIN
 IF NEW.learner_membership_id IS DISTINCT FROM OLD.learner_membership_id
    OR NEW.section IS DISTINCT FROM OLD.section THEN
   RAISE EXCEPTION 'profile verification ownership is immutable' USING ERRCODE='23514';
 END IF;
 IF NEW.row_version <> OLD.row_version+1 THEN
   RAISE EXCEPTION 'profile verification revision must increase by one' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$db04_revision$;
--> statement-breakpoint
CREATE TRIGGER db04_profile_verifications_revision
 BEFORE UPDATE ON profile_verifications
 FOR EACH ROW EXECUTE FUNCTION db04_check_current_revision();
--> statement-breakpoint
CREATE FUNCTION db04_assert_education_document_usable() RETURNS trigger LANGUAGE plpgsql AS $db04_edu$
BEGIN
 PERFORM 1 FROM profile_private_document_receipts r
 WHERE r.id=NEW.receipt_id AND r.owning_membership_id=NEW.learner_membership_id
   AND r.purpose=NEW.purpose
   AND (r.related_entry_id IS NULL OR r.related_entry_id=NEW.education_entry_id)
   AND r.scan_status='CLEAN'
   AND r.revoked_at IS NULL
   AND (r.retention_until IS NULL OR r.retention_until > now())
 FOR SHARE;
 IF NOT FOUND THEN
   RAISE EXCEPTION 'education document receipt is not usable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$db04_edu$;
--> statement-breakpoint
CREATE TRIGGER db04_education_document_usable_guard
 BEFORE INSERT OR UPDATE OF receipt_id,learner_membership_id,purpose
 ON learner_profile_education_documents
 FOR EACH ROW EXECUTE FUNCTION db04_assert_education_document_usable();
