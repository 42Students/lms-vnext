ALTER TABLE "placement_tpo_campaign_drafts" DROP CONSTRAINT "tpo_campaign_draft_body_ck";--> statement-breakpoint
ALTER TABLE "placement_tpo_campaign_drafts" ADD COLUMN "sender_name" varchar(200) NOT NULL DEFAULT 'Placement cell';--> statement-breakpoint
ALTER TABLE "placement_tpo_campaign_drafts" ALTER COLUMN "sender_name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "placement_tpo_campaign_drafts" ADD COLUMN "suppressed_counts" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_tpo_campaign_drafts" ADD CONSTRAINT "tpo_campaign_draft_body_ck" CHECK (length(trim("placement_tpo_campaign_drafts"."body")) BETWEEN 2 AND 10000);