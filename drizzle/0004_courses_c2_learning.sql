-- Imported lessons map old course/class IDs to verified UUID learning paths.
-- Legacy active=0, enabled=0, or deleted=1 is not learner-visible. Search and
-- normal course views must use the same archival and deletion filter.
-- Preserve zero-based sibling sequence order with stable UUID tie-breaking;
-- historical version numbers need an explicit CAS crosswalk. This greenfield
-- migration itself performs no historical data import.
CREATE TYPE "public"."learning_path_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."course_lesson_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."lesson_content_type" AS ENUM('RESOURCE', 'VIDEO', 'YOUTUBE', 'LIVE_CLASS');--> statement-breakpoint
CREATE TYPE "public"."lesson_content_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "course_learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "learning_path_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sequence" integer NOT NULL,
	"status" "course_lesson_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_lessons_sequence_ck" CHECK ("course_lessons"."sequence" >= 0)
);
--> statement-breakpoint
CREATE TABLE "lesson_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"delivery_id" uuid,
	"content_type" "lesson_content_type" NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"external_url" text,
	"storage_key" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"sequence" integer NOT NULL,
	"status" "lesson_content_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_contents_sequence_ck" CHECK ("lesson_contents"."sequence" >= 0),
	CONSTRAINT "lesson_contents_shape_ck" CHECK ((
        ("lesson_contents"."content_type" = 'RESOURCE'
          and ("lesson_contents"."notes" is not null or "lesson_contents"."external_url" is not null or "lesson_contents"."storage_key" is not null)
          and "lesson_contents"."starts_at" is null and "lesson_contents"."ends_at" is null)
        or
        ("lesson_contents"."content_type" = 'VIDEO'
          and "lesson_contents"."storage_key" is not null
          and "lesson_contents"."external_url" is null
          and "lesson_contents"."starts_at" is null and "lesson_contents"."ends_at" is null)
        or
        ("lesson_contents"."content_type" = 'YOUTUBE'
          and "lesson_contents"."external_url" is not null
          and "lesson_contents"."storage_key" is null
          and "lesson_contents"."starts_at" is null and "lesson_contents"."ends_at" is null)
        or
        ("lesson_contents"."content_type" = 'LIVE_CLASS'
          and "lesson_contents"."external_url" is not null
          and "lesson_contents"."storage_key" is null
          and "lesson_contents"."starts_at" is not null
          and "lesson_contents"."ends_at" is not null
          and "lesson_contents"."ends_at" > "lesson_contents"."starts_at")
      ))
);
--> statement-breakpoint
ALTER TABLE "course_learning_paths" ADD CONSTRAINT "course_learning_paths_offering_id_course_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_learning_path_id_course_learning_paths_id_fk" FOREIGN KEY ("learning_path_id") REFERENCES "public"."course_learning_paths"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_learning_paths_current_uq" ON "course_learning_paths" USING btree ("offering_id") WHERE "course_learning_paths"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE INDEX "course_learning_paths_offering_status_idx" ON "course_learning_paths" USING btree ("offering_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "course_lessons_active_name_uq" ON "course_lessons" USING btree ("learning_path_id",lower("name")) WHERE "course_lessons"."status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "course_lessons_active_sequence_uq" ON "course_lessons" USING btree ("learning_path_id","sequence") WHERE "course_lessons"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "course_lessons_path_status_idx" ON "course_lessons" USING btree ("learning_path_id","status");--> statement-breakpoint
CREATE INDEX "lesson_contents_lesson_status_sequence_idx" ON "lesson_contents" USING btree ("lesson_id","status","sequence");--> statement-breakpoint
CREATE INDEX "lesson_contents_delivery_status_idx" ON "lesson_contents" USING btree ("delivery_id","status");