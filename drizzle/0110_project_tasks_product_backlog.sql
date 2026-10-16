ALTER TABLE "project_tasks" ALTER COLUMN "sprint_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD COLUMN "carried_from_sprint_id" uuid;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD COLUMN "carried_over_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_carried_from_sprint_id_project_sprints_id_fk" FOREIGN KEY ("carried_from_sprint_id") REFERENCES "public"."project_sprints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_tasks_backlog_project_idx" ON "project_tasks" USING btree ("project_id","sequence") WHERE "project_tasks"."sprint_id" is null;