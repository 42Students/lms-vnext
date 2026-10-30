-- DB-014 / DB-066 scoped validation preflight, NOT a registered migration.
-- Only L01 may register the forward-only promotion after domain-owner review.
-- Existing 0137 and 0139 FKs are already enforced for new writes, but remain
-- NOT VALID for historical rows. A clean greenfield replay alone is insufficient
-- to certify that all existing application rows satisfy both parent scopes.
-- No data rewrite, disable-trigger, DROP CONSTRAINT or CASCADE is authorized.

DO $db014_placement_fk_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM placement_applications a
      LEFT JOIN placement_job_role_options role ON role.id = a.role_option_id
     WHERE a.role_option_id IS NOT NULL
       AND (role.id IS NULL OR role.job_id IS DISTINCT FROM a.job_id)
  ) THEN
    RAISE EXCEPTION 'DB014 role-option parent/job mismatch; refuse validation'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM placement_applications a
      LEFT JOIN placement_job_rounds round ON round.id = a.current_round_id
     WHERE a.current_round_id IS NOT NULL
       AND (round.id IS NULL OR round.job_id IS DISTINCT FROM a.job_id)
  ) THEN
    RAISE EXCEPTION 'DB014 current-round parent/job mismatch; refuse validation'
      USING ERRCODE = '23514';
  END IF;
END;
$db014_placement_fk_preflight$;
--> statement-breakpoint
ALTER TABLE placement_applications
  VALIDATE CONSTRAINT placement_applications_role_option_job_fk;
--> statement-breakpoint
ALTER TABLE placement_applications
  VALIDATE CONSTRAINT placement_applications_current_round_job_fk;

-- Before permanent registration: PG17 catalog must report both convalidated=t,
-- cross-job historical bad rows must fail preflight, direct bad INSERT/UPDATE
-- remains SQLSTATE 23503, and L01 must run registered zero-to-head replay.
