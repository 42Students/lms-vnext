-- [chat-14] Preserve unsupported historical group criteria instead of broad auto assignment.
ALTER TABLE lms_groups ADD COLUMN IF NOT EXISTS legacy_rule_criteria jsonb;
--> statement-breakpoint
ALTER TABLE lms_groups ADD COLUMN IF NOT EXISTS legacy_auto_refresh boolean;
--> statement-breakpoint
ALTER TABLE lms_group_members ADD COLUMN IF NOT EXISTS legacy_invite_at timestamptz;
--> statement-breakpoint
ALTER TABLE lms_group_rules ADD COLUMN IF NOT EXISTS legacy_criteria_json jsonb;
--> statement-breakpoint
ALTER TABLE lms_group_rules ADD COLUMN IF NOT EXISTS legacy_unsupported_criteria jsonb;
