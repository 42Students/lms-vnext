CREATE TABLE "project_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(96) NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"status" varchar(32) DEFAULT 'DRAFT' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"published_version" integer,
	"created_by_user_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_templates_status_ck" CHECK ("project_templates"."status" in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
	CONSTRAINT "project_templates_current_version_ck" CHECK ("project_templates"."current_version" >= 1),
	CONSTRAINT "project_templates_published_version_ck" CHECK ("project_templates"."published_version" is null or ("project_templates"."published_version" >= 1 and "project_templates"."published_version" <= "project_templates"."current_version"))
);
--> statement-breakpoint
CREATE TABLE "project_template_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"blueprint" jsonb NOT NULL,
	"change_note" text,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_template_versions_version_ck" CHECK ("project_template_versions"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "project_template_college_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"template_version_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"assigned_by_user_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_template_versions" ADD CONSTRAINT "project_template_versions_template_id_project_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."project_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_template_versions" ADD CONSTRAINT "project_template_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_template_college_assignments" ADD CONSTRAINT "project_template_college_assignments_template_id_project_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."project_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_template_college_assignments" ADD CONSTRAINT "project_template_college_assignments_template_version_id_project_template_versions_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "public"."project_template_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_template_college_assignments" ADD CONSTRAINT "project_template_college_assignments_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_template_college_assignments" ADD CONSTRAINT "project_template_college_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_templates_slug_uq" ON "project_templates" USING btree (lower("slug"));--> statement-breakpoint
CREATE INDEX "project_templates_status_idx" ON "project_templates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_template_versions_template_version_uq" ON "project_template_versions" USING btree ("template_id","version");--> statement-breakpoint
CREATE INDEX "project_template_versions_template_idx" ON "project_template_versions" USING btree ("template_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "project_template_college_assignments_active_uq" ON "project_template_college_assignments" USING btree ("template_id","college_id") WHERE "project_template_college_assignments"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "project_template_college_assignments_college_idx" ON "project_template_college_assignments" USING btree ("college_id","revoked_at");--> statement-breakpoint
CREATE INDEX "project_template_college_assignments_version_idx" ON "project_template_college_assignments" USING btree ("template_version_id");