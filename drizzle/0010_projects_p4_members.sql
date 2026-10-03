CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"role_label" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_members_role_ck" CHECK ("project_members"."role" in ('LEARNER', 'MENTOR')),
	CONSTRAINT "project_members_primary_role_ck" CHECK ("project_members"."is_primary" = false or "project_members"."role" = 'MENTOR')
);
--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_project_instances_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_instances"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_members_active_membership_uq" ON "project_members" USING btree ("project_id","membership_id") WHERE "project_members"."ended_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "project_members_active_primary_mentor_uq" ON "project_members" USING btree ("project_id") WHERE "project_members"."ended_at" is null and "project_members"."role" = 'MENTOR' and "project_members"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "project_members_membership_active_idx" ON "project_members" USING btree ("membership_id","ended_at");--> statement-breakpoint
CREATE INDEX "project_members_project_role_idx" ON "project_members" USING btree ("project_id","role","ended_at");