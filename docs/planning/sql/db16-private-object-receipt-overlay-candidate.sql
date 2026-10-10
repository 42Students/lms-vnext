-- DB-016 SOURCE-ONLY OVERLAY. NOT registered in drizzle/meta/_journal.json.
-- This file is migration-integrator input for receipt tables that already have
-- staged source definitions. It deliberately does not create a new universal
-- table and does not invent bug-tracker reporter ownership.
--
-- Preconditions before promotion:
--   * profile_private_document_receipts comes from DB04 candidate/schema;
--   * course_upload_receipts comes from DB06 staged candidate/schema;
--   * exact generated Drizzle migration must be reconciled with both owners;
--   * DB-001 PostgreSQL replay/negative witnesses must execute.

-- ---------------------------------------------------------------------------
-- DB04 profile/private evidence receipts
-- ---------------------------------------------------------------------------
ALTER TABLE profile_private_document_receipts
  ADD COLUMN scan_attested_by varchar(160),
  ADD COLUMN scan_attested_at timestamptz,
  ADD COLUMN revoked_by_user_id uuid
    REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN revocation_reason varchar(1000),
  ADD COLUMN deletion_requested_at timestamptz,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE profile_private_document_receipts
  ADD CONSTRAINT profile_private_doc_scan_attestation_ck
    CHECK (
      (scan_status = 'CLEAN'
        AND scan_attested_by IS NOT NULL
        AND length(trim(scan_attested_by)) > 0
        AND scan_attested_at IS NOT NULL)
      OR
      (scan_status <> 'CLEAN'
        AND scan_attested_by IS NULL
        AND scan_attested_at IS NULL)
    ),
  ADD CONSTRAINT profile_private_doc_revocation_shape_ck
    CHECK (
      (revoked_at IS NULL
        AND revoked_by_user_id IS NULL
        AND revocation_reason IS NULL)
      OR
      (revoked_at IS NOT NULL
        AND revoked_by_user_id IS NOT NULL
        AND revocation_reason IS NOT NULL
        AND length(trim(revocation_reason)) >= 3
        AND revoked_at >= uploaded_at)
    ),
  ADD CONSTRAINT profile_private_doc_deletion_shape_ck
    CHECK (
      (deletion_requested_at IS NULL AND deleted_at IS NULL)
      OR
      (deletion_requested_at IS NOT NULL
        AND deletion_requested_at >= uploaded_at
        AND (deleted_at IS NULL OR deleted_at >= deletion_requested_at))
    );

-- Object identity/attestation is append-once. Lifecycle metadata is intentionally
-- excluded from this immutability list so revocation/retention/deletion state can
-- advance through explicit service transitions.
CREATE OR REPLACE FUNCTION db16_guard_profile_receipt_object_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.owning_membership_id IS DISTINCT FROM OLD.owning_membership_id
     OR NEW.purpose IS DISTINCT FROM OLD.purpose
     OR NEW.related_entry_id IS DISTINCT FROM OLD.related_entry_id
     OR NEW.private_object_key IS DISTINCT FROM OLD.private_object_key
     OR NEW.object_generation IS DISTINCT FROM OLD.object_generation
     OR NEW.sha256_hex IS DISTINCT FROM OLD.sha256_hex
     OR NEW.mime_type IS DISTINCT FROM OLD.mime_type
     OR NEW.size_bytes IS DISTINCT FROM OLD.size_bytes
     OR NEW.uploaded_by_user_id IS DISTINCT FROM OLD.uploaded_by_user_id
     OR NEW.uploaded_at IS DISTINCT FROM OLD.uploaded_at THEN
    RAISE EXCEPTION
      'private document receipt object identity is immutable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db16_profile_receipt_identity_immutable
BEFORE UPDATE ON profile_private_document_receipts
FOR EACH ROW
EXECUTE FUNCTION db16_guard_profile_receipt_object_identity();

-- ---------------------------------------------------------------------------
-- DB06 assignment/course upload receipts
-- ---------------------------------------------------------------------------
-- Preserve the staged boolean during transition, but couple it to richer
-- lifecycle evidence. A future clean migration may remove the redundant boolean
-- once all consumers use revoked_at.
ALTER TABLE course_upload_receipts
  ADD COLUMN scan_status varchar(16) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN scan_attested_by varchar(160),
  ADD COLUMN scan_attested_at timestamptz,
  ADD COLUMN revoked_at timestamptz,
  ADD COLUMN revoked_by_user_id uuid
    REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN revocation_reason varchar(1000),
  ADD COLUMN retention_until timestamptz,
  ADD COLUMN deletion_requested_at timestamptz,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE course_upload_receipts
  ADD CONSTRAINT course_upload_receipts_scan_status_ck
    CHECK (scan_status IN ('PENDING','CLEAN','REJECTED')),
  ADD CONSTRAINT course_upload_receipts_scan_attestation_ck
    CHECK (
      (scan_status = 'CLEAN'
        AND scan_attested_by IS NOT NULL
        AND length(trim(scan_attested_by)) > 0
        AND scan_attested_at IS NOT NULL)
      OR
      (scan_status <> 'CLEAN'
        AND scan_attested_by IS NULL
        AND scan_attested_at IS NULL)
    ),
  ADD CONSTRAINT course_upload_receipts_revocation_shape_ck
    CHECK (
      (revoked = false
        AND revoked_at IS NULL
        AND revoked_by_user_id IS NULL
        AND revocation_reason IS NULL)
      OR
      (revoked = true
        AND revoked_at IS NOT NULL
        AND revoked_by_user_id IS NOT NULL
        AND revocation_reason IS NOT NULL
        AND length(trim(revocation_reason)) >= 3
        AND revoked_at >= created_at)
    ),
  ADD CONSTRAINT course_upload_receipts_retention_ck
    CHECK (retention_until IS NULL OR retention_until >= created_at),
  ADD CONSTRAINT course_upload_receipts_deletion_shape_ck
    CHECK (
      (deletion_requested_at IS NULL AND deleted_at IS NULL)
      OR
      (deletion_requested_at IS NOT NULL
        AND deletion_requested_at >= created_at
        AND (deleted_at IS NULL OR deleted_at >= deletion_requested_at))
    ),
  ADD CONSTRAINT course_upload_receipts_consumed_clean_ck
    CHECK (
      consumed_at IS NULL
      OR (
        scan_status = 'CLEAN'
        AND scan_attested_by IS NOT NULL
        AND scan_attested_at IS NOT NULL
        AND revoked = false
        AND revoked_at IS NULL
        AND attested_generation IS NOT NULL
        AND actual_content_type IS NOT NULL
        AND actual_size_bytes IS NOT NULL
        AND sha256_hex IS NOT NULL
      )
    );

CREATE OR REPLACE FUNCTION db16_guard_course_receipt_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.consumed_at IS NOT NULL
     AND (
       NEW.college_id IS DISTINCT FROM OLD.college_id
       OR NEW.owner_membership_id IS DISTINCT FROM OLD.owner_membership_id
       OR NEW.purpose IS DISTINCT FROM OLD.purpose
       OR NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
       OR NEW.lesson_content_id IS DISTINCT FROM OLD.lesson_content_id
       OR NEW.object_key IS DISTINCT FROM OLD.object_key
       OR NEW.upload_token_hash IS DISTINCT FROM OLD.upload_token_hash
       OR NEW.original_name IS DISTINCT FROM OLD.original_name
       OR NEW.declared_content_type IS DISTINCT FROM OLD.declared_content_type
       OR NEW.declared_size_bytes IS DISTINCT FROM OLD.declared_size_bytes
       OR NEW.attested_generation IS DISTINCT FROM OLD.attested_generation
       OR NEW.actual_content_type IS DISTINCT FROM OLD.actual_content_type
       OR NEW.actual_size_bytes IS DISTINCT FROM OLD.actual_size_bytes
       OR NEW.sha256_hex IS DISTINCT FROM OLD.sha256_hex
       OR NEW.consumed_at IS DISTINCT FROM OLD.consumed_at
       OR NEW.consumed_by_submission_id IS DISTINCT FROM OLD.consumed_by_submission_id
     ) THEN
    RAISE EXCEPTION
      'consumed course upload receipt identity is immutable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db16_course_receipt_identity_immutable
BEFORE UPDATE ON course_upload_receipts
FOR EACH ROW
EXECUTE FUNCTION db16_guard_course_receipt_identity();

-- ---------------------------------------------------------------------------
-- Not promoted by this overlay
-- ---------------------------------------------------------------------------
-- bug_report_attachments:
--   Current DB10 draft lacks a settled private owner type. A reporter-access
--   identity is not necessarily a college membership, so this overlay refuses
--   to fabricate college/member ownership. DB10 must first define an issue or
--   reporter-owner private namespace, then add generation/hash/CLEAN scanner
--   attestation/revocation/retention fields and signed-read authorization.
--
-- project_resources / project submissions:
--   Current product fields are validated HTTP(S) external links. No private-file
--   DDL is added here. If file uploads become a product requirement, create a
--   separate receipt-backed relation rather than storing signed GCS URLs in
--   those external-link columns.
--
-- encryption:
--   Schema cannot prove the bucket/database encryption configuration. Promotion
--   evidence must separately witness the approved KMS/provider-encryption,
--   lifecycle/versioning/retention, UBLA, PAP and scanner configuration.

-- Required PostgreSQL witnesses before promotion:
-- 1. object identity mutation fails after receipt creation/consumption.
-- 2. consumed assignment receipt must be CLEAN and non-revoked.
-- 3. revocation requires actor/time/reason and blocks effective use.
-- 4. retention/deletion timestamps cannot move backwards or predate creation.
-- 5. cross-college/member and wrong-purpose bindings fail in the owning DB04/
--    DB06 domain constraints.
-- 6. zero-to-head replay and generated Drizzle snapshot/journal match.
