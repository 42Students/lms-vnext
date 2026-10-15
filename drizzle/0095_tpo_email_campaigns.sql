CREATE TABLE "placement_tpo_email_campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"recipient_key" varchar(64) NOT NULL,
	"status" varchar(24) DEFAULT 'PENDING' NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_email_recipients_key_ck" CHECK ("placement_tpo_email_campaign_recipients"."recipient_key" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "placement_tpo_email_recipients_status_ck" CHECK ("placement_tpo_email_campaign_recipients"."status" in ('PENDING','SKIPPED_NO_EMAIL','SKIPPED_UNSUBSCRIBED','QUEUED','SENT','FAILED','UNSUBSCRIBED'))
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_email_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"status" varchar(16) DEFAULT 'DRAFT' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_email_campaigns_status_ck" CHECK ("placement_tpo_email_campaigns"."status" in ('DRAFT','SENDING','SENT','CANCELLED')),
	CONSTRAINT "placement_tpo_email_campaigns_total_ck" CHECK ("placement_tpo_email_campaigns"."total_recipients" between 0 and 500)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tpo_email_campaign_college_id_uq" ON "placement_tpo_email_campaigns" USING btree ("college_id","id");--> statement-breakpoint
ALTER TABLE "placement_tpo_email_campaign_recipients" ADD CONSTRAINT "tpo_email_recipient_campaign_fk" FOREIGN KEY ("college_id","campaign_id") REFERENCES "public"."placement_tpo_email_campaigns"("college_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_email_campaign_recipients" ADD CONSTRAINT "tpo_email_recipient_lead_fk" FOREIGN KEY ("college_id","lead_id") REFERENCES "public"."placement_tpo_leads"("college_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_email_campaigns" ADD CONSTRAINT "placement_tpo_email_campaigns_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_email_campaigns" ADD CONSTRAINT "placement_tpo_email_campaigns_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tpo_email_recipient_campaign_lead_uq" ON "placement_tpo_email_campaign_recipients" USING btree ("campaign_id","lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tpo_email_recipient_campaign_key_uq" ON "placement_tpo_email_campaign_recipients" USING btree ("campaign_id","recipient_key");--> statement-breakpoint
CREATE INDEX "tpo_email_recipient_college_campaign_idx" ON "placement_tpo_email_campaign_recipients" USING btree ("college_id","campaign_id");--> statement-breakpoint
CREATE INDEX "tpo_email_campaign_college_created_idx" ON "placement_tpo_email_campaigns" USING btree ("college_id","created_at");--> statement-breakpoint
CREATE OR REPLACE FUNCTION placement_tpo_email_recipient_cap() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE locked_id uuid; existing integer;
BEGIN
  -- Serialize concurrent inserts for one campaign on its row lock so the
  -- 500-recipient cap cannot be bypassed by racing transactions.
  SELECT id INTO locked_id FROM placement_tpo_email_campaigns
    WHERE id = NEW.campaign_id AND college_id = NEW.college_id FOR UPDATE;
  IF locked_id IS NULL THEN
    RETURN NEW; -- the scoped composite FK reports the missing campaign
  END IF;
  SELECT count(*) INTO existing FROM placement_tpo_email_campaign_recipients
    WHERE campaign_id = NEW.campaign_id;
  IF existing >= 500 THEN
    RAISE EXCEPTION 'Campaign recipient limit of 500 reached' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER placement_tpo_email_recipient_cap_trg BEFORE INSERT ON "placement_tpo_email_campaign_recipients"
  FOR EACH ROW EXECUTE FUNCTION placement_tpo_email_recipient_cap();
