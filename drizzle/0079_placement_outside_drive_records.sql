CREATE TABLE "placement_outside_drive_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"company_relationship_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"external_reference_url" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"notes" text,
	"recorded_by_user_id" uuid NOT NULL,
	"recorded_by_role" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outside_drives_title_ck" CHECK (length(btrim("placement_outside_drive_records"."title")) > 0),
	CONSTRAINT "outside_drives_role_ck" CHECK ("placement_outside_drive_records"."recorded_by_role" in ('TPO','RECRUITER'))
);
--> statement-breakpoint
CREATE INDEX "outside_drives_college_date_idx" ON "placement_outside_drive_records" USING btree ("college_id","occurred_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "outside_drives_relationship_college_parent_uq" ON "placement_company_relationships" USING btree ("id","college_id");
--> statement-breakpoint
ALTER TABLE "placement_outside_drive_records" ADD CONSTRAINT "placement_outside_drive_records_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_outside_drive_records" ADD CONSTRAINT "placement_outside_drive_records_company_relationship_id_placement_company_relationships_id_fk" FOREIGN KEY ("company_relationship_id") REFERENCES "public"."placement_company_relationships"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_outside_drive_records" ADD CONSTRAINT "placement_outside_drive_records_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_outside_drive_records" ADD CONSTRAINT "outside_drives_relationship_college_fk" FOREIGN KEY ("company_relationship_id","college_id") REFERENCES "public"."placement_company_relationships"("id","college_id") ON DELETE no action ON UPDATE no action;
