-- DB020: safe registered parity for otherwise missing physical index/CHECK/default
-- contracts. Never promote Drizzle's duplicate generated CREATE TABLE SQL.
-- All changes are additive and preserve existing legacy NULL data.
ALTER TABLE project_instances
  ALTER COLUMN sprint_length_weeks SET DEFAULT 4;
--> statement-breakpoint
ALTER TABLE messaging_delivery_receipts
  ADD CONSTRAINT messaging_receipts_failure_summary_len_ck
  CHECK (safe_failure_summary IS NULL OR length(safe_failure_summary) <= 180);
--> statement-breakpoint
ALTER TABLE messaging_sms_delivery_attempts
  ADD CONSTRAINT messaging_sms_attempts_summary_ck
  CHECK (safe_failure_summary IS NULL OR length(safe_failure_summary) <= 180);
--> statement-breakpoint
CREATE INDEX messaging_sms_attempts_command_idx
  ON messaging_sms_delivery_attempts(command_id, attempted_at);
--> statement-breakpoint
CREATE INDEX db10_bug_report_attachments_limit_idx
  ON bug_report_attachments(bug_report_id,id);
