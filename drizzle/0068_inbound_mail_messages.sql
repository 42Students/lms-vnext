CREATE TABLE "inbound_mail_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_message_id" varchar(255) NOT NULL,
	"college_id" uuid,
	"from_address" varchar(320) NOT NULL,
	"to_address" varchar(320) NOT NULL,
	"subject" varchar(512) NOT NULL,
	"body_plain" text NOT NULL,
	"status" varchar(16) DEFAULT 'NEW' NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "inbound_mail_messages_status_ck" CHECK ("inbound_mail_messages"."status" in ('NEW', 'TRIAGED', 'RESOLVED')),
	CONSTRAINT "inbound_mail_messages_version_ck" CHECK ("inbound_mail_messages"."version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "inbound_mail_messages" ADD CONSTRAINT "inbound_mail_messages_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inbound_mail_source_key" ON "inbound_mail_messages" USING btree ("source_message_id");--> statement-breakpoint
CREATE INDEX "inbound_mail_received_at" ON "inbound_mail_messages" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "inbound_mail_college_status" ON "inbound_mail_messages" USING btree ("college_id","status");