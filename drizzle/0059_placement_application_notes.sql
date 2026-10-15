CREATE TABLE "placement_application_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"side" varchar(12) NOT NULL,
	"company_id" uuid,
	"author_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_application_notes_side_ck" CHECK ("placement_application_notes"."side" in ('TPO', 'RECRUITER')),
	CONSTRAINT "placement_application_notes_company_ck" CHECK (("placement_application_notes"."side" = 'RECRUITER') = ("placement_application_notes"."company_id" is not null)),
	CONSTRAINT "placement_application_notes_body_ck" CHECK (length(trim("placement_application_notes"."body")) between 1 and 2000)
);
--> statement-breakpoint
ALTER TABLE "placement_application_notes" ADD CONSTRAINT "placement_application_notes_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_application_notes" ADD CONSTRAINT "placement_application_notes_company_id_placement_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."placement_companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_application_notes" ADD CONSTRAINT "placement_application_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_application_notes_application_side_idx" ON "placement_application_notes" USING btree ("application_id","side","created_at");