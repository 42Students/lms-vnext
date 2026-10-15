CREATE TABLE "placement_public_enquiry_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"work_email" varchar(254) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_public_enquiry_challenges_code_ck" CHECK ("placement_public_enquiry_challenges"."code_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "placement_public_enquiry_challenges_attempts_ck" CHECK ("placement_public_enquiry_challenges"."attempts" BETWEEN 0 AND 5),
	CONSTRAINT "placement_public_enquiry_challenges_expiry_ck" CHECK ("placement_public_enquiry_challenges"."expires_at" > "placement_public_enquiry_challenges"."requested_at")
);
--> statement-breakpoint
CREATE TABLE "placement_public_recruit_enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"company_name" varchar(160) NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_public_recruit_enquiries_message_ck" CHECK (char_length("placement_public_recruit_enquiries"."message") BETWEEN 10 AND 1500)
);
--> statement-breakpoint
ALTER TABLE "placement_public_enquiry_challenges" ADD CONSTRAINT "placement_public_enquiry_challenges_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_public_recruit_enquiries" ADD CONSTRAINT "placement_public_recruit_enquiries_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "public_enquiry_challenges_id_college_uq" ON "placement_public_enquiry_challenges" USING btree ("id","college_id");--> statement-breakpoint
ALTER TABLE "placement_public_recruit_enquiries" ADD CONSTRAINT "public_enquiry_challenge_college_fk" FOREIGN KEY ("challenge_id","college_id") REFERENCES "public"."placement_public_enquiry_challenges"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_enquiry_challenges_email_idx" ON "placement_public_enquiry_challenges" USING btree ("college_id","work_email","requested_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "public_enquiry_challenge_unique" ON "placement_public_recruit_enquiries" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "public_enquiry_college_created_idx" ON "placement_public_recruit_enquiries" USING btree ("college_id","created_at" DESC NULLS LAST);