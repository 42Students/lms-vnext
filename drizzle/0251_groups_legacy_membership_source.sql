-- [chat-14] Historical group/source identity, membership rolls and actor events.
-- No legacy migration is performed under the current no-active-users plan.
ALTER TABLE lms_groups ADD COLUMN IF NOT EXISTS legacy_group_id bigint;
--> statement-breakpoint
ALTER TABLE lms_groups ADD COLUMN IF NOT EXISTS legacy_college_id integer;
--> statement-breakpoint
ALTER TABLE lms_groups ADD COLUMN IF NOT EXISTS legacy_organization_id integer;
--> statement-breakpoint
ALTER TABLE lms_groups ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
ALTER TABLE lms_group_members ADD COLUMN IF NOT EXISTS legacy_member_id bigint;
--> statement-breakpoint
ALTER TABLE lms_group_members ADD COLUMN IF NOT EXISTS legacy_learner_id integer;
--> statement-breakpoint
ALTER TABLE lms_group_members ADD COLUMN IF NOT EXISTS legacy_roll_number varchar(128);
--> statement-breakpoint
ALTER TABLE lms_group_member_events ADD COLUMN IF NOT EXISTS legacy_event_id bigint;
--> statement-breakpoint
ALTER TABLE lms_group_member_events ADD COLUMN IF NOT EXISTS legacy_actor_id integer;
