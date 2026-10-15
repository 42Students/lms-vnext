CREATE TABLE "messaging_delivery_batches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"purpose" varchar(160) NOT NULL,
	"total" integer NOT NULL,
	"queued" integer DEFAULT 0 NOT NULL,
	"sent" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"suppressed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone,
	CONSTRAINT "messaging_delivery_batches_total_check" CHECK ("messaging_delivery_batches"."total">=0 and "messaging_delivery_batches"."total"<=500),
	CONSTRAINT "messaging_delivery_batches_queued_check" CHECK ("messaging_delivery_batches"."queued">=0),
	CONSTRAINT "messaging_delivery_batches_sent_check" CHECK ("messaging_delivery_batches"."sent">=0),
	CONSTRAINT "messaging_delivery_batches_failed_check" CHECK ("messaging_delivery_batches"."failed">=0),
	CONSTRAINT "messaging_delivery_batches_suppressed_check" CHECK ("messaging_delivery_batches"."suppressed">=0),
	CONSTRAINT "messaging_batch_count_ck" CHECK ("messaging_delivery_batches"."queued"+"messaging_delivery_batches"."sent"+"messaging_delivery_batches"."failed"+"messaging_delivery_batches"."suppressed"<="messaging_delivery_batches"."total")
);
--> statement-breakpoint
CREATE TABLE "messaging_delivery_receipts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"batch_id" uuid NOT NULL,
	"recipient_key" varchar(64) NOT NULL,
	"channel" varchar(16) NOT NULL,
	"template_key" varchar(160) NOT NULL,
	"purpose" varchar(160) NOT NULL,
	"status" varchar(16) NOT NULL,
	"reason" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messaging_delivery_receipts_recipient_key_check" CHECK ("messaging_delivery_receipts"."recipient_key" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "messaging_delivery_receipts_channel_check" CHECK ("messaging_delivery_receipts"."channel" in ('EMAIL','SMS')),
	CONSTRAINT "messaging_delivery_receipts_status_check" CHECK ("messaging_delivery_receipts"."status" in ('QUEUED','SENT','FAILED','SUPPRESSED')),
	CONSTRAINT "messaging_delivery_receipts_reason_check" CHECK ("messaging_delivery_receipts"."reason" in ('nonprod-not-allowlisted','unsubscribed','rate-limited','daily-cap','invalid-recipient'))
);
--> statement-breakpoint
ALTER TABLE "messaging_delivery_batches" ADD CONSTRAINT "messaging_delivery_batches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging_delivery_batches" ADD CONSTRAINT "messaging_delivery_batches_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging_delivery_batches" ADD CONSTRAINT "messaging_delivery_batches_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging_delivery_receipts" ADD CONSTRAINT "messaging_delivery_receipts_batch_id_messaging_delivery_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."messaging_delivery_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messaging_batches_scope_idx" ON "messaging_delivery_batches" USING btree ("college_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "messaging_receipts_batch_recipient_uq" ON "messaging_delivery_receipts" USING btree ("batch_id","recipient_key","channel","template_key","purpose");--> statement-breakpoint
CREATE INDEX "messaging_receipts_batch_idx" ON "messaging_delivery_receipts" USING btree ("batch_id","status");