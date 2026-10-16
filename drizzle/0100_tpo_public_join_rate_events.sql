CREATE TABLE "placement_public_join_rate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"action" varchar(12) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_join_rate_hash_ck" CHECK ("placement_public_join_rate_events"."ip_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "public_join_rate_action_ck" CHECK ("placement_public_join_rate_events"."action" in ('SEND_CODE','JOIN'))
);
--> statement-breakpoint
ALTER TABLE "placement_public_join_rate_events" ADD CONSTRAINT "public_join_rate_link_fk" FOREIGN KEY ("link_id") REFERENCES "public"."placement_public_join_links"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_join_rate_network_time_idx" ON "placement_public_join_rate_events" USING btree ("ip_hash","action","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "public_join_rate_link_time_idx" ON "placement_public_join_rate_events" USING btree ("link_id","created_at" DESC NULLS LAST);