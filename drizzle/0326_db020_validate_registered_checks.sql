-- DB020: validate five pre-existing fail-closed CHECK constraints.
-- The original forward migrations used NOT VALID to tolerate historical rows.
-- vNext is greenfield: refuse an invalid existing row rather than fabricate,
-- alter, delete or silently grandfather it. Each VALIDATE scans existing data;
-- a violated CHECK fails the migration with SQLSTATE 23514 and leaves history
-- unchanged. This migration contains no data mutations and no DDL rewrites.
ALTER TABLE identity_auth_attempts
 VALIDATE CONSTRAINT identity_auth_attempts_superseded_ck;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests
 VALIDATE CONSTRAINT placement_drive_changes_accepted_receipt_ck;
--> statement-breakpoint
ALTER TABLE placement_eligibility_decisions
 VALIDATE CONSTRAINT placement_eligibility_decisions_note_length_ck;
--> statement-breakpoint
ALTER TABLE placement_eligibility_decisions
 VALIDATE CONSTRAINT placement_eligibility_decisions_reason_length_ck;
--> statement-breakpoint
ALTER TABLE project_instances
 VALIDATE CONSTRAINT project_instances_title_length_ck;
