-- DB014 permanent forward-only validation of two already-registered NOT VALID
-- placement_applications same-job parent foreign keys. Source 0137/0139
-- constrain new writes; this checks existing rows before making them VALID.
-- Never disable triggers, drop constraints, rewrite data or cascade deletes.
LOCK TABLE placement_applications, placement_job_role_options, placement_job_rounds
 IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
DO $db014_scope_preflight$
BEGIN
 IF EXISTS (
   SELECT 1 FROM placement_applications a
   LEFT JOIN placement_job_role_options role ON role.id=a.role_option_id
   WHERE a.role_option_id IS NOT NULL
     AND (role.id IS NULL OR role.job_id IS DISTINCT FROM a.job_id)
 ) THEN
  RAISE EXCEPTION 'DB014 role-option parent/job mismatch; refuse validation'
    USING ERRCODE='23514';
 END IF;
 IF EXISTS (
   SELECT 1 FROM placement_applications a
   LEFT JOIN placement_job_rounds r ON r.id=a.current_round_id
   WHERE a.current_round_id IS NOT NULL
     AND (r.id IS NULL OR r.job_id IS DISTINCT FROM a.job_id)
 ) THEN
  RAISE EXCEPTION 'DB014 current-round parent/job mismatch; refuse validation'
    USING ERRCODE='23514';
 END IF;
END $db014_scope_preflight$;
--> statement-breakpoint
ALTER TABLE placement_applications
 VALIDATE CONSTRAINT placement_applications_role_option_job_fk;
--> statement-breakpoint
ALTER TABLE placement_applications
 VALIDATE CONSTRAINT placement_applications_current_round_job_fk;
