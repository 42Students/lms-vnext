CREATE TYPE "public"."course_assignment_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."assignment_submission_type" AS ENUM('TEXT', 'LINK');--> statement-breakpoint
CREATE TYPE "public"."assignment_grading_status" AS ENUM('NOT_GRADED', 'GRADED');--> statement-breakpoint
CREATE TABLE "course_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"delivery_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp with time zone,
	"max_points" integer NOT NULL,
	"sequence" integer NOT NULL,
	"status" "course_assignment_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_assignments_points_ck" CHECK ("course_assignments"."max_points" between 1 and 10000),
	CONSTRAINT "course_assignments_sequence_ck" CHECK ("course_assignments"."sequence" >= 0)
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"delivery_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"submission_type" "assignment_submission_type" NOT NULL,
	"text_content" text,
	"submission_url" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"points_awarded" integer,
	"feedback" text,
	"grading_status" "assignment_grading_status" DEFAULT 'NOT_GRADED' NOT NULL,
	"grade_published" boolean DEFAULT false NOT NULL,
	"graded_by_user_id" uuid,
	"graded_at" timestamp with time zone,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_submissions_payload_ck" CHECK ((
        ("assignment_submissions"."submission_type" = 'TEXT'
          and "assignment_submissions"."text_content" is not null
          and length(trim("assignment_submissions"."text_content")) > 0
          and "assignment_submissions"."submission_url" is null)
        or
        ("assignment_submissions"."submission_type" = 'LINK'
          and "assignment_submissions"."submission_url" is not null
          and "assignment_submissions"."text_content" is null)
      )),
	CONSTRAINT "assignment_submissions_points_ck" CHECK ("assignment_submissions"."points_awarded" is null or "assignment_submissions"."points_awarded" >= 0),
	CONSTRAINT "assignment_submissions_version_ck" CHECK ("assignment_submissions"."version" >= 0),
	CONSTRAINT "assignment_submissions_grading_ck" CHECK ((
        ("assignment_submissions"."grading_status" = 'NOT_GRADED'
          and "assignment_submissions"."points_awarded" is null
          and "assignment_submissions"."graded_by_user_id" is null
          and "assignment_submissions"."graded_at" is null
          and "assignment_submissions"."grade_published" = false)
        or
        ("assignment_submissions"."grading_status" = 'GRADED'
          and "assignment_submissions"."points_awarded" is not null
          and "assignment_submissions"."graded_by_user_id" is not null
          and "assignment_submissions"."graded_at" is not null)
      ))
);
--> statement-breakpoint
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_course_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."course_assignments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_user_id_users_id_fk" FOREIGN KEY ("graded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_assignments_generic_active_name_uq" ON "course_assignments" USING btree ("lesson_id",lower("title")) WHERE "course_assignments"."delivery_id" is null and "course_assignments"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE UNIQUE INDEX "course_assignments_delivery_active_name_uq" ON "course_assignments" USING btree ("lesson_id","delivery_id",lower("title")) WHERE "course_assignments"."delivery_id" is not null and "course_assignments"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE UNIQUE INDEX "course_assignments_generic_active_sequence_uq" ON "course_assignments" USING btree ("lesson_id","sequence") WHERE "course_assignments"."delivery_id" is null and "course_assignments"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE UNIQUE INDEX "course_assignments_delivery_active_sequence_uq" ON "course_assignments" USING btree ("lesson_id","delivery_id","sequence") WHERE "course_assignments"."delivery_id" is not null and "course_assignments"."status" <> 'ARCHIVED';--> statement-breakpoint
CREATE INDEX "course_assignments_lesson_status_idx" ON "course_assignments" USING btree ("lesson_id","status");--> statement-breakpoint
CREATE INDEX "course_assignments_delivery_status_idx" ON "course_assignments" USING btree ("delivery_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_submissions_assignment_membership_uq" ON "assignment_submissions" USING btree ("assignment_id","membership_id");--> statement-breakpoint
CREATE INDEX "assignment_submissions_assignment_delivery_idx" ON "assignment_submissions" USING btree ("assignment_id","delivery_id");--> statement-breakpoint
CREATE INDEX "assignment_submissions_membership_idx" ON "assignment_submissions" USING btree ("membership_id");