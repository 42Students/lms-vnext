-- DB-007/CHAT-03. CANDIDATE SQL ONLY: NOT REGISTERED, EXECUTED OR VERIFIED.
-- Chat 1 owns drizzle/** and migration registration. This requires staged
-- profile_private_document_receipts in db04-proposed-migration.sql first.
-- Legacy BE 21bad59d4dfaf2fa11fdeaf9353327ce105697d5:
-- Qualification, BaseModel, LearnerProfileServiceImpl, StudentImageServiceImpl.
-- This is greenfield; no historical data backfill. Existing vNext
-- profile_document.education[] must not diverge from the canonical writer.

-- Reference target receipt and tenant owner atomically, rather than only
-- checking a valid receipt UUID from a different learner/college.
ALTER TABLE profile_private_document_receipts
  ADD CONSTRAINT profile_private_docs_id_owner_uq UNIQUE (id, owning_membership_id);

CREATE TABLE profile_education_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owning_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  education_type varchar(120) NOT NULL CHECK (length(trim(education_type)) > 0),
  program varchar(200),
  specialization varchar(200),
  institution_name varchar(300) NOT NULL CHECK (length(trim(institution_name)) > 0),
  start_year varchar(16),
  end_year varchar(16),
  is_currently_pursuing boolean NOT NULL DEFAULT false,
  grading_type varchar(64),
  grade varchar(100),
  max_grade varchar(100),
  is_recent_education boolean NOT NULL DEFAULT false,
  qualifying_exam varchar(120),
  exam_rank varchar(200),
  exam_details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(exam_details) = 'object'),
  degree varchar(120),
  field varchar(120),
  score varchar(120),
  description text,
  marksheet_receipt_id uuid,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_education_delete_state_ck CHECK (is_deleted = (deleted_at IS NOT NULL)),
  CONSTRAINT profile_education_same_owner_doc_fk
    FOREIGN KEY (marksheet_receipt_id, owning_membership_id)
    REFERENCES profile_private_document_receipts (id, owning_membership_id)
    ON DELETE RESTRICT
);
CREATE INDEX profile_education_member_active_idx
 ON profile_education_entries(owning_membership_id,is_deleted,is_recent_education);

-- Legacy student_image.image_data has a list of (imageId,imageUrl,active).
-- A private PROFILE_IMAGE object receipt alone does not model deactivation,
-- stable entry identity, gallery selection or ordering.
CREATE TABLE profile_image_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owning_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  image_entry_id varchar(64) NOT NULL,
  image_receipt_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  deactivated_at timestamptz,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_image_member_entry_uq UNIQUE(owning_membership_id,image_entry_id),
  CONSTRAINT profile_image_receipt_uq UNIQUE(owning_membership_id,image_receipt_id),
  CONSTRAINT profile_image_active_state_ck CHECK (is_active = (deactivated_at IS NULL)),
  CONSTRAINT profile_image_same_owner_doc_fk
    FOREIGN KEY (image_receipt_id, owning_membership_id)
    REFERENCES profile_private_document_receipts (id, owning_membership_id)
    ON DELETE RESTRICT
);
CREATE INDEX profile_image_member_active_idx
 ON profile_image_entries(owning_membership_id,is_active,display_order);

-- BLOCKERS before registration:
-- Match these to Drizzle domain schema, audit current JSON writer, choose one
-- authoritative source. Enforce receipt purpose MARKSHEET vs PROFILE_IMAGE,
-- CLEAN-scanned status and object ownership in a trusted transactional writer
-- or SQL trigger; the FK alone cannot establish purpose or scan status.
-- Test wrong-owner receipt FK, soft deletion, per-entry version, image state,
-- replay, concurrency and permissions against disposable PostgreSQL.
-- Do NOT interpret this file as DB_TESTED or API/UI parity completion.
