CREATE TABLE "placement_company_share_selections" (
	"share_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	CONSTRAINT "placement_company_share_selections_share_id_application_id_pk" PRIMARY KEY("share_id","application_id")
);
--> statement-breakpoint
ALTER TABLE "placement_company_share_selections" ADD CONSTRAINT "placement_company_share_selections_share_id_placement_company_applicant_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."placement_company_applicant_shares"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_company_share_selections" ADD CONSTRAINT "placement_company_share_selections_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pcss_application_idx" ON "placement_company_share_selections" USING btree ("application_id");