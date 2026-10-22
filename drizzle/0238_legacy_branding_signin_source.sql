-- [chat-14] Source branding row identity/login mode; effective authentication stays in college_signin_policies.
ALTER TABLE college_branding ADD COLUMN IF NOT EXISTS legacy_branding_id integer;
--> statement-breakpoint
ALTER TABLE college_branding ADD COLUMN IF NOT EXISTS legacy_college_id integer;
--> statement-breakpoint
ALTER TABLE college_branding ADD COLUMN IF NOT EXISTS legacy_login_methods varchar(32);
--> statement-breakpoint
ALTER TABLE college_branding ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
