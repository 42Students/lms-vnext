-- DB-004 canonical person names and independent optimistic concurrency.
-- Existing display names are not parsed or split; previous values remain valid.
ALTER TABLE "users" ADD COLUMN "given_name" varchar(120);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "family_name" varchar(120);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "identity_profile_version" integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_given_name_nonblank_ck"
 CHECK ("given_name" IS NULL OR char_length(trim("given_name")) > 0);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_family_name_nonblank_ck"
 CHECK ("family_name" IS NULL OR char_length(trim("family_name")) > 0);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_identity_profile_version_ck"
 CHECK ("identity_profile_version" >= 1);
