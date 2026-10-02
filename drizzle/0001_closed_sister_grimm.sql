CREATE TYPE "public"."academic_period_status" AS ENUM('PLANNED', 'ACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."cohort_status" AS ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."section_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "academic_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "academic_period_status" DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "academic_periods_date_order_ck" CHECK ("academic_periods"."end_date" >= "academic_periods"."start_date")
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"start_period_id" uuid NOT NULL,
	"expected_end_period_id" uuid,
	"status" "cohort_status" DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"duration_terms" integer NOT NULL,
	"status" "program_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_duration_terms_ck" CHECK ("programs"."duration_terms" between 1 and 24)
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid NOT NULL,
	"academic_period_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"capacity" integer,
	"status" "section_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sections_capacity_ck" CHECK ("sections"."capacity" is null or "sections"."capacity" > 0)
);
--> statement-breakpoint
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_start_period_id_academic_periods_id_fk" FOREIGN KEY ("start_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_expected_end_period_id_academic_periods_id_fk" FOREIGN KEY ("expected_end_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_periods_college_code_uq" ON "academic_periods" USING btree ("college_id",lower("code"));--> statement-breakpoint
CREATE INDEX "academic_periods_college_status_idx" ON "academic_periods" USING btree ("college_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "cohorts_program_code_uq" ON "cohorts" USING btree ("program_id",lower("code"));--> statement-breakpoint
CREATE INDEX "cohorts_program_status_idx" ON "cohorts" USING btree ("program_id","status");--> statement-breakpoint
CREATE INDEX "cohorts_start_period_idx" ON "cohorts" USING btree ("start_period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_active_department_name_uq" ON "programs" USING btree ("department_id",lower("name")) WHERE "programs"."status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "programs_active_department_code_uq" ON "programs" USING btree ("department_id",lower("code")) WHERE "programs"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "programs_department_status_idx" ON "programs" USING btree ("department_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "sections_active_cohort_period_name_uq" ON "sections" USING btree ("cohort_id","academic_period_id",lower("name")) WHERE "sections"."status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "sections_active_cohort_period_code_uq" ON "sections" USING btree ("cohort_id","academic_period_id",lower("code")) WHERE "sections"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "sections_period_status_idx" ON "sections" USING btree ("academic_period_id","status");--> statement-breakpoint
CREATE INDEX "sections_cohort_status_idx" ON "sections" USING btree ("cohort_id","status");