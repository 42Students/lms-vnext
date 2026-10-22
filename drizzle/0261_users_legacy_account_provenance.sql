-- [chat-14] Historic account provenance. Passwords and plaintext contacts are never reimported.
ALTER TABLE users ADD COLUMN legacy_user_name varchar(160);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN legacy_unique_id varchar(160);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN legacy_first_name varchar(160);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN legacy_last_name varchar(160);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN legacy_business_title varchar(160);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN legacy_user_type varchar(40);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN legacy_source_created_local timestamp;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN legacy_source_updated_local timestamp;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN legacy_source_time_zone varchar(80);
--> statement-breakpoint
CREATE INDEX users_legacy_username_idx ON users(lower(legacy_user_name))
 WHERE legacy_user_name IS NOT NULL;
--> statement-breakpoint
CREATE INDEX users_legacy_unique_id_idx ON users(legacy_unique_id)
 WHERE legacy_unique_id IS NOT NULL;