-- [chat-14] ACCEPT is not proof that the job was patched.
ALTER TABLE placement_drive_change_requests
  ADD COLUMN IF NOT EXISTS applied_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests
  ADD COLUMN IF NOT EXISTS applied_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests
  ADD COLUMN IF NOT EXISTS applied_job_version integer;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests
  ADD CONSTRAINT placement_drive_changes_applied_ck CHECK (
    (applied_at IS NULL AND applied_by_user_id IS NULL AND applied_job_version IS NULL)
    OR (status = 'ACCEPTED' AND mode = 'SUGGEST' AND
        applied_at IS NOT NULL AND applied_by_user_id IS NOT NULL AND applied_job_version > 0)
  );
