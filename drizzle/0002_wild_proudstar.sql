CREATE TYPE "public"."learner_program_enrollment_status" AS ENUM('ACTIVE', 'COMPLETED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."schedule_event_status" AS ENUM('SCHEDULED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."section_enrollment_status" AS ENUM('ACTIVE', 'COMPLETED', 'MOVED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."section_faculty_role" AS ENUM('ADVISOR', 'COORDINATOR');--> statement-breakpoint
CREATE TABLE "learner_program_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"cohort_id" uuid NOT NULL,
	"status" "learner_program_enrollment_status" DEFAULT 'ACTIVE' NOT NULL,
	"admitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learner_program_enrollments_lifecycle_ck" CHECK (("learner_program_enrollments"."status" = 'ACTIVE' and "learner_program_enrollments"."completed_at" is null and "learner_program_enrollments"."withdrawn_at" is null)
          or ("learner_program_enrollments"."status" = 'COMPLETED' and "learner_program_enrollments"."completed_at" is not null and "learner_program_enrollments"."withdrawn_at" is null)
          or ("learner_program_enrollments"."status" = 'WITHDRAWN' and "learner_program_enrollments"."withdrawn_at" is not null and "learner_program_enrollments"."completed_at" is null))
);
--> statement-breakpoint
CREATE TABLE "section_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_enrollment_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"academic_period_id" uuid NOT NULL,
	"status" "section_enrollment_status" DEFAULT 'ACTIVE' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "section_enrollments_lifecycle_ck" CHECK (("section_enrollments"."status" = 'ACTIVE' and "section_enrollments"."ended_at" is null)
          or ("section_enrollments"."status" <> 'ACTIVE' and "section_enrollments"."ended_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "section_faculty_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"role" "section_faculty_role" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_schedule_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"faculty_membership_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"location" text,
	"status" "schedule_event_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "section_schedule_events_time_order_ck" CHECK ("section_schedule_events"."ends_at" > "section_schedule_events"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "learner_program_enrollments" ADD CONSTRAINT "learner_program_enrollments_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_program_enrollments" ADD CONSTRAINT "learner_program_enrollments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_program_enrollments" ADD CONSTRAINT "learner_program_enrollments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_learner_enrollment_id_learner_program_enrollments_id_fk" FOREIGN KEY ("learner_enrollment_id") REFERENCES "public"."learner_program_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_faculty_assignments" ADD CONSTRAINT "section_faculty_assignments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_faculty_assignments" ADD CONSTRAINT "section_faculty_assignments_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_schedule_events" ADD CONSTRAINT "section_schedule_events_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_schedule_events" ADD CONSTRAINT "section_schedule_events_faculty_membership_id_college_memberships_id_fk" FOREIGN KEY ("faculty_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learner_program_enrollments_membership_program_cohort_uq" ON "learner_program_enrollments" USING btree ("membership_id","program_id","cohort_id");--> statement-breakpoint
CREATE UNIQUE INDEX "learner_program_enrollments_active_membership_uq" ON "learner_program_enrollments" USING btree ("membership_id") WHERE "learner_program_enrollments"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "learner_program_enrollments_program_status_idx" ON "learner_program_enrollments" USING btree ("program_id","status");--> statement-breakpoint
CREATE INDEX "learner_program_enrollments_cohort_status_idx" ON "learner_program_enrollments" USING btree ("cohort_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "section_enrollments_active_period_uq" ON "section_enrollments" USING btree ("learner_enrollment_id","academic_period_id") WHERE "section_enrollments"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "section_enrollments_section_status_idx" ON "section_enrollments" USING btree ("section_id","status");--> statement-breakpoint
CREATE INDEX "section_enrollments_learner_status_idx" ON "section_enrollments" USING btree ("learner_enrollment_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "section_faculty_assignments_active_uq" ON "section_faculty_assignments" USING btree ("section_id","membership_id","role") WHERE "section_faculty_assignments"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "section_faculty_assignments_membership_idx" ON "section_faculty_assignments" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "section_schedule_events_section_time_idx" ON "section_schedule_events" USING btree ("section_id","starts_at");--> statement-breakpoint
CREATE INDEX "section_schedule_events_faculty_time_idx" ON "section_schedule_events" USING btree ("faculty_membership_id","starts_at");