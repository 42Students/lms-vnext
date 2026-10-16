ALTER TABLE "placement_public_join_links" ADD COLUMN "enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_public_join_links" ADD COLUMN "post_without_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_public_join_links" ADD COLUMN "opens_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_public_join_links" ADD COLUMN "joins_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_public_join_links" ADD CONSTRAINT "placement_public_join_links_opens_count_ck" CHECK ("placement_public_join_links"."opens_count" >= 0);--> statement-breakpoint
ALTER TABLE "placement_public_join_links" ADD CONSTRAINT "placement_public_join_links_joins_count_ck" CHECK ("placement_public_join_links"."joins_count" >= 0);