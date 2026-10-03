CREATE TYPE "public"."course_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."course_offering_type" AS ENUM('CORE', 'ELECTIVE');--> statement-breakpoint
CREATE TYPE "public"."course_offering_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."course_teaching_role" AS ENUM('PRIMARY', 'CO_TEACHER', 'TA');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"description" text,
	"status" "course_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"cohort_id" uuid NOT NULL,
	"academic_period_id" uuid NOT NULL,
	"type" "course_offering_type" DEFAULT 'CORE' NOT NULL,
	"credits" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" "course_offering_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_offerings_credits_ck" CHECK ("course_offerings"."credits" is null or ("course_offerings"."credits" between 1 and 30)),
	CONSTRAINT "course_offerings_display_order_ck" CHECK ("course_offerings"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "course_section_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_teaching_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"role" "course_teaching_role" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_deliveries" ADD CONSTRAINT "course_section_deliveries_offering_id_course_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_deliveries" ADD CONSTRAINT "course_section_deliveries_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_teaching_assignments" ADD CONSTRAINT "course_teaching_assignments_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_teaching_assignments" ADD CONSTRAINT "course_teaching_assignments_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "courses_active_department_name_uq" ON "courses" USING btree ("department_id",lower("name")) WHERE "courses"."status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "courses_active_department_code_uq" ON "courses" USING btree ("department_id",lower("code")) WHERE "courses"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "courses_department_status_idx" ON "courses" USING btree ("department_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "course_offerings_active_uq" ON "course_offerings" USING btree ("course_id","cohort_id","academic_period_id") WHERE "course_offerings"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "course_offerings_cohort_period_status_idx" ON "course_offerings" USING btree ("cohort_id","academic_period_id","status");--> statement-breakpoint
CREATE INDEX "course_offerings_course_status_idx" ON "course_offerings" USING btree ("course_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "course_section_deliveries_active_uq" ON "course_section_deliveries" USING btree ("offering_id","section_id") WHERE "course_section_deliveries"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "course_section_deliveries_section_idx" ON "course_section_deliveries" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "course_section_deliveries_offering_idx" ON "course_section_deliveries" USING btree ("offering_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_teaching_assignments_active_uq" ON "course_teaching_assignments" USING btree ("delivery_id","membership_id","role") WHERE "course_teaching_assignments"."ended_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "course_teaching_assignments_active_primary_uq" ON "course_teaching_assignments" USING btree ("delivery_id") WHERE "course_teaching_assignments"."ended_at" is null and "course_teaching_assignments"."role" = 'PRIMARY';--> statement-breakpoint
CREATE INDEX "course_teaching_assignments_membership_idx" ON "course_teaching_assignments" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "course_teaching_assignments_delivery_idx" ON "course_teaching_assignments" USING btree ("delivery_id");