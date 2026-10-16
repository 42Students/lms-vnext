ALTER TABLE "project_instances" ADD COLUMN "progress_percent" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "phase" varchar(120);--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "due_label" varchar(160);--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "course_label" varchar(160);--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "section_id" uuid;--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "blocker" text;--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "next_action" text;--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "sprint_length_weeks" integer;--> statement-breakpoint
ALTER TABLE "project_instances" ADD COLUMN "estimation_unit" varchar(32) DEFAULT 'POINTS';--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_instances_section_idx" ON "project_instances" USING btree ("section_id") WHERE "project_instances"."section_id" is not null;--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_progress_percent_ck" CHECK ("project_instances"."progress_percent" between 0 and 100);--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_sprint_length_weeks_ck" CHECK ("project_instances"."sprint_length_weeks" is null or "project_instances"."sprint_length_weeks" between 1 and 104);--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_dates_ck" CHECK ("project_instances"."end_date" is null or "project_instances"."start_date" is null or "project_instances"."end_date" >= "project_instances"."start_date");--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_estimation_unit_ck" CHECK ("project_instances"."estimation_unit" is null or "project_instances"."estimation_unit" in ('POINTS','HOURS','TASKS'));