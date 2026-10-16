CREATE TABLE "placement_public_enquiry_rate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"action" varchar(12) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_enquiry_rate_ip_ck" CHECK ("placement_public_enquiry_rate_events"."ip_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "public_enquiry_rate_action_ck" CHECK ("placement_public_enquiry_rate_events"."action" in ('SEND_CODE','RECRUIT'))
);
--> statement-breakpoint
ALTER TABLE "placement_public_enquiry_rate_events" ADD CONSTRAINT "placement_public_enquiry_rate_events_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_enquiry_rate_ip_action_idx" ON "placement_public_enquiry_rate_events" USING btree ("ip_hash","action","created_at" DESC NULLS LAST);