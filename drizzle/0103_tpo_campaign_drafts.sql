CREATE TABLE "placement_tpo_campaign_drafts" (
	"campaign_id" uuid PRIMARY KEY NOT NULL,
	"college_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"template_key" varchar(160) NOT NULL,
	"segment" varchar(24) NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tpo_campaign_draft_segment_ck" CHECK ("placement_tpo_campaign_drafts"."segment" IN ('ALL_ELIGIBLE','NEW','UNASSIGNED')),
	CONSTRAINT "tpo_campaign_draft_body_ck" CHECK (length(trim("placement_tpo_campaign_drafts"."body")) BETWEEN 2 AND 4000)
);
--> statement-breakpoint
ALTER TABLE "placement_tpo_campaign_drafts" ADD CONSTRAINT "placement_tpo_campaign_drafts_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_campaign_drafts" ADD CONSTRAINT "placement_tpo_campaign_drafts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_campaign_drafts" ADD CONSTRAINT "tpo_campaign_draft_campaign_scope_fk" FOREIGN KEY ("college_id","campaign_id") REFERENCES "public"."placement_tpo_email_campaigns"("college_id","id") ON DELETE restrict ON UPDATE no action;