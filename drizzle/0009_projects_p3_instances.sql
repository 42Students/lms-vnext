CREATE TABLE "project_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"template_version_id" uuid NOT NULL,
	"slug" varchar(96) NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"status" varchar(32) DEFAULT 'PLANNED' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"materialized_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_instances_status_ck" CHECK ("project_instances"."status" in ('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'))
);
--> statement-breakpoint
CREATE TABLE "project_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"template_key" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sequence" integer NOT NULL,
	"status" varchar(32) DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_releases_sequence_ck" CHECK ("project_releases"."sequence" >= 0),
	CONSTRAINT "project_releases_status_ck" CHECK ("project_releases"."status" in ('PLANNED', 'IN_PROGRESS', 'SHIPPED'))
);
--> statement-breakpoint
CREATE TABLE "project_sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"release_id" uuid NOT NULL,
	"template_key" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sequence" integer NOT NULL,
	"status" varchar(32) DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_sprints_sequence_ck" CHECK ("project_sprints"."sequence" >= 0),
	CONSTRAINT "project_sprints_status_ck" CHECK ("project_sprints"."status" in ('PLANNED', 'ACTIVE', 'COMPLETED'))
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sprint_id" uuid NOT NULL,
	"template_key" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"acceptance_criteria" text,
	"priority" varchar(16) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(32) DEFAULT 'TODO' NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_tasks_sequence_ck" CHECK ("project_tasks"."sequence" >= 0),
	CONSTRAINT "project_tasks_priority_ck" CHECK ("project_tasks"."priority" in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
	CONSTRAINT "project_tasks_status_ck" CHECK ("project_tasks"."status" in ('TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE'))
);
--> statement-breakpoint
CREATE TABLE "project_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"template_key" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"required" boolean DEFAULT false NOT NULL,
	"sequence" integer NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_resources_sequence_ck" CHECK ("project_resources"."sequence" >= 0),
	CONSTRAINT "project_resources_status_ck" CHECK ("project_resources"."status" in ('ACTIVE', 'ARCHIVED'))
);
--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_template_id_project_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."project_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_template_version_id_project_template_versions_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "public"."project_template_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_releases" ADD CONSTRAINT "project_releases_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_sprints" ADD CONSTRAINT "project_sprints_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_sprints" ADD CONSTRAINT "project_sprints_release_id_project_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."project_releases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_sprint_id_project_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."project_sprints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_instances_college_slug_uq" ON "project_instances" USING btree ("college_id",lower("slug"));--> statement-breakpoint
CREATE INDEX "project_instances_college_status_idx" ON "project_instances" USING btree ("college_id","status");--> statement-breakpoint
CREATE INDEX "project_instances_template_version_idx" ON "project_instances" USING btree ("template_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_releases_project_key_uq" ON "project_releases" USING btree ("project_id","template_key");--> statement-breakpoint
CREATE UNIQUE INDEX "project_releases_project_sequence_uq" ON "project_releases" USING btree ("project_id","sequence");--> statement-breakpoint
CREATE INDEX "project_releases_project_status_idx" ON "project_releases" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_sprints_project_key_uq" ON "project_sprints" USING btree ("project_id","template_key");--> statement-breakpoint
CREATE UNIQUE INDEX "project_sprints_release_sequence_uq" ON "project_sprints" USING btree ("release_id","sequence");--> statement-breakpoint
CREATE INDEX "project_sprints_project_status_idx" ON "project_sprints" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_tasks_project_key_uq" ON "project_tasks" USING btree ("project_id","template_key");--> statement-breakpoint
CREATE UNIQUE INDEX "project_tasks_sprint_sequence_uq" ON "project_tasks" USING btree ("sprint_id","sequence");--> statement-breakpoint
CREATE INDEX "project_tasks_project_status_idx" ON "project_tasks" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_resources_project_key_uq" ON "project_resources" USING btree ("project_id","template_key");--> statement-breakpoint
CREATE UNIQUE INDEX "project_resources_project_sequence_uq" ON "project_resources" USING btree ("project_id","sequence");--> statement-breakpoint
CREATE INDEX "project_resources_project_status_idx" ON "project_resources" USING btree ("project_id","status");