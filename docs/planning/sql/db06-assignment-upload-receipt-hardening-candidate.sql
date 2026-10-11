-- DB-053 / DB06 SOURCE-ONLY CANDIDATE. DO NOT REGISTER INDEPENDENTLY.
--
-- Canonical structural source is src/db/schema/course-upload-receipts-staged.ts.
-- This SQL adds lifecycle/tenant/ownership enforcement that is awkward or
-- impossible to express safely as plain Drizzle column/index/check metadata.
--
-- This DB06 candidate supersedes only the DB06 course_upload_receipts section
-- of docs/planning/sql/db16-private-object-receipt-overlay-candidate.sql.
-- DB16's DB04 profile-receipt section remains separate integration input.

-- ---------------------------------------------------------------------------
-- Receipt creation scope
-- ---------------------------------------------------------------------------

CREATE FUNCTION db06_guard_course_upload_receipt_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $db06_receipt_insert$
DECLARE
  owner_college uuid;
  owner_user uuid;
  assignment_college uuid;
  assignment_offering uuid;
  content_college uuid;
  content_delivery uuid;
BEGIN
  SELECT cm.college_id, cm.user_id
    INTO owner_college, owner_user
    FROM college_memberships cm
    JOIN users u
      ON u.id = cm.user_id
     AND u.platform_status = 'ACTIVE'
    WHERE cm.id = NEW.owner_membership_id
      AND cm.status = 'ACTIVE'
    FOR SHARE OF cm, u;

  IF owner_college IS NULL
     OR owner_college IS DISTINCT FROM NEW.college_id
     OR owner_user IS DISTINCT FROM NEW.created_by_user_id THEN
    RAISE EXCEPTION
      'DB06 upload receipt owner/creator tenant mismatch'
      USING ERRCODE='23514';
  END IF;

  IF NEW.purpose = 'ASSIGNMENT_SUBMISSION' THEN
    PERFORM 1
      FROM membership_roles mr
      WHERE mr.membership_id = NEW.owner_membership_id
        AND mr.role = 'LEARNER'
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION
        'DB06 assignment upload receipt owner must be learner'
        USING ERRCODE='23514';
    END IF;

    SELECT dep.college_id, lp.offering_id
      INTO assignment_college, assignment_offering
      FROM course_assignments a
      JOIN course_lessons l ON l.id = a.lesson_id
      JOIN course_learning_paths lp ON lp.id = l.learning_path_id
      JOIN course_offerings co ON co.id = lp.offering_id
      JOIN courses c ON c.id = co.course_id
      JOIN departments dep ON dep.id = c.department_id
      WHERE a.id = NEW.assignment_id
        AND a.status = 'PUBLISHED'
        AND lp.status = 'PUBLISHED'
      FOR SHARE OF a, l, lp, co, c, dep;

    IF assignment_college IS NULL
       OR assignment_college IS DISTINCT FROM NEW.college_id
       OR NEW.delivery_id IS NULL THEN
      RAISE EXCEPTION
        'DB06 assignment upload receipt target tenant/state mismatch'
        USING ERRCODE='23514';
    END IF;

    PERFORM 1
      FROM course_assignments a
      JOIN course_section_deliveries d ON d.id = NEW.delivery_id
      WHERE a.id = NEW.assignment_id
        AND d.offering_id = assignment_offering
        AND (a.delivery_id IS NULL OR a.delivery_id = NEW.delivery_id)
      FOR SHARE OF a, d;
    IF NOT FOUND THEN
      RAISE EXCEPTION
        'DB06 assignment upload receipt delivery mismatch'
        USING ERRCODE='23514';
    END IF;

    -- Reuse registered DB06 learner/delivery roster logic (0042) so receipt
    -- grants cannot outlive or bypass section/elective learner scope.
    PERFORM db06_guard_learner_delivery(
      NEW.delivery_id,
      NEW.owner_membership_id
    );
  ELSIF NEW.purpose = 'COURSE_RESOURCE' THEN
    SELECT dep.college_id, lc.delivery_id
      INTO content_college, content_delivery
      FROM lesson_contents lc
      JOIN course_lessons l ON l.id = lc.lesson_id
      JOIN course_learning_paths lp ON lp.id = l.learning_path_id
      JOIN course_offerings co ON co.id = lp.offering_id
      JOIN courses c ON c.id = co.course_id
      JOIN departments dep ON dep.id = c.department_id
      WHERE lc.id = NEW.lesson_content_id
      FOR SHARE OF lc, l, lp, co, c, dep;

    IF content_college IS NULL
       OR content_college IS DISTINCT FROM NEW.college_id
       OR NEW.delivery_id IS DISTINCT FROM content_delivery THEN
      RAISE EXCEPTION
        'DB06 course-resource upload receipt target tenant mismatch'
        USING ERRCODE='23514';
    END IF;
  ELSE
    RAISE EXCEPTION 'DB06 unsupported course upload receipt purpose'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$db06_receipt_insert$;

CREATE TRIGGER db06_course_upload_receipt_insert_guard
BEFORE INSERT ON course_upload_receipts
FOR EACH ROW
EXECUTE FUNCTION db06_guard_course_upload_receipt_insert();

-- ---------------------------------------------------------------------------
-- Receipt lifecycle and immutable object identity
-- ---------------------------------------------------------------------------

CREATE FUNCTION db06_guard_course_upload_receipt_update()
RETURNS trigger
LANGUAGE plpgsql
AS $db06_receipt_update$
DECLARE
  submission_assignment uuid;
  submission_delivery uuid;
  submission_membership uuid;
  submission_type text;
  submission_college uuid;
BEGIN
  -- Grant/object identity is immutable from creation, not merely consumption.
  IF NEW.college_id IS DISTINCT FROM OLD.college_id
     OR NEW.owner_membership_id IS DISTINCT FROM OLD.owner_membership_id
     OR NEW.purpose IS DISTINCT FROM OLD.purpose
     OR NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
     OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
     OR NEW.lesson_content_id IS DISTINCT FROM OLD.lesson_content_id
     OR NEW.object_key IS DISTINCT FROM OLD.object_key
     OR NEW.upload_token_hash IS DISTINCT FROM OLD.upload_token_hash
     OR NEW.original_name IS DISTINCT FROM OLD.original_name
     OR NEW.declared_content_type IS DISTINCT FROM OLD.declared_content_type
     OR NEW.declared_size_bytes IS DISTINCT FROM OLD.declared_size_bytes
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION
      'DB06 upload receipt grant/object identity is immutable'
      USING ERRCODE='23514';
  END IF;

  -- Scanner outcome is one-way. An accepted/rejected object cannot be
  -- rescanned into a different persisted truth.
  IF OLD.scan_status <> 'PENDING'
     AND NEW.scan_status IS DISTINCT FROM OLD.scan_status THEN
    RAISE EXCEPTION
      'DB06 upload receipt scan result is immutable'
      USING ERRCODE='23514';
  END IF;

  -- Object attestation may be populated once, then becomes immutable.
  IF OLD.attested_generation IS NOT NULL
     AND (
       NEW.attested_generation IS DISTINCT FROM OLD.attested_generation
       OR NEW.actual_content_type IS DISTINCT FROM OLD.actual_content_type
       OR NEW.actual_size_bytes IS DISTINCT FROM OLD.actual_size_bytes
       OR NEW.sha256_hex IS DISTINCT FROM OLD.sha256_hex
       OR NEW.scan_attested_by IS DISTINCT FROM OLD.scan_attested_by
       OR NEW.scan_attested_at IS DISTINCT FROM OLD.scan_attested_at
     ) THEN
    RAISE EXCEPTION
      'DB06 upload receipt object attestation is immutable'
      USING ERRCODE='23514';
  END IF;

  -- Revocation is irreversible. The actor must be a live persisted user.
  IF OLD.revoked = true AND NEW.revoked = false THEN
    RAISE EXCEPTION 'DB06 revoked upload receipt cannot be restored'
      USING ERRCODE='23514';
  END IF;
  IF OLD.revoked = false AND NEW.revoked = true THEN
    PERFORM 1
      FROM users u
      WHERE u.id = NEW.revoked_by_user_id
        AND u.platform_status = 'ACTIVE'
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 upload receipt revoker must be active user'
        USING ERRCODE='23514';
    END IF;
  END IF;

  -- Retention can be established/extended but never shortened after it exists.
  IF OLD.retention_until IS NOT NULL
     AND (
       NEW.retention_until IS NULL
       OR NEW.retention_until < OLD.retention_until
     ) THEN
    RAISE EXCEPTION 'DB06 upload receipt retention cannot move backwards'
      USING ERRCODE='23514';
  END IF;

  -- Deletion lifecycle is one-way and timestamps cannot be rewritten.
  IF OLD.deletion_requested_at IS NOT NULL
     AND NEW.deletion_requested_at IS DISTINCT FROM OLD.deletion_requested_at THEN
    RAISE EXCEPTION 'DB06 upload receipt deletion request is immutable'
      USING ERRCODE='23514';
  END IF;
  IF OLD.deleted_at IS NOT NULL
     AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    RAISE EXCEPTION 'DB06 upload receipt deletion completion is immutable'
      USING ERRCODE='23514';
  END IF;

  -- Consumption is one-time and cannot be reassigned/cleared.
  IF OLD.consumed_at IS NOT NULL
     AND (
       NEW.consumed_at IS DISTINCT FROM OLD.consumed_at
       OR NEW.consumed_by_submission_id IS DISTINCT FROM OLD.consumed_by_submission_id
     ) THEN
    RAISE EXCEPTION 'DB06 consumed upload receipt cannot be reassigned'
      USING ERRCODE='23514';
  END IF;

  IF OLD.consumed_at IS NULL
     AND NEW.consumed_at IS NOT NULL THEN
    IF NEW.purpose <> 'ASSIGNMENT_SUBMISSION'
       OR NEW.assignment_id IS NULL
       OR NEW.consumed_by_submission_id IS NULL
       OR NEW.consumed_at > NEW.expires_at
       OR NEW.revoked = true
       OR NEW.revoked_at IS NOT NULL
       OR NEW.deleted_at IS NOT NULL
       OR NEW.deletion_requested_at IS NOT NULL
       OR NEW.scan_status <> 'CLEAN'
       OR NEW.scan_attested_by <> 'lms-vnext-privileged-scanner'
       OR NEW.scan_attested_at IS NULL
       OR NEW.scan_attested_at > NEW.consumed_at
       OR NEW.attested_generation IS NULL
       OR NEW.actual_content_type IS DISTINCT FROM NEW.declared_content_type
       OR NEW.actual_size_bytes IS DISTINCT FROM NEW.declared_size_bytes
       OR NEW.sha256_hex IS NULL
       OR NEW.retention_until IS NULL
       OR NEW.retention_until < NEW.consumed_at THEN
      RAISE EXCEPTION
        'DB06 assignment upload receipt is not safe to consume'
        USING ERRCODE='23514';
    END IF;

    SELECT s.assignment_id,
           s.delivery_id,
           s.membership_id,
           s.submission_type::text,
           dep.college_id
      INTO submission_assignment,
           submission_delivery,
           submission_membership,
           submission_type,
           submission_college
      FROM assignment_submissions s
      JOIN course_section_deliveries d ON d.id = s.delivery_id
      JOIN course_offerings co ON co.id = d.offering_id
      JOIN courses c ON c.id = co.course_id
      JOIN departments dep ON dep.id = c.department_id
      WHERE s.id = NEW.consumed_by_submission_id
      FOR SHARE OF s, d, co, c, dep;

    IF submission_assignment IS NULL
       OR submission_type <> 'FILE'
       OR submission_assignment IS DISTINCT FROM NEW.assignment_id
       OR submission_delivery IS DISTINCT FROM NEW.delivery_id
       OR submission_membership IS DISTINCT FROM NEW.owner_membership_id
       OR submission_college IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION
        'DB06 upload receipt consumption submission/owner mismatch'
        USING ERRCODE='23514';
    END IF;

    -- Assignment-specific audience must also match the submission delivery.
    PERFORM 1
      FROM course_assignments a
      JOIN course_lessons l ON l.id = a.lesson_id
      JOIN course_learning_paths lp ON lp.id = l.learning_path_id
      JOIN course_section_deliveries d ON d.id = submission_delivery
      WHERE a.id = NEW.assignment_id
        AND d.offering_id = lp.offering_id
        AND (a.delivery_id IS NULL OR a.delivery_id = submission_delivery)
      FOR SHARE OF a, l, lp, d;
    IF NOT FOUND THEN
      RAISE EXCEPTION
        'DB06 upload receipt consumption delivery mismatch'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db06_receipt_update$;

CREATE TRIGGER db06_course_upload_receipt_update_guard
BEFORE UPDATE ON course_upload_receipts
FOR EACH ROW
EXECUTE FUNCTION db06_guard_course_upload_receipt_update();

-- ---------------------------------------------------------------------------
-- Exact file-row binding and immutability
-- ---------------------------------------------------------------------------

CREATE FUNCTION db06_guard_assignment_submission_file_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $db06_file_insert$
DECLARE
  receipt_original_name text;
  receipt_purpose text;
  receipt_revoked boolean;
  receipt_deleted timestamptz;
  receipt_retention timestamptz;
BEGIN
  SELECT r.original_name,
         r.purpose,
         r.revoked,
         r.deleted_at,
         r.retention_until
    INTO receipt_original_name,
         receipt_purpose,
         receipt_revoked,
         receipt_deleted,
         receipt_retention
    FROM course_upload_receipts r
    WHERE r.id = NEW.upload_receipt_id
      AND r.consumed_by_submission_id = NEW.assignment_submission_id
      AND r.object_key = NEW.object_key
      AND r.attested_generation = NEW.object_generation
      AND r.actual_content_type = NEW.mime_type
      AND r.actual_size_bytes = NEW.size_bytes
      AND r.sha256_hex = NEW.sha256_hex
      AND r.scan_status = 'CLEAN'
      AND r.scan_attested_by = 'lms-vnext-privileged-scanner'
      AND r.scan_attested_at IS NOT NULL
      AND r.consumed_at IS NOT NULL
    FOR SHARE;

  IF receipt_purpose IS DISTINCT FROM 'ASSIGNMENT_SUBMISSION'
     OR receipt_revoked IS DISTINCT FROM false
     OR receipt_deleted IS NOT NULL
     OR receipt_retention IS NULL
     OR NEW.original_name IS DISTINCT FROM receipt_original_name THEN
    RAISE EXCEPTION
      'DB06 assignment file does not match consumed private receipt'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$db06_file_insert$;

CREATE TRIGGER db06_assignment_submission_file_insert_guard
BEFORE INSERT ON assignment_submission_files
FOR EACH ROW
EXECUTE FUNCTION db06_guard_assignment_submission_file_insert();

CREATE FUNCTION db06_reject_assignment_file_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $db06_file_immutable$
BEGIN
  RAISE EXCEPTION 'DB06 assignment private-file evidence is immutable'
    USING ERRCODE='23514';
END;
$db06_file_immutable$;

CREATE TRIGGER db06_assignment_submission_files_no_update_delete
BEFORE UPDATE OR DELETE ON assignment_submission_files
FOR EACH ROW
EXECUTE FUNCTION db06_reject_assignment_file_history_mutation();

CREATE TRIGGER db06_assignment_submission_files_no_truncate
BEFORE TRUNCATE ON assignment_submission_files
FOR EACH STATEMENT
EXECUTE FUNCTION db06_reject_assignment_file_history_mutation();

CREATE TRIGGER db06_course_upload_receipts_no_delete
BEFORE DELETE ON course_upload_receipts
FOR EACH ROW
EXECUTE FUNCTION db06_reject_assignment_file_history_mutation();

CREATE TRIGGER db06_course_upload_receipts_no_truncate
BEFORE TRUNCATE ON course_upload_receipts
FOR EACH STATEMENT
EXECUTE FUNCTION db06_reject_assignment_file_history_mutation();

-- ---------------------------------------------------------------------------
-- Producer/read cutover requirements
-- ---------------------------------------------------------------------------
-- 1. readPrivateObjectAttestation must require and return a trusted
--    scan_attested_at value from privileged scanner metadata. Do not synthesize
--    the scanner timestamp in the application/database.
-- 2. Persist input.deliveryId on every ASSIGNMENT_SUBMISSION receipt. Legacy
--    submission_assets is a list and may consume multiple unique receipts, so
--    consumed_by_submission_id is intentionally NOT unique and
--    assignment_submission_files is an ordered many-row relation.
-- 3. FILE submission transaction order must become:
--      INSERT assignment_submissions
--      -> UPDATE/consume course_upload_receipts with CLEAN attestation,
--         scan actor/time and explicit retention_until
--      -> INSERT assignment_submission_files.
--    The composite FK deliberately makes the current file-before-receipt order
--    invalid once this schema is promoted.
-- 4. Receipt consumption must use a CAS predicate:
--      consumed_at IS NULL AND revoked=false AND deleted_at IS NULL
--    plus the exact owner/assignment/college identity.
-- 5. createAssignmentFileReadGrant must join the receipt and refuse signed reads
--    when revoked, deleted, pending/rejected, attestation mismatched, or after
--    the domain's read-retention policy no longer permits access.
-- 6. Revocation/deletion service operations must write actor/time/reason and
--    never mutate object identity or immutable file evidence.
-- 7. The DB06_ASSIGNMENT_FILES_READY gate must remain fail-closed until the
--    numbered migration, producer cutover, read-path cutover and all witnesses
--    execute successfully.

-- Required PostgreSQL/runtime witnesses before promotion:
-- A wrong-college/owner/creator receipt INSERT fails.
-- B assignment receipt owner without LEARNER role fails.
-- C wrong assignment/course target tenant fails.
-- D malformed private object namespace/token hash/expiry fails.
-- E PENDING->CLEAN with exact privileged scanner + attestation succeeds once.
-- F CLEAN/REJECTED scan outcome and attestation cannot be rewritten.
-- G consume after expiry, revoked/deleting/deleted, unscanned or mismatched
--   MIME/size fails.
-- H consume against wrong assignment/member/college/delivery/submission type
--   fails; a receipt granted for delivery A cannot be consumed in delivery B.
-- I consumed receipt cannot be reassigned/unconsumed.
-- J retention cannot move backwards; deletion cannot begin before retention.
-- K file INSERT before receipt consumption fails composite FK/guard.
-- L exact consumed receipt -> file row succeeds; multiple distinct consumed
--   receipts may bind to one submission at unique sequence positions.
-- M file key/generation/MIME/size/hash/name drift fails.
-- N file UPDATE/DELETE/TRUNCATE and receipt DELETE/TRUNCATE fail.
-- O second concurrent consumer loses the receipt CAS.
-- P revocation actor/time/reason is durable and later signed read fails.
-- Q deleted/revoked receipt cannot issue signed read.
-- R zero-to-head migration/schema snapshot and readiness gate pass.
