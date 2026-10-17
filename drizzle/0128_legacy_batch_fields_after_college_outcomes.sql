ALTER TABLE "placement_tpo_after_college" DROP CONSTRAINT "placement_tpo_after_college_outcome_ck";--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "academic_year" varchar(16);--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "inactive_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_legacy_date_order_ck" CHECK ("cohorts"."start_date" is null or "cohorts"."end_date" is null or "cohorts"."end_date" >= "cohorts"."start_date");--> statement-breakpoint
ALTER TABLE "placement_tpo_after_college" ADD CONSTRAINT "placement_tpo_after_college_outcome_ck" CHECK ("placement_tpo_after_college"."outcome" in ('PLACED_ON_CAMPUS','PLACED_OFF_CAMPUS','HIGHER_STUDIES','ENTREPRENEURSHIP','COMPETITIVE_EXAMS','NOT_INTERESTED','LOOKING_FOR_JOB','DEBARRED','NOT_DECIDED'));