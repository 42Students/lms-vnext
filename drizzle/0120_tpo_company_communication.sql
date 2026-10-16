CREATE TABLE "placement_tpo_company_communication" (
	"college_id" uuid NOT NULL,
	"company_key" varchar(180) NOT NULL,
	"status" varchar(24) NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_company_communication_college_id_company_key_pk" PRIMARY KEY("college_id","company_key"),
	CONSTRAINT "tpo_company_communication_status_ck" CHECK ("placement_tpo_company_communication"."status" IN ('NOT_CONTACTED','EMAILED','REPLIED','MEETING_SET','NOT_INTERESTED')),
	CONSTRAINT "tpo_company_communication_key_ck" CHECK (length(trim("placement_tpo_company_communication"."company_key"))>0)
);
--> statement-breakpoint
ALTER TABLE "placement_tpo_company_communication" ADD CONSTRAINT "placement_tpo_company_communication_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_company_communication" ADD CONSTRAINT "placement_tpo_company_communication_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tpo_company_communication_status_idx" ON "placement_tpo_company_communication" USING btree ("college_id","status");