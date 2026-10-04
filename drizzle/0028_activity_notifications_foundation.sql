CREATE TABLE "activity_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid,
  "college_id" uuid,
  "actor_user_id" uuid,
  "actor_membership_id" uuid,
  "module" varchar(32) NOT NULL,
  "event_type" varchar(120) NOT NULL,
  "importance" varchar(16) DEFAULT 'NORMAL' NOT NULL,
  "subject_type" varchar(80) NOT NULL,
  "subject_id" text NOT NULL,
  "subject_label" text,
  "summary" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "group_key" text,
  "dedupe_key" text,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "activity_events_scope_ck" CHECK ("activity_events"."college_id" is null or "activity_events"."organization_id" is not null),
  CONSTRAINT "activity_events_module_ck" CHECK ("activity_events"."module" in ('PLATFORM', 'IDENTITY', 'ACADEMICS', 'COURSES', 'PROJECTS', 'PLACEMENTS')),
  CONSTRAINT "activity_events_importance_ck" CHECK ("activity_events"."importance" in ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
  CONSTRAINT "activity_events_shape_ck" CHECK (length(trim("activity_events"."event_type")) > 0
        and length(trim("activity_events"."subject_type")) > 0
        and length(trim("activity_events"."subject_id")) > 0
        and length(trim("activity_events"."summary")) > 0)
);
--> statement-breakpoint
CREATE TABLE "in_app_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "action_href" text,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "in_app_notifications_shape_ck" CHECK (length(trim("in_app_notifications"."title")) > 0 and length(trim("in_app_notifications"."body")) > 0)
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_membership_id_college_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_event_id_activity_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."activity_events"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "activity_events_college_time_idx" ON "activity_events" USING btree ("college_id","occurred_at");
--> statement-breakpoint
CREATE INDEX "activity_events_organization_time_idx" ON "activity_events" USING btree ("organization_id","occurred_at");
--> statement-breakpoint
CREATE INDEX "activity_events_module_time_idx" ON "activity_events" USING btree ("module","occurred_at");
--> statement-breakpoint
CREATE INDEX "activity_events_actor_time_idx" ON "activity_events" USING btree ("actor_user_id","occurred_at");
--> statement-breakpoint
CREATE INDEX "activity_events_group_time_idx" ON "activity_events" USING btree ("group_key","occurred_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "activity_events_dedupe_uq" ON "activity_events" USING btree ("dedupe_key") WHERE "activity_events"."dedupe_key" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX "in_app_notifications_user_event_uq" ON "in_app_notifications" USING btree ("user_id","event_id");
--> statement-breakpoint
CREATE INDEX "in_app_notifications_user_read_time_idx" ON "in_app_notifications" USING btree ("user_id","read_at","created_at");
