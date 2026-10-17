ALTER TABLE "project_sprints" ADD COLUMN "goal" text;--> statement-breakpoint
ALTER TABLE "project_sprints" ADD COLUMN "definition_of_done" text;--> statement-breakpoint
ALTER TABLE "project_sprints" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "project_sprints" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "project_sprints" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "project_sprints" ADD CONSTRAINT "project_sprints_dates_ck" CHECK ("project_sprints"."start_date" is null or "project_sprints"."end_date" is null or "project_sprints"."end_date" >= "project_sprints"."start_date");