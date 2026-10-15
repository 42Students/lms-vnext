ALTER TABLE "faculty_profiles" ADD COLUMN "profile_document" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD COLUMN "profile_document_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_document_version_nonnegative" CHECK ("faculty_profiles"."profile_document_version" >= 0);